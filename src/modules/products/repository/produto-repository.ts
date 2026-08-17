import { conn2, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";

type resultCategoryMercos = {
  codigo_produto: number
  nome_grupo: string
  no_site: 'S' | 'N'
  data_recad_erp: string | null
  codigo_bd: number
  codigo_site: number
  data_recad_mercos: string | null
}

type resultProductMercos = {
  NCM: string | null
  UNIDADE: string | null
  codigo_site: string | null
  codigo_bd: number | null
  DATARECAD_SITE: string | null
  CODIGO: number
  DATARECAD_BANCO: string | null
  DESCRICAO: string
  APLICACAO: string | null
  COMPRIMENTO: number | null
  LARGURA: number | null
  ALTURA: number | null
  PRECO: number
  PESO: number | null
  INDEXADO: number | null
  REF: string | null
  ATIVO: boolean
  MARCA: string | null
  IPI: number | null
}

 
type resultCodeProduct = {
  codigo: number
}
 
type resultIsDisabledProductSite = {
  CODIGO: number
  id_produto_pai: string
  PRODUTO_NO_SITE: 'S' | 'N' | null
  variante_id: string
  SUBGRUPO_NO_SITE: 'S' | 'N' | null
  GRUPO_NO_SITE: 'S' | 'N' | null
}

export class ProductErpRepository {

   static async findDefaultTablePriceProduct(erp_sku:number){
    const sql = `   SELECT tp.CODIGO 
            from ${db_publico}.prod_tabprecos pp  
            join ${db_publico}.tab_precos tp on  pp.tabela = tp.codigo
            where produto = '${erp_sku}'
            and tp.padrao = 'S'
            order by tp.CODIGO `
    const [rows] = await conn2.query(sql)
    return rows as {CODIGO:number}[];
  }

  static async findCategoriesForSend(codprod?: number): Promise<resultCategoryMercos[]> {
    let sqlCategories = `SELECT    p.codigo codigo_produto, g.nome as nome_grupo, g.no_site, g.data_recad as data_recad_erp, cm.codigo_bd, cm.codigo_site, cm.data_recad as data_recad_mercos
                          from ${db_publico}.cad_pgru g
                          inner join ${db_publico}.categorias_mercos cm on cm.codigo_bd = g.CODIGO
                          inner join ${db_publico}.cad_prod p on g.codigo = p.grupo
                          where g.NO_SITE = 'S'`;
    if (codprod) {
      sqlCategories += ` and p.CODIGO = ${codprod}`;
    }
    sqlCategories += ` order by p.codigo desc`;

    const [rows] = await conn2.query(sqlCategories);
    return rows as resultCategoryMercos[];
  }

  static async findProductsForSend(params: { codigogrupobanco: number, tabela?: string, codprod?: number }): Promise<resultProductMercos[]> {
    const { codigogrupobanco, tabela, codprod } = params;
    let sqlProducts = `SELECT
                            concat(cf.NCM,'-',p.CODIGO) as NCM,
                            up.SIGLA as UNIDADE,
                            ps.codigo_site,
                            ps.codigo_bd,
                            ps.data_recad as DATARECAD_SITE,
                            p.CODIGO,
                            p.DATA_RECAD as DATARECAD_BANCO,
                            p.DESCR_REDUZ,
                            p.DESCR_CURTA,
                            p.DESCR_LONGA,
                            p.DESCRICAO,
                            p.APLICACAO,
                            p.COMPRIMENTO,
                            p.LARGURA,
                            p.ALTURA,
                            TRUNCATE(COALESCE(tp.PRECO * up.FATOR_VAL, 0), 4) AS PRECO,
                            PESO,
                            pc.INDEXADO,
                            p.NUM_ORIGINAL as REF,
                            (CASE WHEN (p.ATIVO = 'S' AND p.NO_SITE = 'S') THEN TRUE ELSE FALSE END) AS ATIVO,
                            m.descricao as MARCA,
                            if(isnull(r.ALIQ_VAL_IPI),0, r.ALIQ_VAL_IPI) IPI
                        FROM
                            ${db_publico}.cad_prod p
                            LEFT JOIN ${db_publico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO AND tp.tabela = 2
                            LEFT JOIN ${db_publico}.unid_prod up ON up.produto = p.CODIGO AND up.PADR_SAI = 'S'
                            LEFT JOIN ${db_publico}.class_fiscal cf ON cf.CODIGO = p.CLASS_FISCAL
                            LEFT JOIN ${db_publico}.produto_mercos ps ON p.codigo = ps.codigo_bd
                            LEFT JOIN ${db_publico}.cad_pmar m ON m.codigo = p.marca
                            LEFT JOIN ${db_publico}.prod_custos pc on pc.produto = p.codigo
                            LEFT JOIN ${db_publico}.itens_regra_ipi_ii i ON i.tipo = 'P' AND i.cod_item = p.codigo
                            LEFT OUTER JOIN ${db_publico}.regras_ipi_ii r ON r.codigo = i.regra AND r.subaplic_prod = 'P' AND r.tipo_trans = 'V'
                        WHERE
                            (p.NO_SITE = 'S' AND p.ATIVO = 'S' OR ps.codigo_bd != '')
                            AND p.GRADE = 0
                            ${tabela ?? ''}
                            and p.GRUPO = ${codigogrupobanco}`;
    if (codprod) {
      sqlProducts += ` and p.CODIGO = ${codprod}`;
    }
    sqlProducts += ` GROUP BY tp.tabela, p.codigo ORDER BY p.CODIGO DESC`;

    const [rows] = await conn2.query(sqlProducts);
    return rows as resultProductMercos[];
  }

  static async findStockProduct(codigoProd: number): Promise<{ ESTOQUE: string }[]> {
    const sql = `select
                    est.CODIGO,
                    est.DESCRICAO,
                    REPLACE(FORMAT(if(est.estoque < 0, 0, est.estoque), 0),',','') as ESTOQUE
                from
                    (select
                        P.CODIGO,
                        P.DESCRICAO,
                        (Sum(PS.ESTOQUE) -
                            (Select coalesce(Sum((If(PO.QTDE_SEPARADA > (PO.QUANTIDADE - PO.QTDE_MOV), PO.QTDE_SEPARADA, (PO.QUANTIDADE - PO.QTDE_MOV)) * PO.FATOR_QTDE) * If(CO.TIPO = '5', -1, 1)), 0)
                                From ${db_vendas}.cad_orca As CO
                                Left Outer Join ${db_vendas}.pro_orca As PO On PO.ORCAMENTO = CO.CODIGO
                                Left Outer Join ${db_vendas}.empresas As E On E.FILIAL = 2
                                Where CO.SITUACAO In ('AI', 'AP', 'FP')
                                And ((E.MONT_FATUR <> 'S' And PO.APROVADO In ('A', 'C', 'G', 'P'))
                                    Or
                                    (E.MONT_FATUR = 'S' And PO.APROVADO In ('A', 'C', 'G')))
                                And PO.PRODUTO = P.CODIGO)) as estoque
                    From ${db_estoque}.prod_setor PS
                    left join ${db_publico}.cad_prod P on P.CODIGO = PS.PRODUTO
                    inner join ${db_publico}.cad_pgru G on P.GRUPO = G.CODIGO
                    left join ${db_estoque}.setores S on PS.SETOR = S.CODIGO
                    where S.EST_ATUAL = 'X' AND P.NO_SITE = 'S' AND P.ATIVO = 'S'
                    AND P.CODIGO = ${codigoProd}
                    group by P.CODIGO) as est`;

    const [rows] = await conn2.query(sql);
    return rows as { ESTOQUE: string }[];
  }

  static async insertProductMercos(params: { codigoSite: string, codigoBd: number, dataRecad: string }) {
    const { codigoSite, codigoBd, dataRecad } = params;
    const sqlInsert = `INSERT INTO ${db_publico}.produto_mercos (codigo_site, codigo_bd, data_recad)
                       VALUES (?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoSite, codigoBd, dataRecad]);
  }

  static async updateProductSyncDate(codigoSite: string, codigoBd: number, dataRecad: string) {
    const sqlUpdate = `UPDATE ${db_publico}.produto_mercos SET data_recad = ? WHERE codigo_site = ? AND codigo_bd = ?`;
    await conn2.query(sqlUpdate, [dataRecad, codigoSite, codigoBd]);
  }

}