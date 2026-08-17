import { type event } from '../../../shared/contracts/event.ts';
import { SendStockService, type ResultStock } from '../service/send-stock-service.ts';

export class StockEventHandler {

  async handle(event: event): Promise<ResultStock> {
    const sendStockService = new SendStockService();
    return sendStockService.sendStock(event.id_registro);
  }
}
