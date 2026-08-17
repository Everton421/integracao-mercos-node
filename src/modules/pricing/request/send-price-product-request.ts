import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputPutPriceProduct = {
  tabela_id: number
  produto_id: number
  preco: number
  id_produto_site?: number
}

export class SendPriceProductRequest {


  static async putPrice(input: inputPutPriceProduct): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/produtos_tabela_preco/${input.id_produto_site}`, {
          tabela_id: input.tabela_id,
          produto_id: input.produto_id,
          preco: input.preco,
        })
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }

  static async postPrice(input: inputPutPriceProduct): Promise<{ status: number, id?: string }> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.post('/v1/produtos_tabela_preco', {
          tabela_id: input.tabela_id,
          produto_id: input.produto_id,
          preco: input.preco,
        })
      );
      const id = response.headers?.['meuspedidosid'];
      return { status: response.status, id: id ? String(id) : undefined };
    } catch (e: any) {
      return { status: e?.response?.status ?? 0 };
    }
  }
}
