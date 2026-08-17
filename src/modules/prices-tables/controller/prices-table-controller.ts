import type { Request, Response } from 'express'
import { conn2, db_publico } from '../../../database/database-connection.ts';
import { SendPriceTableService, type PriceTableResultItem } from '../service/send-price-table-service.ts';

export class PricesTableController {
    
        async getAllPricesTables( req: Request, res: Response ){

            const sqlPricesTablees =  ` SELECT 
                                                tm.codigo_site,
                                                tp.*
                                            FROM ${db_publico}.tab_precos tp 
                                            left join ${db_publico}.preco_mercos tm on tp.CODIGO = tm.codigo_bd `;
                                            
        const [resultTables]= await conn2.query(sqlPricesTablees);
                
            res.render('tabelas-precos',
                {
                    tabelas:resultTables
                }
            );
    }

    async postPriceTables(req: Request, res: Response) {
        const tablesId = req.body.tabelas as string[];
        const sendPriceTableService = new SendPriceTableService();
        const allSuccess: PriceTableResultItem[] = [];
        const allErrors: PriceTableResultItem[] = [];

        for (const id of tablesId) {
            const resultPostTable = await sendPriceTableService.sendPriceTable(Number(id));
            if (resultPostTable.data) {
                allSuccess.push(...resultPostTable.data.sucesso);
                allErrors.push(...resultPostTable.data.erros);
            }
        }

        const total = allSuccess.length + allErrors.length;
        const hasMixed = allSuccess.length > 0 && allErrors.length > 0;
        const httpStatus = allErrors.length === 0 ? 200 : (hasMixed ? 207 : 500);

        return res.status(httpStatus).json({
            success: allErrors.length === 0,
            summary: {
                total,
                sucesso: allSuccess.length,
                erros: allErrors.length
            },
            tables: [...allSuccess, ...allErrors]
        });
    }
}