import { conn2, db_publico } from "../../../database/database-connection.ts";

type resultTransportCompany = {
  CODIGO: number
  NOME_FANTASIA: string
  CIDADE: string | null
  ESTADO: string | null
  OBSERVACOES: string | null
  OBSERVACOES2: string | null
  DATA_CADASTRO: string | null
  DATA_RECAD: string | null
}

type resultTransportCompanyMercos = {
  codigo_bd: number
  codigo_site: string
  data_recad: string | null
}

type resultTransportCompanyWithSite = resultTransportCompany & { codigo_site: string | null }

export class ErpTransportCompanyRepository {

  static async findAllTransportCompanies(): Promise<resultTransportCompanyWithSite[]> {
    const sql = `SELECT f.*, tm.codigo_site
                 FROM ${db_publico}.cad_forn f
                 LEFT JOIN ${db_publico}.transportadora_mercos tm ON tm.codigo_bd = f.CODIGO
                 WHERE f.ATIV_EMPR = 'T' AND f.ATIVO = 'S'
                 ORDER BY f.CODIGO`;
    const [rows] = await conn2.query(sql);
    return rows as resultTransportCompanyWithSite[];
  }

  static async findTransportCompaniesForSend(codtransportadora?: number): Promise<resultTransportCompany[]> {
    let sql = `SELECT * FROM ${db_publico}.cad_forn
               WHERE ATIV_EMPR = 'T' AND ATIVO = 'S'`;
    if (codtransportadora) {
      sql += ` AND CODIGO = ${codtransportadora}`;
    }
    sql += ` ORDER BY CODIGO`;

    const [rows] = await conn2.query(sql);
    return rows as resultTransportCompany[];
  }

  static async findTransportCompanyMercos(codigobd: number): Promise<resultTransportCompanyMercos[]> {
    const sql = `SELECT * FROM ${db_publico}.transportadora_mercos WHERE codigo_bd = ${codigobd}`;
    const [rows] = await conn2.query(sql);
    return rows as resultTransportCompanyMercos[];
  }

  static async findTransportCompanyAfterInsert(codigobd: number): Promise<resultTransportCompanyMercos[]> {
    const sql = `SELECT tm.codigo_bd, tm.codigo_site, tm.data_recad
                 FROM ${db_publico}.cad_forn f
                 LEFT JOIN ${db_publico}.transportadora_mercos tm ON tm.codigo_bd = f.CODIGO
                 WHERE f.CODIGO = ${codigobd}`;
    const [rows] = await conn2.query(sql);
    return rows as resultTransportCompanyMercos[];
  }

  static async insertTransportCompanyMercos(params: { codigoSite: string, codigoBd: number, dataRecad: string }) {
    const { codigoSite, codigoBd, dataRecad } = params;
    const sqlInsert = `INSERT INTO ${db_publico}.transportadora_mercos (codigo_site, codigo_bd, data_recad)
                       VALUES (?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoSite, codigoBd, dataRecad]);
  }

  static async updateTransportCompanySyncDate(codigoSite: string, codigoBd: number, dataRecad: string) {
    const sqlUpdate = `UPDATE ${db_publico}.transportadora_mercos SET data_recad = ? WHERE codigo_site = ? AND codigo_bd = ?`;
    await conn2.query(sqlUpdate, [dataRecad, codigoSite, codigoBd]);
  }

}
