import test from 'node:test';
import { type event } from '../../../shared/contracts/event.ts';
import { SendCategoryService } from '../service/send-category-service.ts';
import { CategoryEventHandler } from '../handlers/handle-category-event.ts';

/*
test("TESTE ENVIO CATEGORIAS", async (t) => {
  await t.test("ENVIO DE CATEGORIA", async () => {
    try {
      const sendCategoryService = new SendCategoryService();
      const result = await sendCategoryService.sendCategory(1);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })

  await t.test("HANDLER EVENTO DE CATEGORIA", async () => {
    try {
      const categoryEventHandler = new CategoryEventHandler();
      const evento = { id_registro: 1 } as event;
      const result = await categoryEventHandler.handle(evento);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
})
*/