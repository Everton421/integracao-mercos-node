import { conn2, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";

type resultProductStockMercos = {
  descricao: string
  codigo_site: string
  codigo_bd: number
  data_recad: string | null
}

type resultStockProductOld = {
  CODIGO: number
  DESCRICAO: string
  DATARECAD_BANCO: string | null
  DATA_RECAD_SITE: string | null
  ESTOQUE: number
  ESTOQUE_MERCOS: number
}



type resultStockProduct =  
{ 
  ESTOQUE:number
ESTOQUE_TOTAL:number
ESTOQUE_MERCOS:number
CODIGO:number

 } 

export class ErpInventoryRepository {

  static async findProductsStockForSend(codprod?: number): Promise<resultProductStockMercos[]> {
    let sql = `select cp.descricao, pm.codigo_site, pm.codigo_bd, pm.data_recad
               from ${db_publico}.cad_prod cp
               inner join ${db_publico}.produto_mercos pm on pm.codigo_bd = cp.codigo
               where cp.ativo = 'S' and cp.NO_SITE = 'S'`;
    if (codprod) {
      sql += ` and cp.codigo = ${codprod}`;
    }
    const [rows] = await conn2.query(sql);
    return rows as resultProductStockMercos[];
  }


  /**
   ******************* 
   * consulta antiga 
   ******************* 
  */
  static async findStockProductold(codigoProd?: number): Promise<resultStockProductOld[]> {
    const sqlCodeproduct = `AND P.CODIGO = ${codigoProd}`;
    const sql = `select
                    est.CODIGO, est.DESCRICAO, est.DATARECAD_BANCO as DATARECAD_BANCO, EST.ESTOQUE_MERCOS, est.DATA_RECAD_SITE as DATA_RECAD_SITE,
                    if(sum(est.estoque) < 0, 0, sum(est.estoque)) as ESTOQUE
                from
                    (
                        (select
                            P.CODIGO, P.DESCRICAO, PS.SETOR, PS.PRODUTO, max(PS.DATA_RECAD) as DATARECAD_BANCO, ES.estoque as ESTOQUE_MERCOS,
                            ES.DATA_RECAD as DATA_RECAD_SITE, 0 as estoque
                        from ${db_estoque}.prod_setor PS
                        left join ${db_publico}.cad_prod P on P.CODIGO = PS.PRODUTO
                        inner join ${db_publico}.cad_pgru G on P.GRUPO = G.CODIGO
                        left join ${db_estoque}.estoque_mercos ES on ES.codigo_bd = PS.PRODUTO
                        left join ${db_estoque}.setores S on PS.SETOR = S.CODIGO
                        left outer join ${db_publico}.unid_prod U on (U.PRODUTO = P.CODIGO and U.PADR_SAI = 'S')
                        where S.EST_ATUAL = 'X' AND P.NO_SITE = 'S' AND P.ATIVO = 'S' AND G.NO_SITE = 'S'
                    ${codigoProd ? sqlCodeproduct: ''}
                        group by P.CODIGO)
                        UNION ALL
                        (select
                            P.CODIGO, P.DESCRICAO, PS.SETOR, PS.PRODUTO, NULL as DATARECAD_BANCO, ES.estoque as ESTOQUE_MERCOS,
                            ES.DATA_RECAD as DATA_RECAD_SITE,
                            (Sum(PS.ESTOQUE) -
                                (Select coalesce(Sum((If(PO.QTDE_SEPARADA > (PO.QUANTIDADE - PO.QTDE_MOV), PO.QTDE_SEPARADA, (PO.QUANTIDADE - PO.QTDE_MOV)) * PO.FATOR_QTDE) * If(CO.TIPO = '5', -1, 1)), 0)
                                    From ${db_vendas}.cad_orca As CO
                                    Left Outer Join ${db_vendas}.pro_orca As PO On PO.ORCAMENTO = CO.CODIGO
                                    Left Outer Join ${db_vendas}.empresas As E On E.FILIAL = 1
                                    Where CO.SITUACAO In ('AI', 'AP', 'FP')
                                    And ((E.MONT_FATUR <> 'S' And PO.APROVADO In ('A', 'C', 'G', 'P'))
                                        Or
                                        (E.MONT_FATUR = 'S' And PO.APROVADO In ('A', 'C', 'G')))
                                    And PO.PRODUTO = P.CODIGO))/U.FATOR_QTDE as estoque
                        from ${db_estoque}.prod_setor PS
                        left join ${db_publico}.cad_prod P on P.CODIGO = PS.PRODUTO
                        inner join ${db_publico}.cad_pgru G on P.GRUPO = G.CODIGO
                        left join ${db_estoque}.estoque_mercos ES on ES.codigo_bd = PS.PRODUTO
                        left join ${db_estoque}.setores S on PS.SETOR = S.CODIGO
                        left outer join ${db_publico}.unid_prod U on (U.PRODUTO = P.CODIGO and U.PADR_SAI = 'S')
                        where S.EST_ATUAL = 'X' AND P.NO_SITE = 'S' AND P.ATIVO = 'S' AND G.NO_SITE = 'S'
                    ${codigoProd ? sqlCodeproduct: ''}

                        group by P.CODIGO)
                    ) as est
                group by est.CODIGO`;
    console.log(sql)
    const [rows] = await conn2.query(sql);
    return rows as resultStockProductOld[];
  }


  static async findStockProduct(codigoProd: number): Promise<resultStockProduct[]> {
     const sql = `  SELECT
    P.CODIGO,
     round( EST.ESTOQUE_TOTAL ) ESTOQUE_TOTAL,
    em.estoque AS ESTOQUE_MERCOS,
    GREATEST( round(COALESCE(EST.ESTOQUE_TOTAL, 0) ,2)- round(COALESCE(RES.RESERVADO, 0) , 0), 2 ) AS ESTOQUE
 FROM ${db_publico}.cad_prod P
 LEFT JOIN ${db_estoque}.estoque_mercos em 
    ON em.codigo_bd = P.CODIGO
 LEFT JOIN (
    SELECT
        PS.PRODUTO,
        MAX(PS.DATA_RECAD) AS DATA_RECAD,
        SUM(PS.ESTOQUE) AS ESTOQUE_TOTAL
    FROM ${db_estoque}.prod_setor PS
    WHERE PS.SETOR IN (
        SELECT DISTINCT S.SETOR
        FROM ${db_vendas}.empresas_setor S
        WHERE S.EST_ATUAL = 'X' AND S.EST_REAL = 'X' 
    )
    GROUP BY PS.PRODUTO
) EST ON EST.PRODUTO = P.CODIGO
 
LEFT JOIN (
    SELECT
        PO.PRODUTO,
        SUM(
        LEAST(
                COALESCE(PO.QTDE_SEPARADA, 0), 
                GREATEST(PO.QUANTIDADE - PO.QTDE_MOV, 0)
            )
            * PO.FATOR_QTDE
            * IF(CO.TIPO = '5', -1, 1)
        ) AS RESERVADO
    FROM ${db_vendas}.cad_orca CO
    INNER JOIN ${db_vendas}.pro_orca PO ON PO.ORCAMENTO = CO.CODIGO
    WHERE CO.SITUACAO IN ('AI','AP','FP')
    GROUP BY PO.PRODUTO
) RES ON RES.PRODUTO = P.CODIGO
WHERE P.ATIVO = 'S' 
AND P.CODIGO = '${codigoProd}' 
    group by P.CODIGO
`;

    const [rows] = await conn2.query(sql);
    return rows as resultStockProduct[];
  }


  static async insertStockSync(params: { codigoSite: string, codigoBd: number, estoque: number, dataRecad: string | null }) {
    const { codigoSite, codigoBd, estoque, dataRecad } = params;
    const sqlInsert = `REPLACE INTO ${db_estoque}.estoque_mercos (codigo_site, codigo_bd, estoque, data_recad)
                       VALUES (?, ?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoSite, codigoBd, estoque, dataRecad]);
  }

}
