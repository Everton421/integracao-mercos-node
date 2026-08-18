
import cron from 'node-cron';
import { ProductErpRepository } from '../../products/repository/produto-repository.ts';
import { UpdatePriceProduct } from '../service/update-preco-service.ts';

export class JobPriceProduct {

    static async job() {


        const configCron = process.env.ENVIAR_PRECOS;

        if (!configCron) {
            return console.log("é necessario configurar a variavel ENVIAR_PRECOS com a expressao cron. ")
         }
            let inExec = false;
                    console.log("[X] Tarefa de envio de precos agendada.")

        cron.schedule(configCron, async () => {

              if(inExec) {
                    console.log("[X] Tarefa de envio de precos ainda em execução.")
                    return
                }
                const updatePriceProduct = new UpdatePriceProduct();

            try{
                inExec = true;
                const productsForSend = await ProductErpRepository.findCodeproductsToSendJob();
                 for( const code of  productsForSend ){
                    await updatePriceProduct.sendPricesProduct(code.CODIGO);
                    }
               
            }catch(e){
                console.log(e);
                }finally{
                inExec = false;
            }
        });
    }


}