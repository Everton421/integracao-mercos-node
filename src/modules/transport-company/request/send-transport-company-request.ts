import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputTransportCompanyMercos = {
  nome: string
  cidade: string | null
  estado: string | null
  informacoes_adicionais: string
  excluido: boolean
}

export class SendTransportCompanyRequest {

  static async postTransportCompany(input: inputTransportCompanyMercos): Promise<{ status: number, id?: string }> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.post('/v1/transportadoras', input)
      );
      const id = response.headers?.['meuspedidosid'];
      return { status: response.status, id: id ? String(id) : undefined };
    } catch (e: any) {
      return { status: e?.response?.status ?? 0 };
    }
  }

  static async putTransportCompany(idSite: string, input: inputTransportCompanyMercos): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/transportadoras/${idSite}`, input)
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }
}
