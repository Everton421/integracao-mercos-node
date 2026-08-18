import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import "express-async-errors";
import path from 'path';

import cookieParser from 'cookie-parser';
import { router } from './web/routes.ts';
import { JobPedido } from './modules/order/job/job-order.ts';
import { consumer_sistema } from './shared/broker/consumer.ts';
import { JobPriceProduct } from './modules/pricing/job/job-price-product.ts';
import { JobProducts } from './modules/products/job/job-products.ts';
import { JobInventory } from './modules/inventory/job/job-inventory.ts';


const app = express();

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.set('views', path.join(import.meta.dirname, '/web/Views'));

app.use(express.json());
app.use(router)
app.use(cors());
app.use(cookieParser());
app.use(
    (err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof Error) {
            return res.status(400).json({
                error: err.message,
            })
        }
        res.status(500).json({
            status: 'error ',
            messsage: 'internal server error.'
        })
    })

if( Number(process.env.JOBS) > 0) {
    await JobPedido.job();
     await JobProducts.job();
     await JobPriceProduct.job();
     await JobInventory.job();
}

if (Number(process.env.EVENTS) > 0) {
     consumer_sistema();
}



const PORT_API = process.env.PORT_API; // Porta padrão para HTTPS

app.listen(PORT_API, async () => {

    console.log(`app rodando porta ${PORT_API}  `)

})


