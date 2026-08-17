import { conn2, db_publico } from "../../../database/database-connection.ts";

type resultPriceTable = {
  CODIGO: number
  DESCRICAO: string
  ATIVO: 'S' | 'N'
  DATA_CADASTRO: string | null
  DATA_RECAD: string | null
}

type resultPriceTableMercos = {
  codigo_bd: number
  codigo_site: string
  data_recad: string | null
}

export class ErpPriceTableRepository {

  static async findPriceTablesForSend(codtabela?: number): Promise<resultPriceTable[]> {
    let sql = `SELECT * FROM ${db_publico}.tab_precos
               WHERE ATIVO = 'S'`;
    if (codtabela) {
      sql += ` AND CODIGO = ${codtabela}`;
    }
    sql += ` ORDER BY CODIGO`;

    const [rows] = await conn2.query(sql);
    return rows as resultPriceTable[];
  }

  static async findPriceTableMercos(codtabela: number): Promise<resultPriceTableMercos[]> {
    const sql = `SELECT * FROM ${db_publico}.preco_mercos WHERE codigo_bd = ${codtabela}`;
    const [rows] = await conn2.query(sql);
    return rows as resultPriceTableMercos[];
  }

  static async findPriceTableAfterInsert(codtabela: number): Promise<resultPriceTableMercos[]> {
    const sql = `SELECT pm.codigo_bd, pm.codigo_site, pm.data_recad
                 FROM ${db_publico}.tab_precos tp
                 LEFT JOIN ${db_publico}.preco_mercos pm ON pm.codigo_bd = tp.CODIGO
                 WHERE tp.CODIGO = ${codtabela}`;
    const [rows] = await conn2.query(sql);
    return rows as resultPriceTableMercos[];
  }

  static async insertPriceTableMercos(params: { codigoSite: string, codigoBd: number, dataRecad: string }) {
    const { codigoSite, codigoBd, dataRecad } = params;
    const sqlInsert = `INSERT INTO ${db_publico}.preco_mercos (codigo_site, codigo_bd, data_recad)
                       VALUES (?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoSite, codigoBd, dataRecad]);
  }

  static async updatePriceTableSyncDate(codigoSite: string, codigoBd: number, dataRecad: string) {
    const sqlUpdate = `UPDATE ${db_publico}.preco_mercos SET data_recad = ? WHERE codigo_site = ? AND codigo_bd = ?`;
    await conn2.query(sqlUpdate, [dataRecad, codigoSite, codigoBd]);
  }

}
