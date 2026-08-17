import test from 'node:test';
import { type event } from '../../../shared/contracts/event.ts';
import { SendProductService } from '../service/send-product-service.ts';
import { ProductEventHandler } from '../handlers/handle-product-event.ts';

test("TESTE ENVIO PRODUTOS", async (t) => {
  await t.test("ENVIO DE PRODUTO", async () => {
    try {
      const sendProductService = new SendProductService();
      const result = await sendProductService.sendProduct(973);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })

  await t.test("HANDLER EVENTO DE PRODUTO", async () => {
    try {
      const productEventHandler = new ProductEventHandler();
      const evento = { id_registro: 973 } as event;
      const result = await productEventHandler.handle(evento);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
})
