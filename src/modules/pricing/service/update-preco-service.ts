import { ErpPriceRepository } from "../repository/erp-price-repository.ts";
import { SendPriceProductRequest, type inputPutPriceProduct } from "../request/send-price-product-request.ts";

export type ResultPriceProduct = {
  success: boolean
  message: string
  data: { enviados: string[]; erros: any[] } | null
}

export class UpdatePriceProduct {

  async sendPricesProduct(erp_sku?: number): Promise<ResultPriceProduct> {

    const sucessos: string[] = [];
    const erros: any[] = [];

    try {

      const dataPriceProduct = await ErpPriceRepository.findPriceProductForSend(erp_sku);

      if (dataPriceProduct.length === 0) {
        return { success: false, message: 'Nenhum registro de preço encontrado.', data: null };
      }

      for (const priceProduct of dataPriceProduct) {

        const preco = Number(Number(priceProduct.PRECO).toFixed(2));

        const input = {
          preco,
          produto_id: priceProduct.PROD_SITE,
          tabela_id: priceProduct.ID_PRECO_SITE,
          id_produto_site: priceProduct.ID_SITE,
        } as inputPutPriceProduct;

        if (priceProduct.CODIGO_PP_MERCOS) {

          const precisaAtualizar = !priceProduct.DATARECAD_SITE
            || new Date(priceProduct.DATARECAD_BD) > new Date(priceProduct.DATARECAD_SITE);

          if (!precisaAtualizar) {
            console.log(`[ ] Preço do produto ${priceProduct.PROD_SITE} já está atualizado.`);
            sucessos.push(String(priceProduct.PROD_SITE));
            continue;
          }

          console.log(`[V] Atualizando preço no mercos...`);

          const statusRequest = await SendPriceProductRequest.putPrice(input);

          if (statusRequest === 200 || statusRequest === 201) {
            await ErpPriceRepository.updatePriceSyncDate(priceProduct.ID_SITE, priceProduct.DATARECAD_BD);
            console.log(`[V] Preço atualizado no Mercos e DATA_RECAD sincronizado no banco.`);
            sucessos.push(String(priceProduct.PROD_SITE));
          } else {
            console.error(`[X] Falha ao atualizar preço no Mercos. Status: ${statusRequest}`);
            erros.push({ codigo: priceProduct.PROD_SITE, erro: 'Falha ao atualizar preço no Mercos.', status: statusRequest });
          }

        } else {

          console.log(`[V] Inserindo preço no mercos...`);

          const result = await SendPriceProductRequest.postPrice(input);

          if (result.status === 200 || result.status === 201) {
            const novoIdSite = result.id;

            if (novoIdSite) {
              await ErpPriceRepository.insertPriceProduct({
                codigoSite: Number(novoIdSite),
                produtoBd: priceProduct.CODIGOPROD_BD,
                produtoSite: priceProduct.PROD_SITE,
                precoBd: priceProduct.CODIGO_PRECO_BD,
                precoSite: priceProduct.ID_PRECO_SITE,
                dataRecad: priceProduct.DATARECAD_BD,
              });
              console.log(`[V] Preço inserido no Mercos (ID ${novoIdSite}) e registrado no banco.`);
              sucessos.push(String(priceProduct.PROD_SITE));
            } else {
              console.error(`[X] Preço inserido no Mercos, porém o ID não foi retornado no header meuspedidosid.`);
              erros.push({ codigo: priceProduct.PROD_SITE, erro: 'Preço inserido no Mercos, porém o ID não foi retornado no header meuspedidosid.' });
            }
          } else {
            console.error(`[X] Falha ao inserir preço no Mercos. Status: ${result.status}`);
            erros.push({ codigo: priceProduct.PROD_SITE, erro: 'Falha ao inserir preço no Mercos.', status: result.status });
          }
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { enviados: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar preços:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar preços.', data: null };
    }
  }
}
