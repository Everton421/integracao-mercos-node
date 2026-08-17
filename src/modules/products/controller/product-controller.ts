import { conn2, db_publico } from "../../../database/database-connection.ts";
import type { Request, Response } from "express";
import { SendProductService, type ProductResultItem } from "../service/send-product-service.ts";

export class ProductController{

    async getAllProduct (req: Request, res: Response) {
        try {

            
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const search = req.query.search || '' as any;

            const sync_status = req.query.sync_status || 'synced' as any;

            
                     const sqlProducts = `select
                         p.CODIGO, pm.codigo_site, p.DESCRICAO, p.ATIVO, p.NO_SITE,
                         p.GRUPO as CODIGO_GRUPO, p.SUBGRUPO as CODIGO_SUBGRUPO
                          from ${db_publico}.cad_prod p
                           left join ${db_publico}.produto_mercos pm on pm.codigo_bd = p.CODIGO
                            where p.ATIVO='S' 
                            group by p.CODIGO
                             order by p.CODIGO
                             `;


            const [produtosResult, gruposResult, subgruposResult] = await Promise.all([
                  conn2.query(sqlProducts),
                conn2.query(`SELECT CODIGO, NOME FROM ${db_publico}.cad_pgru where ativo = 'S';`),
                conn2.query(`SELECT CODIGO, DESCRICAO, COD_GRUPO FROM ${db_publico}.subgrupos  ;`)
            ])
            const produtos = produtosResult[0] as any[];
            const grupos = gruposResult[0] as any[];
            const subgrupos = subgruposResult[0] as any[];
            const totalPages = Math.ceil(produtos.length / limit);

            res.render('produtos', {
                produtos: produtos,
                grupos: grupos,
                subgrupos: subgrupos,
                pagination: {
                    page: page,
                    limit: limit,
                    totalRegistros: produtos.length,
                    totalPages: totalPages
                },
                filters: {
                    search: search,
                    sync_status: sync_status
                }
            });

        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            res.status(500).send("Erro interno");
        }
    }
    async syncProduct(req: Request, res: Response) {

        const produtos = req.body.produtos as string[];
        const sendProductService  = new SendProductService();
        const allSuccess: ProductResultItem[] = [];
        const allErrors: ProductResultItem[] = [];

        for(const erp_sku of produtos ){
            const resultSendProduct = await sendProductService.sendProduct(Number(erp_sku));
            if(resultSendProduct.data) {
                allSuccess.push(...resultSendProduct.data.sucesso);
                allErrors.push(...resultSendProduct.data.erros);
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
            products: [...allSuccess, ...allErrors]
        });
    }

    
}

   






/*  

async allProducts(req: Request, res: Response) {
        try {
            const configuracoesIntegration = new ConfiguracoesIntegration();
            const arrConfig = await configuracoesIntegration.select();

            let tabela = 0;
            const { tabela_preco } = arrConfig[0];
            if (tabela_preco > 0) tabela = tabela_preco;

            const produtoRepository = new ProductErpRepository();
            const fotosProdutosIntegration = new FotosProdutoIntegration();

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const search = req.query.search || '' as any;

            const sync_status = req.query.sync_status || 'synced' as any;

            const offset = (page - 1) * limit;


            let [produtos, totalRegistros, grupos, subgrupos] = await Promise.all([

                produtoRepository.searchSyncedProductErp({ limit: limit, offset: offset, priceTable: tabela, search: search, syncStatus: sync_status }),

                produtoRepository.countTotalProductsErp({ priceTable: tabela, search: search, syncStatus: sync_status }),
                 produtoRepository.findGroupErp(),
                produtoRepository.findSubGroupErp() 

            ]);

            const totalPages = Math.ceil(totalRegistros / limit);




            res.render('produtos', {
                produtos: produtos,
                grupos:grupos,
                subgrupos: subgrupos,
                pagination: {
                    page: page,
                    limit: limit,
                    totalRegistros: totalRegistros,
                    totalPages: totalPages
                },
                filters: {
                    search: search,
                    sync_status: sync_status
                }
            });

        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            res.status(500).send("Erro interno");
        }
    }
        */