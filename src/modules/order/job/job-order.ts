
//const cron = require('node-cron');
import cron from 'node-cron';
import { DateService } from '../../../shared/utils/date-service.ts';
import { ReceiveOrderService } from '../service/receive-orders-service.ts';

export class JobPedido {

    static async job() {

        const dateService = new DateService();
        const receiveOrderService = new ReceiveOrderService();

        const configCron = process.env.IMPORTAR_PEDIDOS;

        if (!configCron) {
            return console.log("é necessario configurar a variavel IMPORTAR_PEDIDOS com a expressao cron. ")
         }
            let inExec = false;
                    
            console.log("[V] Tarefa de recebimento de pedidos agendada.")
        cron.schedule(configCron, async () => {
                if(inExec) {
                    console.log("[X] Tarefa de recebimento de pedidos ainda em execução.")
                    return
                }

            try{
                inExec = true;

                    await receiveOrderService.receiveOrdersUdatedAt(dateService.obterDataAtual());

            }catch(e){
                console.log(e);
                }finally{
                inExec = false;
            }
        });
    }


}