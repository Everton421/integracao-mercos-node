import { DateService } from '../../../shared/utils/date-service.ts';
import { ErpInventoryRepository } from '../repository/erp-inventory-repository.ts';
import { SendStockRequest } from '../request/send-stock-request.ts';

export type ResultStock = {
  success: boolean
  message: string
  data: { enviados: string[]; erros: any[] } | null
}

export class SendStockService {

  async sendStock(codprod?: number): Promise<ResultStock> {
    const dateService = new DateService();

    const sucessos: string[] = [];
    const erros: any[] = [];

    try {

      const productsStock = await ErpInventoryRepository.findProductsStockForSend(codprod);

      if (productsStock.length === 0) {
        return { success: false, message: 'Nenhum produto com estoque a sincronizar.', data: null };
      }

      for (const product of productsStock) {

        try {

          const idprodutosite = product.codigo_site;
          const idprodutobanco = Number(product.codigo_bd);

          const dataStock = await ErpInventoryRepository.findStockProduct(idprodutobanco);

          if (dataStock.length === 0) {
            continue;
          }

          const stockRow = dataStock[0];
            const { CODIGO, ESTOQUE, ESTOQUE_MERCOS, ESTOQUE_TOTAL } = dataStock[0];


          if ( ESTOQUE_MERCOS == ESTOQUE ) {
            console.log(`[ ] Estoque do produto ${CODIGO} já está atualizado.`);
            sucessos.push(String(CODIGO));
            continue;
          }

          console.log(`[V] Atualizando estoque do produto ${CODIGO} no Mercos...`);

          const statusRequest = await SendStockRequest.putStock({
            produto_id: Number(idprodutosite),
            novo_saldo: ESTOQUE,
          });

          if (statusRequest === 200 || statusRequest === 201) {
            await ErpInventoryRepository.insertStockSync({
              codigoSite: idprodutosite,
              codigoBd: idprodutobanco,
              estoque: ESTOQUE,
              dataRecad: dateService.obterDataAtual(),
            });
            console.log(`[V] Estoque do produto ${CODIGO} atualizado no Mercos e sincronizado no banco.`);
            sucessos.push(String(CODIGO));
          } else {
            console.error(`[X] Falha ao atualizar estoque do produto ${CODIGO} no Mercos. Status: ${statusRequest}`);
            erros.push({ codigo: CODIGO, erro: 'Falha ao atualizar estoque no Mercos.', status: statusRequest });
          }

        } catch (e: any) {
          console.error(`[X] Erro ao processar estoque do produto ${product.codigo_bd}:`, e);
          erros.push({ codigo: String(product.codigo_bd), erro: e?.message || 'Erro ao processar estoque.' });
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { enviados: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar estoque:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar estoque.', data: null };
    }
  }
}
