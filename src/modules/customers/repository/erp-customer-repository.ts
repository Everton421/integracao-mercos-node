import { conn2, db_publico } from "../../../database/database-connection.ts";

type resultCustomer = {
  CODIGO: number
  NOME: string
  APELIDO: string
  FIS_JUR: 'F' | 'J' | string
  CPF: string
  CONTRIB: string
  RG: string
  ENDERECO: string
  NUMERO: string
  COMPLEMENTO: string
  BAIRRO: string
  CEP: string
  CIDADE: string
  ESTADO: string
  OBSERVACOES: string
  EMAIL: string
  TELEFONE_RES: string
  TELEFONE_COM: string
  CELULAR: string
  DATA_CADASTRO: string | null
  DATA_RECAD: string | null
}

type resultCustomerMercos = {
  codigo_bd: number
  codigo_site: string
  data_recad: string | null
}

type resultCustomerAfterInsert = {
  codigo_bd: number
  codigo_site: string | null
  data_recad: string | null
}

type paramsInsertCustomer = {
  nome: string
  apelido: string
  fisJur: string
  cpf: string
  rg: string
  contrib: string
  email: string
  endereco: string
  numero: string
  observacoes: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  telefone: string
  dataCadastro: string
  dataRecad: string
}

type paramsUpdateCustomer = {
  coluna: string
  valor: string
}

export class ErpCustomerRepository {

  static async findCustomersForSend(codcliente?: number): Promise<resultCustomer[]> {
    let sql = `SELECT * FROM ${db_publico}.cad_clie
               WHERE NO_SITE = 'S' AND ATIVO = 'S' AND CPF <> '' AND CPF IS NOT NULL`;
    if (codcliente) {
      sql += ` AND CODIGO = ${codcliente}`;
    }
    sql += ` ORDER BY CODIGO`;

    const [rows] = await conn2.query(sql);
    return rows as resultCustomer[];
  }

  static async findCustomerMercos(codigobd: number): Promise<resultCustomerMercos[]> {
    const sql = `SELECT * FROM ${db_publico}.cliente_mercos WHERE codigo_bd = ${codigobd}`;
    const [rows] = await conn2.query(sql);
    return rows as resultCustomerMercos[];
  }

  static async findCustomerAfterInsert(codigobd: number): Promise<resultCustomerAfterInsert[]> {
    const sql = `SELECT c.CODIGO as codigo_bd, cm.codigo_site, cm.data_recad
                 FROM ${db_publico}.cad_clie c
                 LEFT JOIN ${db_publico}.cliente_mercos cm ON cm.codigo_bd = c.CODIGO
                 WHERE c.CODIGO = ${codigobd}`;
    const [rows] = await conn2.query(sql);
    return rows as resultCustomerMercos[];
  }

  static async insertCustomerMercos(params: { codigoSite: string, codigoBd: number, dataRecad: string }) {
    const { codigoSite, codigoBd, dataRecad } = params;
    const sqlInsert = `INSERT INTO ${db_publico}.cliente_mercos (codigo_site, codigo_bd, data_recad)
                       VALUES (?, ?, ?)`;
    await conn2.query(sqlInsert, [codigoSite, codigoBd, dataRecad]);
  }

  static async updateCustomerSyncDate(codigoSite: string, codigoBd: number, dataRecad: string) {
    const sqlUpdate = `UPDATE ${db_publico}.cliente_mercos SET data_recad = ? WHERE codigo_site = ? AND codigo_bd = ?`;
    await conn2.query(sqlUpdate, [dataRecad, codigoSite, codigoBd]);
  }

  static async findCustomerByCpf(cpfMascarado: string): Promise<resultCustomer[]> {
    const sql = `SELECT * FROM ${db_publico}.cad_clie WHERE CPF = ?`;
    const [rows] = await conn2.query(sql, [cpfMascarado]);
    return rows as resultCustomer[];
  }

  static async findCustomerAfterInsertByCpf(nome: string, cpfMascarado: string): Promise<resultCustomer[]> {
    const sql = `SELECT c.* FROM ${db_publico}.cad_clie c
                 LEFT JOIN ${db_publico}.cliente_mercos cm ON cm.codigo_bd = c.CODIGO
                 WHERE c.APELIDO = ? AND c.NOME = ? AND c.cpf = ?`;
    const [rows] = await conn2.query(sql, [nome, nome, cpfMascarado]);
    return rows as resultCustomer[];
  }

  static async updateCustomer(codigobd: number, updates: paramsUpdateCustomer[]) {
    const sets = updates.map((u) => `${u.coluna} = ?`).join(', ');
    const values = updates.map((u) => u.valor);
    const sql = `UPDATE ${db_publico}.cad_clie SET ${sets} WHERE CODIGO = ?`;
    await conn2.query(sql, [...values, codigobd]);
  }

  static async updateCustomerMercosDataRecad(codigobd: number) {
    const sql = `UPDATE ${db_publico}.cliente_mercos SET data_recad = now() WHERE codigo_bd = ?`;
    await conn2.query(sql, [codigobd]);
  }

  static async insertCustomer(params: paramsInsertCustomer) {
    const { nome, apelido, fisJur, cpf, rg, contrib, email, endereco, numero, observacoes, bairro, cidade, estado, cep, telefone, dataCadastro, dataRecad } = params;
    const sql = `INSERT INTO ${db_publico}.cad_clie
                 (nome, apelido, fis_jur, cpf, rg, contrib, email_fiscal, email, senha, historico, bloq_motivo, obs_bancaria, obs_comercial1, obs_comercial2, obs_comercial3, obs_pessoal, endereco, numero, observacoes, bairro, cidade, ESTADO, cep, telefone_res, celular, data_cadastro, data_recad, consumidor_final, ativo, no_site)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '', '', '', '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'S', 'S', 'S')`;
    await conn2.query(sql, [nome, apelido, fisJur, cpf, rg, contrib, email, email, endereco, numero, observacoes, bairro, cidade, estado, cep, telefone, telefone, dataCadastro, dataRecad]);
  }

}
