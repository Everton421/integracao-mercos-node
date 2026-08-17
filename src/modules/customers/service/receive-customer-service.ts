import { ReceiveCustomerRequest } from '../request/receive-customer-request.ts';
import { ProcessCustomersErpService } from './process-customers-erp-service.ts';

export type ResultReceiveCustomer = {
  success: boolean
  message: string
  data: { recebidos: string[]; atualizados: string[]; inseridos: string[]; erros: any[] } | null
}

export class ReceiveCustomerService {

  async receiveCustomersUpdatedAt(dataInicial?: string): Promise<ResultReceiveCustomer> {

    const processCustomersErpService = new ProcessCustomersErpService();
    let recebidos: string[] = [];
    let atualizados: string[] = [];
    let inseridos: string[] = [];
    let erros: any[] = [];

    try {

      if (!dataInicial) {
        dataInicial = new Date().toISOString().slice(0, 10);
      }

      const clientes = await ReceiveCustomerRequest.getCustomersUpdatedAt(dataInicial);

      console.log(`[V] Encontrado ${clientes.length}, data consulta ${dataInicial}.`)

      const resultProcessCustomer = await processCustomersErpService.process(clientes);
      recebidos = resultProcessCustomer.recebidos;
      atualizados = resultProcessCustomer.atualizados;
      inseridos = resultProcessCustomer.inseridos;
      erros = resultProcessCustomer.erros;

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Recebidos: ${recebidos.length}, Atualizados: ${atualizados.length}, Inseridos: ${inseridos.length}, Falhas: ${erros.length}.`,
        data: { recebidos, atualizados, inseridos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao receber clientes:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao receber clientes.', data: null };
    }
  }

  async receiveCustomerById(id: number): Promise<ResultReceiveCustomer> {

    const processCustomersErpService = new ProcessCustomersErpService();
    let recebidos: string[] = [];
    let atualizados: string[] = [];
    let inseridos: string[] = [];
    let erros: any[] = [];

    try {

      const cliente = await ReceiveCustomerRequest.getClienteById(id);
      if (cliente) {
        console.log(`[V] Encontrado cliente Id: ${id}.`)
        const resultProcessCustomer = await processCustomersErpService.process([cliente]);
        recebidos = resultProcessCustomer.recebidos;
        atualizados = resultProcessCustomer.atualizados;
        inseridos = resultProcessCustomer.inseridos;
        erros = resultProcessCustomer.erros;
      } else {
        console.log(`[X] Não foi encontrado cliente Id: ${id}.`)
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Recebidos: ${recebidos.length}, Atualizados: ${atualizados.length}, Inseridos: ${inseridos.length}, Falhas: ${erros.length}.`,
        data: { recebidos, atualizados, inseridos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao receber clientes:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao receber clientes.', data: null };
    }
  }

}
