import { conn2,  db_publico } from "../../../database/database-connection.ts";
 


type resultQueryPriceProduct = {
  CODIGO_PP_MERCOS: string | null
  CODIGOPROD_BD: number
  CODIGO_PRECO_BD: number
  ID_SITE: number
  ID_PRECO_SITE: number
  PROD_SITE: number
  PRECO: number
  DATARECAD_SITE: string | null
  DATARECAD_BD: string
}


export class ErpPriceRepository{


    static async findPriceTables(): Promise<[{ CODIGO: number, FILIAL: number, DESCRICAO: String, PADRAO: 'S' | 'N' }]> {
    const sql = ` SELECT * FROM ${db_publico}.tab_precos ORDER BY CODIGO DESC ; `
    const [rows] = await conn2.query(sql)
    return rows as any;
  }
  
 
  static async findPriceProductForSend(erp_sku?:number){
       let sqlPriceProduct = `SELECT
                                        ppm.codigo_bd as CODIGO_PP_MERCOS,
                                        p.CODIGO as CODIGOPROD_BD,
                                        tp.CODIGO as CODIGO_PRECO_BD,
                                        ppm.codigo_site as ID_SITE,
                                        prem.codigo_site as ID_PRECO_SITE,
                                        prom.codigo_site as PROD_SITE,
                                        TRUNCATE(ptp.PRECO * up.FATOR_VAL, 4) as PRECO,
                                        ppm.DATA_RECAD as DATARECAD_SITE,
                                        ptp.DATA_RECAD as DATARECAD_BD
                                     from ${db_publico}.tab_precos tp
                                    inner join ${db_publico}.preco_mercos prem on prem.codigo_bd = tp.CODIGO
                                    inner join ${db_publico}.prod_tabprecos ptp on tp.CODIGO = ptp.TABELA
                                    inner join ${db_publico}.cad_prod p on p.CODIGO = ptp.PRODUTO and p.ATIVO = 'S' and p.NO_SITE = 'S'
                                    inner join ${db_publico}.produto_mercos prom on prom.codigo_bd = p.CODIGO
                                    left join ${db_publico}.unid_prod up on up.produto = p.CODIGO and up.PADR_SAI = 'S'
                                    left join ${db_publico}.prod_preco_mercos ppm on ppm.produto_bd = p.CODIGO and ppm.preco_bd = tp.CODIGO
                                       where tp.ATIVO = 'S'`;
        if (erp_sku) {
          sqlPriceProduct += ` AND p.CODIGO = '${erp_sku}'`;
        }
    
        const [resultQueryPriceProduct] = await conn2.query(sqlPriceProduct);
       return resultQueryPriceProduct as resultQueryPriceProduct[];
  }

  static async updatePriceSyncDate(codigoSite: number, dataRecad: string) {
    const sqlUpdate = `UPDATE ${db_publico}.prod_preco_mercos SET data_recad = ? WHERE codigo_site = ?`;
    await conn2.query(sqlUpdate, [dataRecad, codigoSite]);
  }

  static async insertPriceProduct(params: {
    codigoSite: number
    produtoBd: number
    produtoSite: number
    precoBd: number
    precoSite: number
    dataRecad: string
  }) {
    const { codigoSite, produtoBd, produtoSite, precoBd, precoSite, dataRecad } = params;
    const sqlInsert = `INSERT INTO ${db_publico}.prod_preco_mercos (codigo_site, produto_bd, produto_site, preco_bd, preco_site, DATA_RECAD)
                       VALUES (?, ?, ?, ?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoSite, produtoBd, produtoSite, precoBd, precoSite, dataRecad]);
  }
    
}