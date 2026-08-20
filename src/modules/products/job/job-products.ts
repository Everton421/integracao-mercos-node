
import cron from 'node-cron';
import { ProductErpRepository } from '../repository/produto-repository.ts';
import { SendProductService } from '../service/send-product-service.ts';

export class JobProducts {

    static async job() {


        const configCron = process.env.ENVIAR_PRODUTOS;

        if (!configCron) {
            return console.log("é necessario configurar a variavel ENVIAR_PRODUTOS com a expressao cron. ")
         }
            let inExec = false;

            console.log("[V] Tarefa de recebimento de envio de produtos agendada.")

        cron.schedule(configCron, async () => {
                if(inExec) {
                    console.log("[X] Tarefa de envio de produtos ainda em execução.")
                    return
                }
            try{
                
                inExec = true;
                const sendProductService = new SendProductService();

                    const productsForSend = await ProductErpRepository.findCodeproductsToSendJob();
                    for( const code of  productsForSend ){
                        await sendProductService.sendProduct(code.CODIGO, true);
                    }
               
            }catch(e){
                console.log(e);
                }finally{
                inExec = false;
            }
        });
    }


}