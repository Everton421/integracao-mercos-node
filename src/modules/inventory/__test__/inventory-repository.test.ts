import test from 'node:test';
import { type event } from '../../../shared/contracts/event.ts';
import { SendStockService } from '../service/send-stock-service.ts';
import { StockEventHandler } from '../handlers/handle-stock-event.ts';
import { ErpInventoryRepository } from '../repository/erp-inventory-repository.ts';

test("TESTE CONSULTAS BANCO DE DADOS ", async (t) => {
  await t.test("BUSCA SALDO REAL", async () => {
    try {
   const result=   await ErpInventoryRepository.findStockProductold();
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
