import test from 'node:test';
import { type event } from '../../../shared/contracts/event.ts';
import { SendCustomerService } from '../service/send-customer-service.ts';
import { CustomerEventHandler } from '../handlers/handle-customer-event.ts';
 
test("TESTE ENVIO CLIENTES", async (t) => {
 /*
  await t.test("ENVIO DE CLIENTE", async () => {
    try {
      const sendCustomerService = new SendCustomerService();
      const result = await sendCustomerService.sendCustomer(282);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
*/
  await t.test("HANDLER EVENTO DE CLIENTE", async () => {
    try {
      const customerEventHandler = new CustomerEventHandler();
      const evento = { id_registro: 10396 } as event;
      const result = await customerEventHandler.handle(evento);
      console.log(JSON.stringify(result))
    } catch (e) {
      console.log(e)
    }
  })
})
 
 