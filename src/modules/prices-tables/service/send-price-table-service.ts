import { ErpPriceTableRepository } from '../repository/erp-price-table-repository.ts';
import { SendPriceTableRequest, type inputPriceTableMercos } from '../request/send-price-table-request.ts';
import { FormatString } from '../../../shared/utils/format-string.ts';

export type PriceTableResultItem = {
  codigo: number
  nome: string
  status: 'enviado' | 'atualizado' | 'ja_sincronizado' | 'erro'
  erro?: string
}

export type ResultPriceTable = {
  success: boolean
  message: string
  data: { sucesso: PriceTableResultItem[]; erros: PriceTableResultItem[] } | null
}

export class SendPriceTableService {

  async sendPriceTable(codtabela?: number): Promise<ResultPriceTable> {

    const sucessos: PriceTableResultItem[] = [];
    const erros: PriceTableResultItem[] = [];

    try {

      const tabelas = await ErpPriceTableRepository.findPriceTablesForSend(codtabela);

      if (tabelas.length === 0) {
        return { success: true, message: 'Nenhuma tabela de preço encontrada para envio.', data: null };
      }

      for (const tabela of tabelas) {

        try {

          const codigobd = tabela.CODIGO;
          const nome = new FormatString().tiraAspas(tabela.DESCRICAO || '');
          const dataRecadBd = tabela.DATA_RECAD ? new Date(tabela.DATA_RECAD).toISOString().replace('T', ' ').slice(0, 19) : '';

          const tabelaMercos = await ErpPriceTableRepository.findPriceTableMercos(codigobd);

          if (tabelaMercos.length > 0) {

            const codigoTabelaSite = tabelaMercos[0].codigo_site;
            const dataRecadMercos = tabelaMercos[0].data_recad;

            const precisaAtualizar = !dataRecadMercos
              || new Date(dataRecadBd) > new Date(dataRecadMercos);

            if (!precisaAtualizar) {
              console.log(`[ ] Tabela de preço ${codigobd} - ${nome} já está atualizada.`);
              sucessos.push({ codigo: codigobd, nome, status: 'ja_sincronizado' });
              continue;
            }

            console.log(`[V] Atualizando tabela de preço ${codigobd} - ${nome} no Mercos...`);

            const input = {
              nome,
              tipo: 'P',
              acrescimo: null,
              desconto: null,
            } as inputPriceTableMercos;

            const statusRequest = await SendPriceTableRequest.putPriceTable(codigoTabelaSite, input);

            if (statusRequest === 200 || statusRequest === 201) {
              await ErpPriceTableRepository.updatePriceTableSyncDate(codigoTabelaSite, codigobd, dataRecadBd);
              console.log(`[V] Tabela de preço ${codigobd} atualizada no Mercos e DATA_RECAD sincronizado no banco.`);
              sucessos.push({ codigo: codigobd, nome, status: 'atualizado' });
            } else {
              console.error(`[X] Falha ao atualizar tabela de preço ${codigobd} no Mercos. Status: ${statusRequest}`);
              erros.push({ codigo: codigobd, nome, status: 'erro', erro: `Falha ao atualizar tabela de preço no Mercos. Status: ${statusRequest}` });
            }

          } else {

            console.log(`[V] Inserindo tabela de preço ${codigobd} - ${nome} no Mercos...`);

            const input = {
              nome,
              tipo: 'P',
              acrescimo: null,
              desconto: null,
              excluido: false,
            } as inputPriceTableMercos;

            const result = await SendPriceTableRequest.postPriceTable(input);

            if (result.status === 200 || result.status === 201) {
              const novoIdSite = result.id;

              if (novoIdSite) {
                const posInsercao = await ErpPriceTableRepository.findPriceTableAfterInsert(codigobd);

                if (posInsercao.length > 0 && !posInsercao[0].codigo_site) {
                  await ErpPriceTableRepository.insertPriceTableMercos({
                    codigoSite: novoIdSite,
                    codigoBd: codigobd,
                    dataRecad: tabela.DATA_CADASTRO ?? '',
                  });
                  console.log(`[V] Tabela de preço ${codigobd} inserida no Mercos (ID ${novoIdSite}) e registrada no banco.`);
                  sucessos.push({ codigo: codigobd, nome, status: 'enviado' });
                } else {
                  console.log(`[V] Tabela de preço ${codigobd} inserida no Mercos (ID ${novoIdSite}), porém já mapeada no banco.`);
                  sucessos.push({ codigo: codigobd, nome, status: 'enviado' });
                }
              } else {
                console.error(`[X] Tabela de preço ${codigobd} inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.`);
                erros.push({ codigo: codigobd, nome, status: 'erro', erro: 'Tabela de preço inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.' });
              }
            } else {
              console.error(`[X] Falha ao inserir tabela de preço ${codigobd} no Mercos. Status: ${result.status}`);
              erros.push({ codigo: codigobd, nome, status: 'erro', erro: `Falha ao inserir tabela de preço no Mercos. Status: ${result.status}` });
            }
          }

        } catch (e: any) {
          console.error(`[X] Erro ao processar tabela de preço ${tabela.CODIGO}:`, e);
          erros.push({ codigo: tabela.CODIGO, nome: tabela.DESCRICAO || '', status: 'erro', erro: e?.message || 'Erro ao processar tabela de preço.' });
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { sucesso: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar tabelas de preço:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar tabelas de preço.', data: null };
    }
  }
}
