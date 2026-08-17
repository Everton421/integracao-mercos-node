import { ErpCustomerRepository } from '../repository/erp-customer-repository.ts';
import { FormatString } from '../../../shared/utils/format-string.ts';
import type { MercosCliente } from '../contracts/mercos-cliente.ts';

export type ResultProcessCustomers = {
  recebidos: string[]
  atualizados: string[]
  inseridos: string[]
  erros: any[]
}

export class ProcessCustomersErpService {

  async process(clientes: MercosCliente[]): Promise<ResultProcessCustomers> {

    const recebidos: string[] = [];
    const atualizados: string[] = [];
    const inseridos: string[] = [];
    const erros: any[] = [];

    for (const cliente of clientes) {

      try {

        if (cliente.excluido) {
          continue;
        }

        const id = String(cliente.id);
        const dataUltimaAlteracao = new Date(cliente.ultima_alteracao).toISOString().replace('T', ' ').slice(0, 19);
        const cpf = (cliente.cnpj || '').replace(/[^\d]/g, '');

        if (!cpf) {
          continue;
        }

        const tipopessoa = cliente.tipo || '';
        const nome = new FormatString().removeAccents(new FormatString().tiraAspas((cliente.razao_social || '').toUpperCase()));
        const email = cliente.emails?.[0]?.email || '';
        const rua = new FormatString().tiraAspas((cliente.rua || '').trim());
        const numero = cliente.numero || '';
        const comentario = new FormatString().tiraAspas((cliente.observacao || '').toUpperCase());
        const bairro = new FormatString().tiraAspas((cliente.bairro || '').trim());
        const cidade = new FormatString().tiraAspas((cliente.cidade || '').trim());
        const complemento = (cliente.complemento || '').trim();
        const cep = cliente.cep || '';
        let uf = new FormatString().removeAccents(cliente.estado || '');
        uf = new FormatString().stateToUF(uf);
        const dataAlteracao = new Date(cliente.ultima_alteracao).toISOString().replace('T', ' ').slice(0, 19);

        let inscricao = (cliente.inscricao_estadual || '').slice(0, 19);

        let contribuinte = 'N';
        if (cliente.nome_excecao_fiscal === 'CONTRIBUINTE' || cliente.nome_excecao_fiscal === 'REVENDEDOR') {
          contribuinte = 'S';
        }

        let telefone = '';
        for (const tel of cliente.telefones || []) {
          const telefoneVal = (tel.numero || '').replace(/[^\d]/g, '');
          if (telefoneVal) {
            telefone = telefoneVal.length > 15 ? telefoneVal.slice(0, 15) : telefoneVal;
          }
        }

        let obs = comentario;
        if (obs.length > 99) {
          obs = obs.slice(0, 99);
        }

        const cpfMascarado = new FormatString().maskCpfCnpj(cpf);
        const cepMascarado = new FormatString().maskCep(cep);

        const clientesBd = await ErpCustomerRepository.findCustomerByCpf(cpfMascarado);

        if (clientesBd.length > 0) {

          for (const clienteBd of clientesBd) {

            const idCliente = clienteBd.CODIGO;
            const dataRecadBd = clienteBd.DATA_RECAD ? new Date(clienteBd.DATA_RECAD).toISOString().replace('T', ' ').slice(0, 19) : '';

            if (dataUltimaAlteracao > dataRecadBd) {

              const updates: { coluna: string, valor: string }[] = [];

              if (nome) updates.push({ coluna: 'nome', valor: nome });
              if (nome) updates.push({ coluna: 'apelido', valor: nome });
              if (inscricao) updates.push({ coluna: 'rg', valor: inscricao });
              if (rua) updates.push({ coluna: 'endereco', valor: rua });
              if (contribuinte) updates.push({ coluna: 'contrib', valor: contribuinte });
              if (numero) updates.push({ coluna: 'numero', valor: numero });
              if (cepMascarado) updates.push({ coluna: 'cep', valor: cepMascarado });
              if (bairro) updates.push({ coluna: 'bairro', valor: bairro });
              if (cidade) updates.push({ coluna: 'cidade', valor: cidade });
              if (telefone) updates.push({ coluna: 'telefone_res', valor: telefone });
              if (email) updates.push({ coluna: 'email', valor: email });
              if (email) updates.push({ coluna: 'email_fiscal', valor: email });
              if (cpfMascarado) updates.push({ coluna: 'cpf', valor: cpfMascarado });
              if (uf) updates.push({ coluna: 'estado', valor: uf });

              if (updates.length > 0) {
                await ErpCustomerRepository.updateCustomer(idCliente, updates);
                await ErpCustomerRepository.updateCustomerMercosDataRecad(idCliente);
                console.log(`[V] Cliente ${idCliente} - ${nome} atualizado com sucesso.`);
                atualizados.push(String(idCliente));
              } else {
                console.log(`[ ] Cliente ${idCliente} - ${nome} sem campos para atualizar.`);
              }

            } else {
              console.log(`[ ] Cliente ${idCliente} - ${nome} já está atualizado.`);
            }
          }

        } else {

          console.log(`[V] Inserindo cliente ${nome} no ERP...`);

          const agora = new Date().toISOString().replace('T', ' ').slice(0, 19);

          await ErpCustomerRepository.insertCustomer({
            nome,
            apelido: nome,
            fisJur: tipopessoa.toUpperCase(),
            cpf: cpfMascarado,
            rg: inscricao,
            contrib: contribuinte,
            email: email.toUpperCase(),
            endereco: rua.toUpperCase(),
            numero,
            observacoes: obs.toUpperCase(),
            bairro: bairro.toUpperCase(),
            cidade: cidade.toUpperCase(),
            estado: uf.toUpperCase(),
            cep: cepMascarado,
            telefone,
            dataCadastro: agora,
            dataRecad: agora,
          });

          const clienteBdInserido = await ErpCustomerRepository.findCustomerAfterInsertByCpf(nome, cpfMascarado);

          if (clienteBdInserido.length > 0) {
            const codigoClienteBd = clienteBdInserido[0].CODIGO;
            await ErpCustomerRepository.insertCustomerMercos({
              codigoSite: id,
              codigoBd: codigoClienteBd,
              dataRecad: dataAlteracao,
            });
            console.log(`[V] Cliente ${codigoClienteBd} - ${nome} inserido no ERP e registrado no banco.`);
            inseridos.push(String(codigoClienteBd));
          } else {
            console.error(`[X] Cliente ${nome} inserido no ERP, porém não localizado para registro.`);
            erros.push({ id, erro: 'Cliente inserido no ERP, porém não localizado para registro.' });
          }
        }

        recebidos.push(id);

      } catch (e: any) {
        console.error(`[X] Erro ao processar cliente Mercos ${cliente?.id}:`, e);
        erros.push({ id: cliente?.id, erro: e?.message || 'Erro ao processar cliente.' });
      }
    }

    return { recebidos, atualizados, inseridos, erros };
  }
}
