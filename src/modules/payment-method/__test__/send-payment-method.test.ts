import test from 'node:test';
import { conn2 } from '../../../database/database-connection.ts';
import { SendPaymentMethodService } from '../service/send-payment-method-service.ts';

test("TESTE ENVIO CONDIÇÕES DE PAGAMENTO", async (t) => {
  await t.test("ENVIO DE CONDIÇÃO DE PAGAMENTO", async () => {
    try {
    } catch (e) {
      console.log(e)
    }
  })
  await conn2.end();
})
