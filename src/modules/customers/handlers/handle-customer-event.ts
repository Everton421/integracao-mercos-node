import { type event } from '../../../shared/contracts/event.ts';
import { SendCustomerService, type ResultCustomer } from '../service/send-customer-service.ts';

export class CustomerEventHandler {

  async handle(event: event): Promise<ResultCustomer> {
    const sendCustomerService = new SendCustomerService();
    return sendCustomerService.sendCustomer(event.id_registro);
  }
}
