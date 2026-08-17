import test from 'node:test';
import { ReceiveOrderService } from '../service/receive-orders-service.ts';
import { ReceiveOrderRequest } from '../request/receive-order-request.ts';

test("TESTE RECEBIMENTO PEDIDOS", async (t) => {
 /**  await t.test("RECEBIMENTO DE PEDIDOS ATUALIZADO APÓS", async () => {
    try {
      const receiveOrderService = new ReceiveOrderService();
      
      const dataInicial = new Date().toISOString().slice(0, 10);
          const data=  "2026-08-13 17:47:14" ;
          //console.log(data);

          const result = await ReceiveOrderRequest.getOrdersUpdatedAt(data);
          console.log(result[0]);
 
    
    } catch (e) {
      console.log(e)
    }
  })
      */
    await t.test("RECEBIMENTO DE PEDIDOS POR ID", async () => {
    try {
      const receiveOrderService = new ReceiveOrderService();
    
          const result = await ReceiveOrderRequest.getOrderById(164045988);
          console.log(result );
 
    
    } catch (e) {
      console.log(e)
    }
  }) 

    /*
 await t.test("RECEBIMENTO DO CLIENTE POR ID", async () => {
    try {
      const receiveOrderService = new ReceiveOrderService();
    
          const result = await ReceiveOrderRequest.getCliente(38302018);
          console.log(result );
 
    
    } catch (e) {
      console.log(e)
    }
  })
*/

})
