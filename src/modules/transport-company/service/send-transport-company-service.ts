import { ErpTransportCompanyRepository } from '../repository/erp-transport-company-repository.ts';
import { SendTransportCompanyRequest, type inputTransportCompanyMercos } from '../request/send-transport-company-request.ts';

export type ResultTransportCompany = {
  success: boolean
  message: string
  data: { enviados: string[]; erros: any[] } | null
}

export class SendTransportCompanyService {

  async sendTransportCompany(codtransportadora?: number): Promise<ResultTransportCompany> {

    const sucessos: string[] = [];
    const erros: any[] = [];

    try {

      const transportadoras = await ErpTransportCompanyRepository.findTransportCompaniesForSend(codtransportadora);

      if (transportadoras.length === 0) {
        return { success: true, message: 'Nenhuma transportadora encontrada para envio.', data: null };
      }

      for (const transportadora of transportadoras) {

        try {

          const codigobd = transportadora.CODIGO;
          const nome = transportadora.NOME_FANTASIA || '';
          const cidade = transportadora.CIDADE;
          const estado = transportadora.ESTADO;
          const observacoes = `${transportadora.OBSERVACOES || ''} ${transportadora.OBSERVACOES2 || ''}`.trim();
          const dataRecadBd = transportadora.DATA_RECAD ? new Date(transportadora.DATA_RECAD).toISOString().replace('T', ' ').slice(0, 19) : '';

          const transportadoraMercos = await ErpTransportCompanyRepository.findTransportCompanyMercos(codigobd);

          if (transportadoraMercos.length > 0) {

            const codigoTranspSite = transportadoraMercos[0].codigo_site;
            const dataRecadMercos = transportadoraMercos[0].data_recad;

            const precisaAtualizar = !dataRecadMercos
              || new Date(dataRecadBd) > new Date(dataRecadMercos);

            if (!precisaAtualizar) {
              console.log(`[ ] Transportadora ${codigobd} - ${nome} já está atualizada.`);
              sucessos.push(String(codigobd));
              continue;
            }

            console.log(`[V] Atualizando transportadora ${codigobd} - ${nome} no Mercos...`);

            const input = {
              nome,
              cidade,
              estado,
              informacoes_adicionais: observacoes,
              excluido: false,
            } as inputTransportCompanyMercos;

            const statusRequest = await SendTransportCompanyRequest.putTransportCompany(codigoTranspSite, input);

            if (statusRequest === 200 || statusRequest === 201) {
              await ErpTransportCompanyRepository.updateTransportCompanySyncDate(codigoTranspSite, codigobd, dataRecadBd);
              console.log(`[V] Transportadora ${codigobd} atualizada no Mercos e DATA_RECAD sincronizado no banco.`);
              sucessos.push(String(codigobd));
            } else {
              console.error(`[X] Falha ao atualizar transportadora ${codigobd} no Mercos. Status: ${statusRequest}`);
              erros.push({ codigo: codigobd, erro: 'Falha ao atualizar transportadora no Mercos.', status: statusRequest });
            }

          } else {

            console.log(`[V] Inserindo transportadora ${codigobd} - ${nome} no Mercos...`);

            const input = {
              nome,
              cidade,
              estado,
              informacoes_adicionais: observacoes,
              excluido: false,
            } as inputTransportCompanyMercos;

            const result = await SendTransportCompanyRequest.postTransportCompany(input);

            if (result.status === 200 || result.status === 201) {
              const novoIdSite = result.id;

              if (novoIdSite) {
                const posInsercao = await ErpTransportCompanyRepository.findTransportCompanyAfterInsert(codigobd);

                if (posInsercao.length > 0 && !posInsercao[0].codigo_site) {
                  await ErpTransportCompanyRepository.insertTransportCompanyMercos({
                    codigoSite: novoIdSite,
                    codigoBd: codigobd,
                    dataRecad: transportadora.DATA_CADASTRO ?? '',
                  });
                  console.log(`[V] Transportadora ${codigobd} inserida no Mercos (ID ${novoIdSite}) e registrada no banco.`);
                  sucessos.push(String(codigobd));
                } else {
                  console.log(`[V] Transportadora ${codigobd} inserida no Mercos (ID ${novoIdSite}), porém já mapeada no banco.`);
                  sucessos.push(String(codigobd));
                }
              } else {
                console.error(`[X] Transportadora ${codigobd} inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.`);
                erros.push({ codigo: codigobd, erro: 'Transportadora inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.' });
              }
            } else {
              console.error(`[X] Falha ao inserir transportadora ${codigobd} no Mercos. Status: ${result.status}`);
              erros.push({ codigo: codigobd, erro: 'Falha ao inserir transportadora no Mercos.', status: result.status });
            }
          }

        } catch (e: any) {
          console.error(`[X] Erro ao processar transportadora ${transportadora.CODIGO}:`, e);
          erros.push({ codigo: transportadora.CODIGO, erro: e?.message || 'Erro ao processar transportadora.' });
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { enviados: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar transportadoras:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar transportadoras.', data: null };
    }
  }
}
