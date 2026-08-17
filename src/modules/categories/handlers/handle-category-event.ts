import { type event } from '../../../shared/contracts/event.ts';
import { SendCategoryService, type ResultCategory } from '../service/send-category-service.ts';

export class CategoryEventHandler {

  async handle(event: event): Promise<ResultCategory> {
    const sendCategoryService = new SendCategoryService();
    return sendCategoryService.sendCategory(event.id_registro);
  }
}
