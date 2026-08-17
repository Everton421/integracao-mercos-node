import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputCategoryMercos = {
  nome: string
  excluido?: boolean
}

export class SendCategoryRequest {

  static async postCategory(input: inputCategoryMercos) {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.post('/v1/categorias', input)
      );
      const id = response.headers?.['meuspedidosid'];
           return  { success: true, data: id, message: null};
    } catch (e: any) {
           return  { success: false, data: e.response.data, message: e.response.data.mensagem};
    }
  }

  static async putCategory(idSite: string, input: inputCategoryMercos): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/categorias/${idSite}`, input)
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }
}
