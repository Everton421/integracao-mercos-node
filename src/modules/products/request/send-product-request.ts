import {AxiosError, type AxiosResponse } from 'axios';
import { api } from '../../../shared/api/api.ts';
import { RetryExecution } from '../../../shared/utils/retry-execution.ts';

export type inputProductMercos = {
  nome: string
  preco_tabela: number
  preco_minimo: null
  codigo: number
  comissao: null
  ipi: number | null
  tipo_ipi: string
  st: null
  moeda: string
  unidade: string
  saldo_estoque: number
  excluido: boolean
  ativo: boolean
  categoria_id: number
  codigo_ncm: string
  peso_bruto: number | null
  largura: number | null
  altura: number | null
  comprimento: number | null
  peso_dimensoes_unitario: boolean
}

export class SendProductRequest {

  static async postProduct(input: inputProductMercos)  {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.post('/v1/produtos', input)
      );
      const id = response.headers?.['meuspedidosid'];

      return  { success: true, data: id, message: null};

    } catch (e: any) {
      return  { success: false, data: e.response.data, message: e.response.data.mensagem};
    }
  }

         

  static async putProduct(idSite: string, input: inputProductMercos): Promise<number> {
    try {
      const response = await RetryExecution.executeWithRetry(() =>
        api.put(`/v1/produtos/${idSite}`, input)
      );
      return response.status;
    } catch (e: any) {
      return e?.response?.status ?? 0;
    }
  }
}
