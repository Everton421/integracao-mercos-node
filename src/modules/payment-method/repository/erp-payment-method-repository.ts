import { conn2, db_publico } from "../../../database/database-connection.ts";

type resultPaymentCondition = {
  CODIGO: number
  DESCRICAO: string
  VALOR_MINIMO: number | string | null
  ATIVO: 'S' | 'N'
  NO_SITE: 'S' | 'N'
  DATA_RECAD: string | null
}

type resultPaymentConditionMercos = {
  codigo_bd: number
  codigo_site: string
  data_recad: string | null
}

export class ErpPaymentMethodRepository {

  static async findAllPaymentConditions(): Promise<(resultPaymentCondition & { codigo_site: string | null })[]> {
    const sql = `SELECT p.*, cm.codigo_site
                 FROM ${db_publico}.cad_fpgt p
                 LEFT JOIN ${db_publico}.condicao_mercos cm ON cm.codigo_bd = p.CODIGO
                 ORDER BY p.CODIGO`;
    const [rows] = await conn2.query(sql);
    return rows as (resultPaymentCondition & { codigo_site: string | null })[];
  }

  static async findPaymentConditionsForSend(codcondicao?: number): Promise<resultPaymentCondition[]> {
    let sql = `SELECT * FROM ${db_publico}.cad_fpgt
               WHERE ATIVO = 'S' AND NO_SITE = 'S'`;
    if (codcondicao) {
      sql += ` AND CODIGO = ${codcondicao}`;
    }
    sql += ` ORDER BY CODIGO`;

    const [rows] = await conn2.query(sql);
    return rows as resultPaymentCondition[];
  }

  static async findPaymentConditionMercos(codcondicao: number): Promise<resultPaymentConditionMercos[]> {
    const sql = `SELECT * FROM ${db_publico}.condicao_mercos WHERE codigo_bd = ${codcondicao}`;
    const [rows] = await conn2.query(sql);
    return rows as resultPaymentConditionMercos[];
  }

  static async findPaymentConditionAfterInsert(codcondicao: number): Promise<resultPaymentConditionMercos[]> {
    const sql = `SELECT pm.codigo_bd, pm.codigo_site, pm.data_recad
                 FROM ${db_publico}.cad_fpgt p
                 LEFT JOIN ${db_publico}.condicao_mercos pm ON pm.codigo_bd = p.CODIGO
                 WHERE p.CODIGO = ${codcondicao}`;
    const [rows] = await conn2.query(sql);
    return rows as resultPaymentConditionMercos[];
  }

  static async insertPaymentConditionMercos(params: { codigoSite: string, codigoBd: number, dataRecad: string }) {
    const { codigoSite, codigoBd, dataRecad } = params;
    const sqlInsert = `INSERT INTO ${db_publico}.condicao_mercos (codigo_site, codigo_bd, data_recad)
                       VALUES (?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoSite, codigoBd, dataRecad]);
  }

  static async updatePaymentConditionSyncDate(codigoSite: string, codigoBd: number, dataRecad: string) {
    const sqlUpdate = `UPDATE ${db_publico}.condicao_mercos SET data_recad = ? WHERE codigo_site = ? AND codigo_bd = ?`;
    await conn2.query(sqlUpdate, [dataRecad, codigoSite, codigoBd]);
  }

  static async removePaymentConditionMercos(codigoBd: number) {
    const sqlDelete = `DELETE FROM ${db_publico}.condicao_mercos WHERE codigo_bd = ?`;
    await conn2.query(sqlDelete, [codigoBd]);
  }

}
