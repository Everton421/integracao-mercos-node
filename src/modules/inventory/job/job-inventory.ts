
import cron from 'node-cron';
import { ProductErpRepository } from '../../products/repository/produto-repository.ts';
import { SendStockService } from '../service/send-stock-service.ts';

export class JobInventory {

    static async job() {

        const configCron = process.env.ENVIAR_ESTOQUE;

        if (!configCron) {
            return console.log("é necessario configurar a variavel ENVIAR_ESTOQUE com a expressao cron. ")
        }
        let inExec = false;
                    console.log("[X] Tarefa de envio de precos agendada.")

        cron.schedule(configCron, async () => {
            if (inExec) {
                console.log("[X] Tarefa de envio de estoque ainda em execução.")
                return
            }
            try {

                inExec = true;
                const sendStockService = new SendStockService();

                const productsForSend = await ProductErpRepository.findCodeproductsToSendJob();
                for (const code of productsForSend) {
                    await sendStockService.sendStock(code.CODIGO);
                }

            } catch (e) {
                console.log(e);
            } finally {
                inExec = false;
            }
        });
    }


}