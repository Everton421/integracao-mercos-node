import { type event } from '../../../shared/contracts/event.ts';
import { SendProductService, type ResultProduct } from '../service/send-product-service.ts';

export class ProductEventHandler {

  async handle(event: event): Promise<ResultProduct> {
    const sendProductService = new SendProductService();
    return sendProductService.sendProduct(event.id_registro);
  }
}
