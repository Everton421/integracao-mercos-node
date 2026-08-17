import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputPaymentConditionMercos = {
  nome: string
  valor_minimo: number | string | null
  excluido?: boolean
}

export class SendPaymentMethodRequest {

  static async postPaymentCondition(input: inputPaymentConditionMercos): Promise<{ status: number, id?: string }> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.post('/v1/condicoes_pagamento', input)
      );
      const id = response.headers?.['meuspedidosid'];
      return { status: response.status, id: id ? String(id) : undefined };
    } catch (e: any) {
      return { status: e?.response?.status ?? 0 };
    }
  }

  static async putPaymentCondition(idSite: string, input: inputPaymentConditionMercos): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/condicoes_pagamento/${idSite}`, input)
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }

  static async deletePaymentCondition(idSite: string, input: inputPaymentConditionMercos): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/condicoes_pagamento/${idSite}`, input)
      );
      return response.status;
    } catch (e: any) { 
      return e?.response?.status ?? 0;
    }
  }
}
