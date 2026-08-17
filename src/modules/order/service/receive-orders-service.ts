import { ReceiveOrderRequest } from '../request/receive-order-request.ts';
import { ProcessOrdersErpService } from './process-orders-erp-service.ts';

export type ResultReceiveOrder = {
  success: boolean
  message: string
  data: { recebidos: string[]; atualizados: string[]; inseridos: string[]; erros: any[] } | null
}

export class ReceiveOrderService {

  async receiveOrdersUdatedAt(dataInicial?: string): Promise<ResultReceiveOrder> {

    const processOrdersErpService = new ProcessOrdersErpService();
    let recebidos: string[] = [];
    let atualizados: string[] = [];
    let inseridos: string[] = [];
    let erros: any[] = [];

    try {

      if (!dataInicial) {
        dataInicial = new Date().toISOString().slice(0, 10);
      }

      const pedidos = await ReceiveOrderRequest.getOrdersUpdatedAt(dataInicial);
    
      console.log(`[V] Encontrado ${pedidos.length}, data consulta ${dataInicial}.`)
 
        const resultProcessOrder = await processOrdersErpService.process(pedidos);
        recebidos= resultProcessOrder.recebidos;
        atualizados= resultProcessOrder.atualizados;
        inseridos= resultProcessOrder.inseridos;
        erros= resultProcessOrder.erros;
          
    return {
        success: erros.length === 0,
        message: `Processamento finalizado. Recebidos: ${recebidos.length}, Atualizados: ${atualizados.length}, Inseridos: ${inseridos.length}, Falhas: ${erros.length}.`,
        data: { recebidos, atualizados, inseridos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao receber pedidos:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao receber pedidos.', data: null };
    }
  }

  
  async receiveOrderById(id: number): Promise<ResultReceiveOrder> {

    const processOrdersErpService = new ProcessOrdersErpService();
    let recebidos: string[] = [];
    let atualizados: string[] = [];
    let inseridos: string[] = [];
    let erros: any[] = [];

    try {
 
      const pedido = await ReceiveOrderRequest.getOrderById(id);
      if(pedido){
      console.log(`[V] Encontrado pedido Id: ${id}.`)
        const resultProcessOrder = await processOrdersErpService.process([pedido]);
        recebidos= resultProcessOrder.recebidos;
        atualizados= resultProcessOrder.atualizados;
        inseridos= resultProcessOrder.inseridos;
        erros= resultProcessOrder.erros;
        }else{
      console.log(`[X] Não foi encontrado pedido Id: ${id}.`)

        }
    return {
        success: erros.length === 0,
        message: `Processamento finalizado. Recebidos: ${recebidos.length}, Atualizados: ${atualizados.length}, Inseridos: ${inseridos.length}, Falhas: ${erros.length}.`,
        data: { recebidos, atualizados, inseridos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao receber pedidos:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao receber pedidos.', data: null };
    }
  }

}
