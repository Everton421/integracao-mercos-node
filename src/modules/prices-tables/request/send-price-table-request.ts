import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputPriceTableMercos = {
  nome: string
  tipo: 'P'
  acrescimo: number | null
  desconto: number | null
  excluido?: boolean
}

export class SendPriceTableRequest {

  static async postPriceTable(input: inputPriceTableMercos): Promise<{ status: number, id?: string }> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.post('/v1/tabelas_preco', input)
      );
      const id = response.headers?.['meuspedidosid'];
      return { status: response.status, id: id ? String(id) : undefined };
    } catch (e: any) {
      return { status: e?.response?.status ?? 0 };
    }
  }

  static async putPriceTable(idSite: string, input: inputPriceTableMercos): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/tabelas_preco/${idSite}`, input)
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }
}
