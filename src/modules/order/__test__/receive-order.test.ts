import test from 'node:test';
import { ReceiveOrderService } from '../service/receive-orders-service.ts';

test("TESTE RECEBIMENTO PEDIDOS", async (t) => {
  
  await t.test("RECEBIMENTO DE PEDIDOS ATUALIZADO APOS", async () => {
    try {
      const receiveOrderService = new ReceiveOrderService();
      
      const dataInicial = new Date().toISOString().slice(0, 10);
          const data=  "2026-08-13 17:47:14" ;
          //console.log(data);

          const result = await receiveOrderService.receiveOrdersUdatedAt(data);
          console.log(result)
    
    } catch (e) {
      console.log(e)
    }
  })
  /*


  
await t.test("RECEBIMENTO DE PEDIDOS POR ID", async () => {
    try {
      const receiveOrderService = new ReceiveOrderService();
      
 
          const result = await receiveOrderService.receiveOrderById(163894138);
          console.log(result)
    
    } catch (e) {
      console.log(e)
    }
  })
*/

})
