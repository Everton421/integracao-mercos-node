import { conn2 } from "../../../database/database-connection.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { FormatString } from "../../../shared/utils/format-string.ts";
import type { MercosCliente } from "../../customers/contracts/mercos-cliente.ts"; 
import { ReceiveCustomerService } from "../../customers/service/receive-customer-service.ts";
import type { MercosPedido } from "../contracts/mercos-order.ts";
import { ErpOrderRepository } from "../repository/erp-order-repository.ts";
import { ReceiveOrderRequest } from "../request/receive-order-request.ts";
import { CalculateDiscount } from "../utils/calculate-discount.ts";

export class ProcessOrdersErpService{

    async process(pedidos: MercosPedido[]){

      const connection = await conn2.getConnection();

            const recebidos: string[] = [];
            const atualizados: string[] = [];
            const inseridos: string[] = [];
            const erros: any[] = [];
        for (const pedido of pedidos) {
               console.log(`[V] Processando pedido ${pedido.id} cliente: ${pedido.cliente_razao_social}...`)
        
                try {

                  if (!(Number(pedido.status) === 2 && Number(pedido.status_faturamento) === 0)) {
                    console.log(`[X] Pedido com status ${pedido.status} e status de faturamento ${pedido.status_faturamento}, o pedido não será processado.`);
                    continue;
                  }

                    // valida cliente do pedido...
                    // recebe/atualiza cadastro do cliente
                    const receiveCustomerService = new ReceiveCustomerService();
                      await receiveCustomerService.receiveCustomerById(pedido.cliente_id);


                  let codigoCliente = 0;
                  let customerCnpj = '';
                  let clienteMercos: MercosCliente;
                  try {
                    clienteMercos = await ReceiveOrderRequest.getCliente(pedido.cliente_id);
                        customerCnpj = pedido.cliente_cnpj.replace(/[^\d]/g, '');

                        const cpfMascarado = new FormatString().maskCpfCnpj(customerCnpj);

                        // buscando o cliente no erp pelo cnpj...
                        const resultVerifyClientErp = await ErpOrderRepository.findClienteByCpf(cpfMascarado);
                            if(resultVerifyClientErp.length > 0 ){
                             codigoCliente= resultVerifyClientErp[0].CODIGO;
                            }

                  } catch (e) {
                    throw new Error('Falha ao buscar cliente do pedido.');
                  }
        
                  const codigoSite = pedido.id;
                  const clienteSite = pedido.cliente_id;
                  const criadorId = pedido.criador_id;
                  const idPagamentoSite = pedido.forma_pagamento_id;
                  const idCondicaoDePagamento = pedido.condicao_pagamento_id;
                  const idTransportadora = pedido.transportadora_id;
                  const descTipo = 'MERCOS - MOBILE';
                  const tipoVenda = '1';
                  const ultimaAlteracao = new Date(pedido.ultima_alteracao).toISOString().replace('T', ' ').slice(0, 19);
                  const obs = new FormatString().tiraAspas(pedido.observacoes || '');
        
                  let idPagamento: number =0;
                  let parcelas = 1;
                  let intervalo = 0;
                  let diasEntrada = 0;
        
                  if (idCondicaoDePagamento) {
                    const condicao = await ErpOrderRepository.findCondicaoPagamento(idCondicaoDePagamento);
                    if (condicao.length > 0) {
                      idPagamento = condicao[0].CODIGO || 0;
                      parcelas = condicao[0].NUM_PARCELAS;
                      intervalo = condicao[0].INTERVALO;
                      diasEntrada = condicao[0].DIAS_ENTRADA;
                    }
                  }
        
                  let codTransp: number | string = 0;
                  if (idTransportadora != null) {
                    const transp = await ErpOrderRepository.findTransportadoraBd(idTransportadora);
                    if (transp.length > 0) {
                      codTransp = transp[0].codigo_bd;
                    }
                  }
        
                  const pedidoTotalProd = pedido.total;
                  const pedidoFrete = pedido.valor_frete && pedido.valor_frete > 0 ? pedido.valor_frete : 0;
                  const pedidoTotal = pedidoTotalProd + pedidoFrete;
                  const pedidoStatus = pedido.status;
                  const pedidoItens = pedido.itens || [];
        
                  let descProd = 0;
                  for (const itens1 of pedidoItens) {
                    if (itens1.excluido === true) {
                      continue;
                    }
                    const valorProd1 = itens1.preco_tabela * itens1.quantidade;
                    const descontos1 =  CalculateDiscount.calcularDescontosItem(itens1, valorProd1);
                    descProd += descontos1.descontoTotal;
                  }
        
        
                  const pedidoBd = await ErpOrderRepository.findPedidoByCodSite(codigoSite);
        
                  if (pedidoBd.length > 0) {
        
                    const codigoOrcamento = pedidoBd[0].CODIGO;
                    const dataInclusaoM = pedidoBd[0].data_inclusao ? new Date(pedidoBd[0].data_inclusao).toISOString().replace('T', ' ').slice(0, 19) : '';
        
                    if (ultimaAlteracao > dataInclusaoM) {
        
                      console.log(`[V] Atualizando pedido ${codigoSite} no ERP...`);
        
                      let codigoVendBd: number | string = '';
                      const vendedor = await ErpOrderRepository.findUsuarioMercos(criadorId);
                      if (vendedor.length > 0) {
                        codigoVendBd = vendedor[0].codigo_bd;
                      }
        
                      await ErpOrderRepository.updateCadOrca(codigoSite, {
                        cliente: codigoCliente,
                        totalProdutos: pedidoTotalProd,
                        totalGeral: pedidoTotal,
                        descProd,
                        valorFrete: pedidoFrete,
                        vendedor: codigoVendBd,
                        qtdeParcelas: parcelas,
                        transportadora: codTransp,
                        observacoes2: obs,
                        formaPagamento: idPagamento,
                        tipo: tipoVenda,
                        contato: descTipo,
                      });
        
                      await ErpOrderRepository.deleteProOrca(codigoOrcamento);
                      await ErpOrderRepository.deleteParOrca(codigoOrcamento);
        
                      let i = 1;
                      for (const itens of pedidoItens) {
        
                        const custo = await ErpOrderRepository.findProdutoCusto(itens.produto_codigo);
                        let ultimoCusto: number | null = null;
                        let custoMedio: number | null = null;
                        let tpUnid = '';
                        if (custo.length > 0) {
                          ultimoCusto = custo[0].ULT_CUSTO;
                          custoMedio = custo[0].CUSTO_MEDIO;
                          tpUnid = custo[0].SIGLA;
                        }
        
                        const valorProd = itens.preco_tabela * itens.quantidade;
                        const descontos = CalculateDiscount.calcularDescontosItem(itens, valorProd);
        
                        let tabprecoVend = '';
                        if (itens.tabela_preco_id) {
                          const preco = await ErpOrderRepository.findTabPreco(itens.tabela_preco_id);
                          if (preco.length > 0) {
                            tabprecoVend = String(preco[0].codigo_bd);
                          } else {
                            const padrao = await ErpOrderRepository.findTabPrecoPadrao();
                            if (padrao.length > 0) {
                              tabprecoVend = String(padrao[0].CODIGO);
                            }
                          }
                        }
        
                        if (itens.excluido === false) {
                          await ErpOrderRepository.insertProOrca({
                            orcamento: codigoOrcamento,
                            sequencia: i,
                            produto: itens.produto_codigo,
                            unidade: tpUnid,
                            quantidade: itens.quantidade,
                            unitario: itens.preco_tabela,
                            tabela: tabprecoVend,
                            precoTabela: valorProd,
                            custoMedio,
                            ultimoCusto,
                            frete: pedidoFrete,
                            ipi: itens.ipi,
                            desconto: descontos.descontoTotal,
                          });
                          i++;
                        }
                      }
        
                      if (idCondicaoDePagamento > 0) {
                        const condicao2 = await ErpOrderRepository.findCondicaoPagamento(idCondicaoDePagamento);
                        if (condicao2.length > 0) {
                          const idPagamentoParc = condicao2[0].CODIGO || 0;
                          const parcelasParc = condicao2[0].NUM_PARCELAS;
                          const intervaloParc = condicao2[0].INTERVALO;
                          const diasEntradaParc = condicao2[0].DIAS_ENTRADA;
                          const valorParcela = pedidoTotalProd / parcelasParc;
                          for (let p = 0; p <= parcelasParc; p++) {
                            const datapagto = p === 0 ? diasEntradaParc : (diasEntradaParc + (intervaloParc * p));
                            const parc = p + 1;
                            await ErpOrderRepository.insertParOrca({ orcamento: codigoOrcamento, parcela: parc, valor: valorParcela, diasPagto: datapagto, tipoReceb: idPagamentoParc });
                          }
                        }
                      }
        
                      await ErpOrderRepository.updatePedidoMercosDataInclusao(codigoSite, ultimaAlteracao);
                      console.log(`[V] Pedido ${codigoSite} atualizado. Cliente: ${pedido.cliente_nome_fantasia}`);
                      atualizados.push(String(codigoSite));
        
                    } else {
                      console.log(`[ ] Pedido ${codigoSite} já está atualizado.`);
                    }
        
                  } else {
        
                    console.log(`[V] Inserindo pedido ${codigoSite} no ERP...`);
         
                    let codigoVendBd: number =0;
                    const vendedor = await ErpOrderRepository.findUsuarioMercos(criadorId);
                    if (vendedor.length > 0) {
                      codigoVendBd = vendedor[0].codigo_bd;
                    }
        
                    const agora = new Date().toISOString().replace('T', ' ').slice(0, 19);
        
                    await ErpOrderRepository.insertCadOrca({
                      codSite: codigoSite,
                      cliente: codigoCliente,
                      totalProdutos: pedidoTotalProd,
                      descProd,
                      totalGeral: pedidoTotal,
                      agora,
                      valorFrete: pedidoFrete,
                      vendedor: codigoVendBd,
                      contato: descTipo,
                      observacoes2: obs,
                      tipo: tipoVenda,
                      qtdeParcelas: parcelas,
                      formaPagamento: idPagamento,
                    });
        
                    const cadOrca = await ErpOrderRepository.findCadOrcaByCodSite(codigoSite);
                    const codigoOrcamento = cadOrca[0].CODIGO;
        
                    let i = 1;
                    for (const itens of pedidoItens) {
        
                      if (itens.excluido === true) {
                        continue;
                      }
        
                      const custo = await ErpOrderRepository.findProdutoCusto(itens.produto_codigo);
                      let ultimoCusto: number | null = null;
                      let custoMedio: number | null = null;
                      let tpUnid = '';
                      if (custo.length > 0) {
                        ultimoCusto = custo[0].ULT_CUSTO;
                        custoMedio = custo[0].CUSTO_MEDIO;
                        tpUnid = custo[0].SIGLA;
                      }
        
                      const valorProd = itens.preco_tabela * itens.quantidade;
                      const descontos = CalculateDiscount.calcularDescontosItem(itens, valorProd);
        
                      let tabprecoVend = '0';
                      if (itens.tabela_preco_id) {
                        const preco = await ErpOrderRepository.findTabPreco(itens.tabela_preco_id);
                        if (preco.length > 0) {
                          tabprecoVend = String(preco[0].codigo_bd);
                        } else {
                          const padrao = await ErpOrderRepository.findTabPrecoPadrao();
                          if (padrao.length > 0) {
                            tabprecoVend = String(padrao[0].CODIGO);
                          }
                        }
                      }
        
                      await ErpOrderRepository.insertProOrca({
                        orcamento: codigoOrcamento,
                        sequencia: i,
                        produto: itens.produto_codigo,
                        unidade: tpUnid,
                        quantidade: itens.quantidade,
                        unitario: itens.preco_tabela,
                        tabela: tabprecoVend,
                        precoTabela: valorProd,
                        custoMedio,
                        ultimoCusto,
                        frete: pedidoFrete,
                        ipi: itens.ipi,
                        desconto: descontos.descontoTotal,
                      });
                      i++;
                    }
        
                    if (idPagamentoSite > 0) {
                      const pagamento = await ErpOrderRepository.findPagamento(idPagamentoSite);
                      if (pagamento.length > 0) {
                        const idPagamentoParc = pagamento[0].CODIGO;
                        const parcelasParc = pagamento[0].NUM_PARCELAS;
                        const intervaloParc = pagamento[0].INTERVALO;
                        const diasEntradaParc = pagamento[0].DIAS_ENTRADA;
                        const valorParcela = pedidoTotalProd / parcelasParc;
                        for (let p = 0; p <= parcelasParc; p++) {
                          const datapagto = p === 0 ? diasEntradaParc : (diasEntradaParc + (intervaloParc * p));
                          const parc = p + 1;
                          await ErpOrderRepository.insertParOrca({ orcamento: codigoOrcamento, parcela: parc, valor: valorParcela, diasPagto: datapagto, tipoReceb: idPagamentoParc });
                        }
                      }
                    }
        
                    await ErpOrderRepository.insertPedidoMercos({
                      codigoPedidoSite: codigoSite,
                      codigoPedidoBd: codigoOrcamento,
                      dataInclusao: ultimaAlteracao,
                      situacao: Number(pedidoStatus),
                    });
        
                    console.log(`[V] Pedido ${codigoSite} inserido. Cliente: ${pedido.cliente_nome_fantasia} `);
                    inseridos.push(String(codigoSite));
                  }

                  recebidos.push(String(codigoSite));
                  
                } catch (e: any) {
                    connection.rollback();
                  console.error(`[X] Erro ao processar pedido ${pedido?.id}:`, e);
                  erros.push({ id: pedido?.id, erro: e?.message || 'Erro ao processar pedido.' });

                }finally{
                }
              }
              
              return{ 
                  recebidos,
                  atualizados,
                  inseridos,
                  erros 
                }
    }
}