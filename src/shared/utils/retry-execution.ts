import { type AxiosResponse } from "axios";
import { delay } from "./delay.ts";

export type RetryExecutionOptions = {
  maxRetries?: number
}

export class RetryExecution {

  static async executeWithRetry(request: () => Promise<AxiosResponse>, options?: RetryExecutionOptions): Promise<AxiosResponse> {
    const maxRetries = options?.maxRetries ?? 5;
    let tentativas = 0;

    for (;;) {
      try {
        return await request();
      } catch (e: any) {
        if (e?.response?.status === 429) {
          if (tentativas >= maxRetries) {
            console.error(`[429] Limite de ${maxRetries} tentativas atingido, reenviando erro.`);
            throw e;
          }
          tentativas++;
          await RetryExecution.waitThrottle(RetryExecution.getTempoRestante(e));
          continue;
        }
        throw e;
      }
    }
  }

  static getTempoRestante(e: any): number {
    const tempoBody = e?.response?.data?.tempo_ate_permitir_novamente;
    if (Number(tempoBody) > 0) return Number(tempoBody);

    const retryAfter = e?.response?.headers?.['retry-after'];
    if (Number(retryAfter) > 0) return Number(retryAfter);

    return 1;
  }

  static async waitThrottle(segundos: number): Promise<void> {
    console.log(`[429] Aguardando ${segundos} segundos para tentar novamente...`);
    await delay(segundos * 1000);
  }
}
