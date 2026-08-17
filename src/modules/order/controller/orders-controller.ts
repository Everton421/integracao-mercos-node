import type { Request , Response } from "express";
import { ProcessOrdersErpService } from "../service/process-orders-erp-service.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { ReceiveOrderService } from "../service/receive-orders-service.ts";
import { conn2, db_publico, db_vendas } from "../../../database/database-connection.ts";

export class OrdersController{
    
    async getAllOrders(req: Request, res:Response ){

        const dateService = new DateService();
        const date = dateService.obterDataAtual();
            let sql = ` select 
                        co.cod_site codigo_mercos,
                        co.CODIGO codigo_erp,
                        co.TOTAL_GERAL total,
                        cl.NOME nome 
                     from ${db_vendas}.cad_orca co 
                    join ${db_publico}.cad_clie cl on cl.codigo = co.cliente
                       where 
                          co.DATA_CADASTRO = '${date}'
                          and 
                         co.COD_SITE <> 0 `
        const [resultQuery] = await conn2.query(sql);

        res.render('pedidos', 
            {
                'pedidos': resultQuery
            }
        )
    }


async receivOrders(req: Request, res:Response ){
        const dateService = new DateService();
             const dateSearchOrders = req.body.data_inicio as string;

             const formatedDateSearchOrders = dateService.formatarDataHora(dateSearchOrders);
             const receiveOrderService = new ReceiveOrderService();
             const resultReceivedOrders = await receiveOrderService.receiveOrdersUdatedAt(dateSearchOrders);

            return res.json(resultReceivedOrders)
    }

}