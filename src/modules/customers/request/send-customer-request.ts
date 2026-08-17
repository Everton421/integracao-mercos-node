import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputCustomerMercos = {
  razao_social: string
  nome_fantasia: string
  tipo: string
  cnpj: string
  inscricao_estadual: string
  suframa: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  cidade: string
  estado: string
  observacao: string
  emails: { email: string }[]
  telefones: { numero: string }[]
  nome_excecao_fiscal?: string
  excluido?: boolean
}

export class SendCustomerRequest {

  static async postCustomer(input: inputCustomerMercos): Promise<{ status: number, id?: string }> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.post('/v1/clientes', input)
      );
      const id = response.headers?.['meuspedidosid'];
      return { status: response.status, id: id ? String(id) : undefined };
    } catch (e: any) {
      return { status: e?.response?.status ?? 0 };
    }
  }

  static async putCustomer(idSite: string, input: inputCustomerMercos): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/clientes/${idSite}`, input)
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }
}
