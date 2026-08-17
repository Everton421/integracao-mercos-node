import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';
import { type MercosCliente } from '../contracts/mercos-cliente.ts';

export class ReceiveCustomerRequest {

  static async getCustomersUpdatedAt(alteradoApos: string): Promise<MercosCliente[]> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.get(`/v1/clientes?alterado_apos=${alteradoApos}`)
      );
      return response.data;
    } catch (e: any) {
      throw new Error(e?.response?.status ? `Falha ao listar clientes. Status: ${e.response.status}` : e?.message || 'Falha ao listar clientes.');
    }
  }

    static async getClienteById(idCliente: number): Promise<MercosCliente> {
      try {
        const response = await RetryExecution.executeWithRetry(() =>
          api.get(`/v1/clientes/${idCliente}`)
        );
        return response.data;
      } catch (e: any) {
        throw new Error(e?.response?.status ? `Falha ao buscar cliente. Status: ${e.response.status}` : e?.message || 'Falha ao buscar cliente.');
      }
    }

}
