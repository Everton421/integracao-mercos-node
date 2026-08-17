import { ErpPaymentMethodRepository } from '../repository/erp-payment-method-repository.ts';
import { SendPaymentMethodRequest, type inputPaymentConditionMercos } from '../request/send-payment-method-request.ts';
import { FormatString } from '../../../shared/utils/format-string.ts';

export type PaymentMethodResultItem = {
  codigo: number
  nome: string
  status: 'enviado' | 'atualizado' | 'ja_sincronizado' | 'erro' | 'excluido'
  erro?: string
}

export type ResultPaymentMethod = {
  success: boolean
  message: string
  data: { sucesso: PaymentMethodResultItem[]; erros: PaymentMethodResultItem[] } | null
}

export class SendPaymentMethodService {

  async sendPaymentMethod(codcondicao?: number): Promise<ResultPaymentMethod> {

    const sucessos: PaymentMethodResultItem[] = [];
    const erros: PaymentMethodResultItem[] = [];

    try {

      const condicoes = await ErpPaymentMethodRepository.findPaymentConditionsForSend(codcondicao);

      if (condicoes.length === 0) {
        return { success: true, message: 'Nenhuma condição de pagamento encontrada para envio.', data: null };
      }

      for (const condicao of condicoes) {

        try {

          const codigobd = condicao.CODIGO;
          const nome = new FormatString().tiraAspas(condicao.DESCRICAO || '');
          const valorMinimo = condicao.VALOR_MINIMO ?? null;
          const dataRecadBd = condicao.DATA_RECAD ? new Date(condicao.DATA_RECAD).toISOString().replace('T', ' ').slice(0, 19) : '';

          const condicaoMercos = await ErpPaymentMethodRepository.findPaymentConditionMercos(codigobd);

          if (condicaoMercos.length > 0) {

            const codigoCondicaoSite = condicaoMercos[0].codigo_site;
            const dataRecadMercos = condicaoMercos[0].data_recad;

            const precisaAtualizar = !dataRecadMercos
              || new Date(dataRecadBd) > new Date(dataRecadMercos);

            if (!precisaAtualizar) {
              console.log(`[ ] Condição de pagamento ${codigobd} - ${nome} já está atualizada.`);
              sucessos.push({ codigo: codigobd, nome, status: 'ja_sincronizado' });
              continue;
            }

            console.log(`[V] Atualizando condição de pagamento ${codigobd} - ${nome} no Mercos...`);

            const input = {
              nome,
              valor_minimo: valorMinimo,
            } as inputPaymentConditionMercos;

            const statusRequest = await SendPaymentMethodRequest.putPaymentCondition(codigoCondicaoSite, input);

            if (statusRequest === 200 || statusRequest === 201) {
              await ErpPaymentMethodRepository.updatePaymentConditionSyncDate(codigoCondicaoSite, codigobd, dataRecadBd);
              console.log(`[V] Condição de pagamento ${codigobd} atualizada no Mercos e DATA_RECAD sincronizado no banco.`);
              sucessos.push({ codigo: codigobd, nome, status: 'atualizado' });
            } else {
              console.error(`[X] Falha ao atualizar condição de pagamento ${codigobd} no Mercos. Status: ${statusRequest}`);
              erros.push({ codigo: codigobd, nome, status: 'erro', erro: `Falha ao atualizar condição de pagamento no Mercos. Status: ${statusRequest}` });
            }

          } else {

            console.log(`[V] Inserindo condição de pagamento ${codigobd} - ${nome} no Mercos...`);

            const input = {
              nome,
              valor_minimo: valorMinimo,
              excluido: false,
            } as inputPaymentConditionMercos;

            const result = await SendPaymentMethodRequest.postPaymentCondition(input);

            if (result.status === 200 || result.status === 201) {
              const novoIdSite = result.id;

              if (novoIdSite) {
                const posInsercao = await ErpPaymentMethodRepository.findPaymentConditionAfterInsert(codigobd);

                if (posInsercao.length > 0 && !posInsercao[0].codigo_site) {
                  await ErpPaymentMethodRepository.insertPaymentConditionMercos({
                    codigoSite: novoIdSite,
                    codigoBd: codigobd,
                    dataRecad: dataRecadBd,
                  });
                  console.log(`[V] Condição de pagamento ${codigobd} inserida no Mercos (ID ${novoIdSite}) e registrada no banco.`);
                  sucessos.push({ codigo: codigobd, nome, status: 'enviado' });
                } else {
                  console.log(`[V] Condição de pagamento ${codigobd} inserida no Mercos (ID ${novoIdSite}), porém já mapeada no banco.`);
                  sucessos.push({ codigo: codigobd, nome, status: 'enviado' });
                }
              } else {
                console.error(`[X] Condição de pagamento ${codigobd} inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.`);
                erros.push({ codigo: codigobd, nome, status: 'erro', erro: 'Condição de pagamento inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.' });
              }
            } else {
              console.error(`[X] Falha ao inserir condição de pagamento ${codigobd} no Mercos. Status: ${result.status}`);
              erros.push({ codigo: codigobd, nome, status: 'erro', erro: `Falha ao inserir condição de pagamento no Mercos. Status: ${result.status}` });
            }
          }

        } catch (e: any) {
          console.error(`[X] Erro ao processar condição de pagamento ${condicao.CODIGO}:`, e);
          erros.push({ codigo: condicao.CODIGO, nome: condicao.DESCRICAO || '', status: 'erro', erro: e?.message || 'Erro ao processar condição de pagamento.' });
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { sucesso: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar condições de pagamento:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar condições de pagamento.', data: null };
    }
  }

  async deletePaymentMethod(codcondicao: number): Promise<PaymentMethodResultItem> {
    try {
      const condicoes = await ErpPaymentMethodRepository.findPaymentConditionsForSend(codcondicao);

      if (condicoes.length === 0) {
        return { codigo: codcondicao, nome: '', status: 'erro', erro: 'Condição de pagamento não encontrada ou não está ativa para envio.' };
      }

      const condicao = condicoes[0];
      const nome = new FormatString().tiraAspas(condicao.DESCRICAO || '');

      const condicaoMercos = await ErpPaymentMethodRepository.findPaymentConditionMercos(codcondicao);

      if (condicaoMercos.length === 0) {
        return { codigo: codcondicao, nome, status: 'erro', erro: 'Condição de pagamento não possui mapeamento no Mercos.' };
      }

      const codigoCondicaoSite = condicaoMercos[0].codigo_site;

      console.log(`[V] Excluindo condição de pagamento ${codcondicao} - ${nome} do Mercos...`);

      const input = {
        nome,
        valor_minimo: condicao.VALOR_MINIMO ?? null,
        excluido: true,
      } as inputPaymentConditionMercos;

      const statusRequest = await SendPaymentMethodRequest.deletePaymentCondition(codigoCondicaoSite, input);

      if (statusRequest === 200 || statusRequest === 201) {
        await ErpPaymentMethodRepository.removePaymentConditionMercos(codcondicao);
        console.log(`[V] Condição de pagamento ${codcondicao} excluída do Mercos e mapeamento removido do banco.`);
        return { codigo: codcondicao, nome, status: 'excluido' };
      } else {
        console.error(`[X] Falha ao excluir condição de pagamento ${codcondicao} do Mercos. Status: ${statusRequest}`);
        return { codigo: codcondicao, nome, status: 'erro', erro: `Falha ao excluir condição de pagamento do Mercos. Status: ${statusRequest}` };
      }

    } catch (e: any) {
      console.error(`[X] Erro ao excluir condição de pagamento ${codcondicao}:`, e);
      return { codigo: codcondicao, nome: '', status: 'erro', erro: e?.message || 'Erro inesperado ao excluir condição de pagamento.' };
    }
  }
}
