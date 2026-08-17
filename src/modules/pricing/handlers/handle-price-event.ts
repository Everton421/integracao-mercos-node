import { type event } from '../../../shared/contracts/event.ts';
import { UpdatePriceProduct, type ResultPriceProduct } from '../service/update-preco-service.ts';

export class PriceEventHandler {

  async handle(event: event): Promise<ResultPriceProduct> {
    const updatePriceProduct = new UpdatePriceProduct();
    return updatePriceProduct.sendPricesProduct(event.id_registro);
  }
}
