import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';
import type { MercosCliente } from '../../customers/contracts/mercos-cliente.ts';
import type { MercosPedido } from '../contracts/mercos-order.ts';

export class ReceiveOrderRequest {

  static async getOrdersUpdatedAt(alteradoApos: string): Promise<MercosPedido[]> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.get(`/v2/pedidos?alterado_apos=${alteradoApos}&status=2`)
      );
      return response.data;
    } catch (e: any) {
      throw new Error(e?.response?.status ? `Falha ao listar pedidos. Status: ${e.response.status}` : e?.message || 'Falha ao listar pedidos.');
    }
  }

  static async getOrderById(id: number): Promise<MercosPedido> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.get(`/v2/pedidos/${id}`)
      );
      return response.data;
    } catch (e: any) {
      throw new Error(e?.response?.status ? `Falha ao pedido Id ${id}. Status: ${e.response.status}` : e?.message || 'Falha ao listar pedidos.');
    }
  }

  static async getCliente(idCliente: number): Promise<MercosCliente> {
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
