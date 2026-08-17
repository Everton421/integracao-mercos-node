import test from 'node:test';
import { type event } from '../../../shared/contracts/event.ts';
import { UpdatePriceProduct } from '../service/update-preco-service.ts';
import { PriceEventHandler } from '../handlers/handle-price-event.ts';

test("TESTE ATUALIZAÇÃO PREÇOS PRODUTO(S)", async (t) => {
  await t.test("ENVIO DE PREÇO", async () => {
    try {
      const updatePriceProduct = new UpdatePriceProduct();
      const result = await updatePriceProduct.sendPricesProduct(973);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })

  await t.test("HANDLER EVENTO DE PREÇO", async () => {
    try {
      const priceEventHandler = new PriceEventHandler();
      const evento = { id_registro: 973 } as event;
      const result = await priceEventHandler.handle(evento);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
})
