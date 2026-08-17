import test from 'node:test';
import { conn2 } from '../../../database/database-connection.ts';
import { SendPriceTableService } from '../service/send-price-table-service.ts';

test("TESTE ENVIO TABELAS DE PREÇO", async (t) => {
  await t.test("ENVIO DE TABELA DE PREÇO", async () => {
    try {
    } catch (e) {
      console.log(e)
    }
  })
  await conn2.end();
})
