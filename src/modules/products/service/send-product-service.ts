import axios, { isAxiosError } from 'axios';
import { ProductErpRepository } from '../repository/produto-repository.ts';
import { SendProductRequest, type inputProductMercos } from '../request/send-product-request.ts';

export type ProductResultItem = {
  codigo: number
  nome: string
  status: 'enviado' | 'atualizado' | 'ja_sincronizado' | 'erro'
  erro?: string
}

export type ResultProduct = {
  success: boolean
  message: string
  data: { sucesso: ProductResultItem[]; erros: ProductResultItem[] } | null
}

export class SendProductService {

  async sendProduct(codprod?: number): Promise<ResultProduct> {

    const sucessos: ProductResultItem[] = [];
    const erros: ProductResultItem[] = [];

    try {

      const tabelaPadrao = await ProductErpRepository.findDefaultTablePriceProduct(codprod ?? 0);
      const tabela = tabelaPadrao.length > 0 ? `AND tp.tabela = ${tabelaPadrao[0].CODIGO}` : '';

      const categorias = await ProductErpRepository.findCategoriesForSend(codprod);

      if (categorias.length === 0) {
        return { success: false, message: 'Nenhuma categoria encontrada para envio.', data: null };
      }

      for (const categoria of categorias) {

        const produtos = await ProductErpRepository.findProductsForSend({
          codigogrupobanco: categoria.codigo_bd,
          tabela,
          codprod,
        });

        for (const produto of produtos) {
          try {

            const sku = String(produto.CODIGO);
            const codigoSite = produto.codigo_site;
            const codigoBd = Number(produto.codigo_bd);
            const ativo = Boolean(produto.ATIVO);
            const unidade = produto.UNIDADE ?? '';
            const ncm = produto.NCM ?? '';
            const titulo = (produto.DESCRICAO || '').substring(0, 60).replace(/\\'/g, "'");
            const valorVenda = Number(Number(produto.PRECO).toFixed(2));
            const ipi = produto.IPI == null || Number(produto.IPI) === 0 ? null : Number(produto.IPI);

            const estoque = await ProductErpRepository.findStockProduct(produto.CODIGO);
            const estoqueprod = estoque.length > 0 ? Number(Number(estoque[0].ESTOQUE).toFixed(4)) : 0;

            const input = {
              nome: titulo,
              preco_tabela: valorVenda,
              preco_minimo: null,
              codigo: produto.CODIGO,
              comissao: null,
              ipi,
              tipo_ipi: 'P',
              st: null,
              moeda: '0',
              unidade,
              saldo_estoque: estoqueprod,
              excluido: false,
              ativo,
              categoria_id: categoria.codigo_site,
              codigo_ncm: ncm,
              peso_bruto: produto.PESO,
              largura: produto.LARGURA,
              altura: produto.ALTURA,
              comprimento: produto.COMPRIMENTO,
              peso_dimensoes_unitario: true,
            } as inputProductMercos;

            const datarecadsite = produto.DATARECAD_SITE;
            const datarecadbanco = produto.DATARECAD_BANCO ?? '';

            if (!codigoSite || codigoSite === '') {

              console.log(`[V] Inserindo produto ${sku} no Mercos...`);

            const result = await SendProductRequest.postProduct(input);

              if (result.success ) {
              const id = result.data;
                const novoIdSite = id;

                if (novoIdSite) {
                  await ProductErpRepository.insertProductMercos({
                    codigoSite: novoIdSite,
                    codigoBd:produto.CODIGO,
                    dataRecad: datarecadbanco,
                  });
                  console.log(`[V] Produto ${sku} inserido no Mercos (ID ${novoIdSite}) e registrado no banco.`);
                  sucessos.push({ codigo: produto.CODIGO, nome: titulo, status: 'enviado' });
                } else {
                  console.error(`[X] Produto ${sku} inserido no Mercos, porém o ID não foi retornado no header meuspedidosid.`);
                  erros.push({ codigo: produto.CODIGO, nome: titulo, status: 'erro', erro: 'Produto inserido no Mercos, porém o ID não foi retornado no header meuspedidosid.' });
                }
              } else {
                const resutlMessageequest =  result.data ; 
                console.error(`[X] Falha ao inserir produto ${sku} no Mercos.  ${JSON.stringify(resutlMessageequest?.erros)} `);
                erros.push({ codigo: produto.CODIGO, nome: titulo, status: 'erro', erro: `Falha ao inserir produto no Mercos. ${JSON.stringify(resutlMessageequest?.erros)}` });
              }


            } else {

              const precisaAtualizar = !datarecadsite
                || datarecadsite === ''
                || new Date(datarecadbanco) > new Date(datarecadsite);

              if (!precisaAtualizar) {
                console.log(`[ ] Produto ${sku} já está atualizado.`);
                sucessos.push({ codigo: produto.CODIGO, nome: titulo, status: 'ja_sincronizado' });
                continue;
              }

              console.log(`[V] Atualizando produto ${sku} no Mercos...`);

              const statusRequest = await SendProductRequest.putProduct(codigoSite, input);

              if (statusRequest === 200 || statusRequest === 201) {
                await ProductErpRepository.updateProductSyncDate(codigoSite, codigoBd, datarecadbanco);
                console.log(`[V] Produto ${sku} atualizado no Mercos e DATA_RECAD sincronizado no banco.`);
                sucessos.push({ codigo: produto.CODIGO, nome: titulo, status: 'atualizado' });
              } else {
                console.error(`[X] Falha ao atualizar produto ${sku} no Mercos. Status: ${statusRequest}`);
                erros.push({ codigo: produto.CODIGO, nome: titulo, status: 'erro', erro: `Falha ao atualizar produto no Mercos. Status: ${statusRequest}` });
              }
            }

          } catch (e: any) {
            console.error(`[X] Erro ao processar produto ${produto.CODIGO}:`, e?.response?.data);
            erros.push({ codigo: produto.CODIGO, nome: produto.DESCRICAO || '', status: 'erro', erro: e?.message || 'Erro ao processar produto.' });
          }
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { sucesso: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar produtos:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar produtos.', data: null };
    }
  }
}
