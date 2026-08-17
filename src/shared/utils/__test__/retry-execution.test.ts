import test from 'node:test';
import assert from 'node:assert';
import { RetryExecution } from '../retry-execution.ts';

test("RetryExecution", async (t) => {

  await t.test("retorna resposta após tentativas com 429", async () => {
    let tentativas = 0;

    const request = async (): Promise<any> => {
      tentativas++;
      if (tentativas <= 2) {
        const e: any = new Error('Too Many Requests');
        e.response = { status: 429, data: { tempo_ate_permitir_novamente: 0.5 }, headers: {} };
        throw e;
      }
      return { status: 200, data: {} };
    };

    const response = await RetryExecution.executeWithRetry(request, { maxRetries: 3 });
    assert.equal(response.status, 200);
    assert.equal(tentativas, 3);
  })

  await t.test("falha após esgotar maxRetries", async () => {
    const request = async (): Promise<any> => {
      const e: any = new Error('Too Many Requests');
      e.response = { status: 429, data: { tempo_ate_permitir_novamente: 0.5 }, headers: {} };
      throw e;
    };

    await assert.rejects(
      () => RetryExecution.executeWithRetry(request, { maxRetries: 2 })
    );
  })

  await t.test("getTempoRestante usa fallback Retry-After", () => {
    const e: any = new Error('Too Many Requests');
    e.response = { status: 429, data: {}, headers: { 'retry-after': '7' } };
    assert.equal(RetryExecution.getTempoRestante(e), 7);
  })

  await t.test("getTempoRestante usa tempo_ate_permitir_novamente antes do Retry-After", () => {
    const e: any = new Error('Too Many Requests');
    e.response = {
      status: 429,
      data: { tempo_ate_permitir_novamente: 3 },
      headers: { 'retry-after': '7' },
    };
    assert.equal(RetryExecution.getTempoRestante(e), 3);
  })
})
