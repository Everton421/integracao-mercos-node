import amqplib from 'amqplib';
 
 
import { StockEventHandler } from '../../modules/inventory/handlers/handle-stock-event.ts';
import { PriceEventHandler } from '../../modules/pricing/handlers/handle-price-event.ts';
import { ProductEventHandler } from '../../modules/products/handlers/handle-product-event.ts';
import { type event } from '../contracts/event.ts';
import { delay } from '../utils/delay.ts';
import { CustomerEventHandler } from '../../modules/customers/handlers/handle-customer-event.ts';


const RECONNECT_DELAY = 5000;

export async function consumer_sistema(): Promise<void> {

  const URL = process.env.BROKER_URL;
  const EXCHANGE = process.env.EXCHANGE_NAME!;
  const QUEUE_NAME = process.env.QUEUE_NAME!;


  if (!QUEUE_NAME || !EXCHANGE) {
    console.log(`QUEUE_NAME: ${QUEUE_NAME} EXCHANGE: ${EXCHANGE}`)
    throw new Error("Verificar variaveis de ambiente do broker do sistema [ QUEUE_NAME,   EXCHANGE_NAME] ");
  }

  async function startConsumer() {

    const conn = await amqplib.connect(URL!);
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });

    const q = await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    await channel.bindQueue(q.queue, EXCHANGE, '');

    console.log(`[*] Worker sistema iniciado na fila [${QUEUE_NAME}] `);

    channel.prefetch(1);
    const delaySyncData = 500;

    await channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {

          let conteudo = JSON.parse(msg.content.toString());

          if (conteudo  ) {

            const data = conteudo as event;
           
            switch (data.tabela_origem) {
              
                case 'cad_clie'   :
                    await delay(delaySyncData, `[...] Aguardando ${delaySyncData/1000} segundos para processar cliente ${data.id_registro} ...`)
                        const customerEventHandler = new CustomerEventHandler();
                        const eventResult = await customerEventHandler.handle(data);
                        if (eventResult.success) {
                            channel.ack(msg);
                        } else {
                            console.log("[x] Falha ao processar cliente: ", eventResult.message)
                            channel.nack(msg, false, true);
                        }
                    break;

                case 'prod_setor'   :
                    await delay(delaySyncData, `[...] Aguardando ${delaySyncData/1000} segundos para processar estoque do produto ${data.id_registro} ...`)
                        const stockEventHandler = new StockEventHandler();
                        const stockResult = await stockEventHandler.handle(data);
                        if (stockResult.success) {
                            channel.ack(msg);
                        } else {
                            console.log("[x] Falha ao processar estoque do produto: ", stockResult.message)
                        let tentativas = 5;

                            while( tentativas > 0 ){
                                await delay(15000);
                                    console.log(`[C] Executando tentativa: ${tentativas}.`)
                                    const stockResult = await stockEventHandler.handle(data);
                                tentativas = tentativas -1;
                            }
                            //channel.nack(msg, false, true);
                            channel.ack(msg);

                        }
                    break;
                   case 'pro_orca':

                               await delay(delaySyncData, `[...] Aguardando ${delaySyncData/1000} segundos para processar estoque do produto ${data.id_registro} ...`)
                        const stockEvent  = new StockEventHandler();
                        const stockResultEvent = await stockEvent .handle(data);
                        if (stockResultEvent.success) {
                            channel.ack(msg);
                        } else {
                            console.log("[x] Falha ao processar estoque do produto: ", stockResultEvent.message)
                           let tentativas = 5;

                            while( tentativas > 0 ){
                                await delay(15000);
                                    console.log(`[C] Executando tentativa: ${tentativas}.`)
                                    const stockResult = await stockEvent.handle(data);
                                tentativas = tentativas -1;
                            }
                            channel.ack(msg);

                        }
                    break;
                case 'prod_tabprecos' :
                    await delay(delaySyncData, `[...] Aguardando ${delaySyncData/1000} segundos para processar preço do produto ${data.id_registro} ...`)
                        const priceEventHandler = new PriceEventHandler();
                        const productEvent = new ProductEventHandler();
                        await productEvent.handle(data);
                        const result = await priceEventHandler.handle(data);
                        
                        if (result.success) {
                            channel.ack(msg);
                        } else {
                            console.log("[x] Falha ao processar preço do produto: ", result.message)

                            let tentativas = 5;
                            while( tentativas > 0 ){
                                await delay(15000);

                                    console.log(`[C] Executando tentativa: ${tentativas}.`)
                                    const result = await priceEventHandler.handle(data);
                                tentativas = tentativas -1;

                            }
                            channel.ack(msg);

                        }
                    break;

                case 'cad_prod' :
                    await delay(delaySyncData, `[...] Aguardando ${delaySyncData/1000} segundos para processar produto ${data.id_registro} ...`)
                        const productEventHandler = new ProductEventHandler();
                        const productResult = await productEventHandler.handle(data);
                        if (productResult.success) {
                            channel.ack(msg);
                        } else {
                            console.log("[x] Falha ao processar produto: ", productResult.message)
                            channel.nack(msg, false, true);
                        }
                    break;

                default:
                    console.log("[X] Mensagem recebida do sistema, porém nenhuma ação será executada.")
                    channel.ack(msg);

                }

          } else {
            console.log("Mensagem vazia: ", conteudo )
                  channel.ack(msg);
          }

        } catch (e) {
          console.log("[x] Erro ao processar a mensagem do broker do sistema: ", e)
                  channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

    conn.on('error', (err) => {
      console.error(`[!] Erro na conexão RabbitMQ (sistema): ${err.message}`);
    });

    conn.on('close', () => {
      console.warn(`[!] Conexão RabbitMQ (sistema) perdida. Reconectando em ${RECONNECT_DELAY / 1000}s...`);
      setTimeout(startConsumer, RECONNECT_DELAY);
    });

    channel.on('error', (err) => {
      console.error(`[!] Erro no channel RabbitMQ (sistema): ${err.message}`);
    });
  }

  await startConsumer();

}
