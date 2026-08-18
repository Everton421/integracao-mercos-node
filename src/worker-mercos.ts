import { consumer_sistema } from "./shared/broker/consumer.ts";

if (Number(process.env.EVENTS) > 0) {
     consumer_sistema();

    }else{
        console.log("[X] Os Eventos estão desabilitados.")
    }
