import { conn2, db_publico } from "../../../database/database-connection.ts";

type resultCategory = {
  CODIGO: number
  NOME: string
  NO_SITE: 'S' | 'N'
  DATA_RECAD: string | null
}

type resultCategoryMercos = {
  codigo_bd: number
  codigo_site: string
  data_recad: string | null
}

export class ErpCategoryRepository {
  
  static async findAllCategories(codcategoria?: number): Promise<resultCategory & {codigo_site: number}[] > {
    let sql = `SELECT g.*, cm.codigo_site   
       FROM ${db_publico}.cad_pgru g
        LEFT JOIN ${db_publico}.categorias_mercos cm on cm.codigo_bd = g.CODIGO
      `;
    if (codcategoria) {
      sql += ` AND g.CODIGO = ${codcategoria}`;
    }
    sql += ` ORDER BY g.CODIGO`;

    const [rows] = await conn2.query(sql);
    return rows as resultCategory & {codigo_site: number}[];
  }

  static async findCategoriesForSend(codcategoria?: number): Promise<resultCategory[]> {
    let sql = `SELECT * FROM ${db_publico}.cad_pgru WHERE NO_SITE = 'S'`;
    if (codcategoria) {
      sql += ` AND CODIGO = ${codcategoria}`;
    }
    sql += ` ORDER BY CODIGO`;

    const [rows] = await conn2.query(sql);
    return rows as resultCategory[];
  }

  static async findCategoryMercos(codigoPgru: number): Promise<resultCategoryMercos[]> {
    const sql = `SELECT * FROM ${db_publico}.categorias_mercos WHERE codigo_bd = ${codigoPgru}`;
    const [rows] = await conn2.query(sql);
    return rows as resultCategoryMercos[];
  }

  static async findCategoryAfterInsert(codigoPgru: number): Promise<resultCategoryMercos[]> {
    const sql = `SELECT cm.codigo_bd, cm.codigo_site, cm.data_recad
                 FROM ${db_publico}.cad_pgru g
                 LEFT JOIN ${db_publico}.categorias_mercos cm ON cm.codigo_bd = g.CODIGO
                 WHERE g.NO_SITE = 'S' AND g.CODIGO = ${codigoPgru}`;
    const [rows] = await conn2.query(sql);
    return rows as resultCategoryMercos[];
  }

  static async insertCategoryMercos(params: { codigoBd: number, codigoSite: string, dataRecad: string }) {
    const { codigoBd, codigoSite, dataRecad } = params;
    const sqlInsert = `INSERT INTO ${db_publico}.categorias_mercos (codigo_bd, codigo_site, data_recad)
                       VALUES (?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoBd, codigoSite, dataRecad]);
  }

  static async updateCategorySyncDate(codigoSite: string, codigoBd: number, dataRecad: string) {
    const sqlUpdate = `UPDATE ${db_publico}.categorias_mercos SET data_recad = ? WHERE codigo_site = ? AND codigo_bd = ?`;
    await conn2.query(sqlUpdate, [dataRecad, codigoSite, codigoBd]);
  }

}
