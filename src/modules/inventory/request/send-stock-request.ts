import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputAjustarEstoque = {
  produto_id: number
  novo_saldo: number
}

export class SendStockRequest {

  static async putStock(input: inputAjustarEstoque): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put('/v1/ajustar_estoque', {
          produto_id: input.produto_id,
          novo_saldo: input.novo_saldo,
        })
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }
}
