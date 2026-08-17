import test from 'node:test';
import { type event } from '../../../shared/contracts/event.ts';
import { SendStockService } from '../service/send-stock-service.ts';
import { StockEventHandler } from '../handlers/handle-stock-event.ts';

test("TESTE ENVIO ESTOQUE", async (t) => {
  await t.test("ENVIO DE ESTOQUE", async () => {
    try {
      const sendStockService = new SendStockService();
      const result = await sendStockService.sendStock(3);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
/** 
  await t.test("HANDLER EVENTO DE ESTOQUE", async () => {
    try {
      const stockEventHandler = new StockEventHandler();
      const evento = { id_registro: 3 } as event;
      const result = await stockEventHandler.handle(evento);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
    */
})
