import test from 'node:test';
import { ReceiveCustomerRequest } from '../request/receive-customer-request.ts';

test("TESTE REQUEST CLIENTES", async (t) => {
  await t.test("BUSCA DE CLIENTE POR ID ", async () => {
    try {
 
      const result = await ReceiveCustomerRequest.getClienteById(38302018);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
})

