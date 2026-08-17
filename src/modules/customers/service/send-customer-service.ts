import { ErpCustomerRepository } from '../repository/erp-customer-repository.ts';
import { SendCustomerRequest, type inputCustomerMercos } from '../request/send-customer-request.ts';

export type ResultCustomer = {
  success: boolean
  message: string
  data: { enviados: string[]; erros: any[] } | null
}

export class SendCustomerService {

  async sendCustomer(codcliente?: number): Promise<ResultCustomer> {

    const sucessos: string[] = [];
    const erros: any[] = [];

    try {

      const clientes = await ErpCustomerRepository.findCustomersForSend(codcliente);

      if (clientes.length === 0) {
        return { success: false, message: 'Nenhum cliente encontrado para envio.', data: null };
      }

      for (const cliente of clientes) {

        try {

          const codigoBd = cliente.CODIGO;
          const razaoSocial = cliente.APELIDO || '';
          const nomeFantasia = cliente.NOME || '';
          const tipo = cliente.FIS_JUR || '';
          const cnpj = cliente.CPF || '';
          const inscricaoEstadual = cliente.RG || '';
          const rua = cliente.ENDERECO || '';
          const numero = cliente.NUMERO || '';
          const complemento = cliente.COMPLEMENTO || '';
          const bairro = cliente.BAIRRO || '';
          const cep = cliente.CEP || '';
          const cidade = cliente.CIDADE || '';
          const estado = cliente.ESTADO || '';
          const observacao = cliente.OBSERVACOES || '';
          let email = cliente.EMAIL || '';
          const telefoneRes = cliente.TELEFONE_RES || '';
          const telefoneCom = cliente.TELEFONE_COM || '';
          const celular = cliente.CELULAR || '';

          const dataRecadBd = cliente.DATA_RECAD ? new Date(cliente.DATA_RECAD).toISOString().replace('T', ' ').slice(0, 19) : '';

          let contribuinte = 'ISENTO';
          if (cliente.CONTRIB === 'S') {
            contribuinte = 'CONTRIBUINTE';
          } else if (cliente.CONTRIB === 'N') {
            contribuinte = 'NÃO CONTRIBUINTE';
          }

          if (!email.trim()) {
            email = 'SEM_EMAIL@email.com';
          }

          const input = {
            razao_social: razaoSocial,
            nome_fantasia: nomeFantasia,
            tipo,
            cnpj,
            inscricao_estadual: inscricaoEstadual,
            suframa: '',
            rua,
            numero,
            complemento,
            bairro,
            cep,
            cidade,
            estado,
            observacao,
            emails: [{ email }],
            telefones: [{ numero: telefoneRes }, { numero: telefoneCom }, { numero: celular }],
          } as inputCustomerMercos;

          const clienteMercos = await ErpCustomerRepository.findCustomerMercos(codigoBd);

          if (clienteMercos.length > 0) {

            const codigoClienteSite = clienteMercos[0].codigo_site;
            const dataRecadMercos = clienteMercos[0].data_recad;

            const precisaAtualizar = !dataRecadMercos
              || new Date(dataRecadBd) > new Date(dataRecadMercos);

            if (!precisaAtualizar) {
              console.log(`[ ] Cliente ${codigoBd} - ${nomeFantasia} já está atualizado.`);
              sucessos.push(String(codigoBd));
              continue;
            }

            console.log(`[V] Atualizando cliente ${codigoBd} - ${nomeFantasia} no Mercos...`);

            const statusRequest = await SendCustomerRequest.putCustomer(codigoClienteSite, input);

            if (statusRequest === 200 || statusRequest === 201) {
              await ErpCustomerRepository.updateCustomerSyncDate(codigoClienteSite, codigoBd, dataRecadBd);
              console.log(`[V] Cliente ${codigoBd} atualizado no Mercos e DATA_RECAD sincronizado no banco.`);
              sucessos.push(String(codigoBd));
            } else {
              console.error(`[X] Falha ao atualizar cliente ${codigoBd} no Mercos. Status: ${statusRequest}`);
              erros.push({ codigo: codigoBd, erro: 'Falha ao atualizar cliente no Mercos.', status: statusRequest });
            }

          } else {

            console.log(`[V] Inserindo cliente ${codigoBd} - ${nomeFantasia} no Mercos...`);

            const inputPost = { ...input, nome_excecao_fiscal: contribuinte, excluido: false };

            const result = await SendCustomerRequest.postCustomer(inputPost);

            if (result.status === 200 || result.status === 201) {
              const novoIdSite = result.id;

              if (novoIdSite) {
                const clientePosInsercao = await ErpCustomerRepository.findCustomerAfterInsert(codigoBd);

                if (clientePosInsercao.length > 0 && !clientePosInsercao[0].codigo_site) {
                  await ErpCustomerRepository.insertCustomerMercos({
                    codigoSite: novoIdSite,
                    codigoBd,
                    dataRecad: dataRecadBd,
                  });
                  console.log(`[V] Cliente ${codigoBd} inserido no Mercos (ID ${novoIdSite}) e registrado no banco.`);
                  sucessos.push(String(codigoBd));
                } else {
                  console.log(`[V] Cliente ${codigoBd} inserido no Mercos (ID ${novoIdSite}), porém já mapeado no banco.`);
                  sucessos.push(String(codigoBd));
                }
              } else {
                console.error(`[X] Cliente ${codigoBd} inserido no Mercos, porém o ID não foi retornado no header meuspedidosid.`);
                erros.push({ codigo: codigoBd, erro: 'Cliente inserido no Mercos, porém o ID não foi retornado no header meuspedidosid.' });
              }
            } else {
              console.error(`[X] Falha ao inserir cliente ${codigoBd} no Mercos. Status: ${result.status}`);
              erros.push({ codigo: codigoBd, erro: 'Falha ao inserir cliente no Mercos.', status: result.status });
            }
          }

        } catch (e: any) {
          console.error(`[X] Erro ao processar cliente ${cliente.CODIGO}:`, e);
          erros.push({ codigo: cliente.CODIGO, erro: e?.message || 'Erro ao processar cliente.' });
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { enviados: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar clientes:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar clientes.', data: null };
    }
  }
}
