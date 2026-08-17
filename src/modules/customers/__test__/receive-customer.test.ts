import test from 'node:test';
import { conn2 } from '../../../database/database-connection.ts';
import { ReceiveCustomerService } from '../service/receive-customer-service.ts';

test("TESTE RECEBIMENTO CLIENTES", async (t) => {
  
  /**await t.test("RECEBIMENTO DE CLIENTES ATUALIZADO APOS", async () => {
    try {
      const receiveCustomerService = new ReceiveCustomerService();
      const dataInicial = new Date().toISOString().slice(0, 10);
      const result = await receiveCustomerService.receiveCustomersUpdatedAt(dataInicial);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  }) 
  */

  await t.test("RECEBIMENTO DE CLIENTE POR ID", async () => {
    try {
      const receiveCustomerService = new ReceiveCustomerService();
      const result = await receiveCustomerService.receiveCustomerById(67596592);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })

  await conn2.end();
})

