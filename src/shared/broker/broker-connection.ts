import amqplib, { type ChannelModel, type Channel  } from 'amqplib';
import { type exchange_message } from '../interfaces/exchange-message.ts';

  export let brokerConnection: ChannelModel | null = null;
  export let pubChannel:   Channel | null = null;

const URL = process.env.BROKER_URL;

export async function connectRabbitMQ(): Promise<void> {
    if (!URL) throw new Error("BROKER_URL não definido.");

    try {
        console.log("🔌 [RabbitMQ] Iniciando conexão...");
        
        brokerConnection = await amqplib.connect(URL);
        pubChannel = await brokerConnection.createChannel();

        await Promise.all([
               pubChannel.assertExchange('sistema', 'fanout', { durable: true }),
            
        ])
        console.log("✅ [RabbitMQ] Conectado e Exchange configurada!");

        brokerConnection.on('error', (err) => {
            console.error("❌ [RabbitMQ] Erro na conexão:", err.message);
        });

        brokerConnection.on('close', () => {
            console.warn("⚠️ [RabbitMQ] Conexão fechada. Tentando reconectar em 5s...");
            brokerConnection = null;
            pubChannel = null;
            setTimeout(connectRabbitMQ, 5000);  
        });

    } catch (error) {
        console.error("❌ [RabbitMQ] Falha ao conectar. Tentando novamente em 5s...");
        setTimeout(connectRabbitMQ, 5000);
    }
}

 
// Função exportada para publicar mensagens
export async function publishExchangeMessage( exchange: string , routingKey: string, data: any): Promise<boolean> {
    if (!pubChannel || !brokerConnection) {
        console.warn("⚠️ [RabbitMQ] Sem conexão ativa. Mensagem não enviada.");
        return false;
    }
    try {
        const buffer = Buffer.from(JSON.stringify(data));
        return pubChannel.publish(exchange, routingKey, buffer);
    } catch (error) {
        console.error("❌ [RabbitMQ] Erro ao tentar publicar:", error);
        return false;
    }
}


 



 

