import { conn2, db_publico, db_vendas } from "../../../database/database-connection.ts";

type resultCondicao = {
  CODIGO: number
  NUM_PARCELAS: number
  INTERVALO: number
  DIAS_ENTRADA: number
}

type resultTransportadora = {
  codigo_bd: number
}

type resultCliente = {
  CODIGO: number
  NOME: string
}

type resultUsuarioMercos = {
  codigo_site: string
  codigo_bd: number
  email: string
}

type resultProdutoCusto = {
  CODIGO: number
  ULT_CUSTO: number | null
  CUSTO_MEDIO: number | null
  SIGLA: string
}

type resultTabPreco = {
  codigo_bd: number
}

type resultTabPrecoPadrao = {
  CODIGO: number
}

type resultPedidoByCodSite = {
  CODIGO: number
  data_inclusao: string | null
}

type resultCadOrcaByCodSite = {
  CODIGO: number
}

type paramsUpdateCadOrca = {
  cliente: number | string
  totalProdutos: number
  totalGeral: number
  descProd: number
  valorFrete: number
  vendedor: number | string
  qtdeParcelas: number
  transportadora: number | string
  observacoes2: string
  formaPagamento: number | string
  tipo: string
  contato: string
}

type paramsInsertCadOrca = {
  codSite: number | string
  cliente: number | string
  totalProdutos: number
  descProd: number
  totalGeral: number
  agora: string
  valorFrete: number
  vendedor: number | string
  contato: string
  observacoes2: string
  tipo: string
  qtdeParcelas: number
  formaPagamento: number | string
}

type paramsInsertProOrca = {
  orcamento: number
  sequencia: number
  produto: number | string
  unidade: string
  quantidade: number
  unitario: number
  tabela: string
  precoTabela: number
  custoMedio: number | null
  ultimoCusto: number | null
  frete: number
  ipi: number
  desconto: number
}

type paramsInsertParOrca = {
  orcamento: number
  parcela: number
  valor: number
  diasPagto: number
  tipoReceb: number | string
}

export class ErpOrderRepository {

  static async findCondicaoPagamento(codigoSite: number): Promise<resultCondicao[]> {
    const sql = `SELECT cfp.CODIGO, cfp.NUM_PARCELAS, cfp.INTERVALO, cfp.DIAS_ENTRADA
                 FROM ${db_publico}.cad_fpgt cfp
                 INNER JOIN ${db_publico}.condicao_mercos pm ON pm.codigo_bd = cfp.CODIGO
                 WHERE pm.codigo_site = ?`;
    const [rows] = await conn2.query(sql, [codigoSite]);
    return rows as resultCondicao[];
  }

  static async findPagamento(codigoSite: number): Promise<resultCondicao[]> {
    const sql = `SELECT cfp.CODIGO, cfp.NUM_PARCELAS, cfp.INTERVALO, cfp.DIAS_ENTRADA
                 FROM ${db_publico}.cad_fpgt cfp
                 INNER JOIN ${db_publico}.pagamento_mercos pm ON pm.codigo_bd = cfp.CODIGO
                 WHERE pm.codigo_site = ?`;
    const [rows] = await conn2.query(sql, [codigoSite]);
    return rows as resultCondicao[];
  }

  static async findTransportadoraBd(codigoSite: number): Promise<resultTransportadora[]> {
    const sql = `SELECT codigo_bd FROM ${db_publico}.transportadora_mercos WHERE codigo_site = ?`;
    const [rows] = await conn2.query(sql, [codigoSite]);
    return rows as resultTransportadora[];
  }

  static async findClienteByCpf(cpfMascarado: string): Promise<resultCliente[]> {
    const sql = `SELECT * FROM ${db_publico}.cad_clie WHERE CPF = ?`;
    const [rows] = await conn2.query(sql, [cpfMascarado]);
    return rows as resultCliente[];
  }

  static async findUsuarioMercos(codigoSite: number): Promise<resultUsuarioMercos[]> {
    const sql = `SELECT codigo_site, codigo_bd, email FROM ${db_publico}.usuario_mercos WHERE codigo_site = ?`;
    const [rows] = await conn2.query(sql, [codigoSite]);
    return rows as resultUsuarioMercos[];
  }

  static async findProdutoCusto(codigoProduto: number | string): Promise<resultProdutoCusto[]> {
    const sql = `SELECT cp.CODIGO, pc.ULT_CUSTO, pc.CUSTO_MEDIO, up.SIGLA
                 FROM ${db_publico}.cad_prod cp
                 LEFT JOIN ${db_publico}.unid_prod up ON up.produto = cp.CODIGO AND up.PADR_SAI = 'S'
                 LEFT JOIN ${db_publico}.prod_custos pc ON cp.CODIGO = pc.produto
                 WHERE cp.CODIGO = ?`;
    const [rows] = await conn2.query(sql, [codigoProduto]);
    return rows as resultProdutoCusto[];
  }

  static async findTabPreco(codigoSite: number): Promise<resultTabPreco[]> {
    const sql = `SELECT codigo_bd FROM ${db_publico}.preco_mercos WHERE codigo_site = ?`;
    const [rows] = await conn2.query(sql, [codigoSite]);
    return rows as resultTabPreco[];
  }

  static async findTabPrecoPadrao(): Promise<resultTabPrecoPadrao[]> {
    const sql = `SELECT CODIGO FROM ${db_publico}.tab_precos WHERE PADRAO = 'S'`;
    const [rows] = await conn2.query(sql);
    return rows as resultTabPrecoPadrao[];
  }

  static async findPedidoByCodSite(codigoSite: number): Promise<resultPedidoByCodSite[]> {
    const sql = `SELECT co.*, pm.data_inclusao
                 FROM ${db_vendas}.cad_orca co
                 INNER JOIN ${db_vendas}.pedido_mercos pm ON co.CODIGO = pm.codigo_pedido_bd
                 WHERE co.cod_site = ?`;
    const [rows] = await conn2.query(sql, [codigoSite]);
    return rows as resultPedidoByCodSite[];
  }

  static async updateCadOrca(codigoSite: number, params: paramsUpdateCadOrca) {
    const { cliente, totalProdutos, totalGeral, descProd, valorFrete, vendedor, qtdeParcelas, transportadora, observacoes2, formaPagamento, tipo, contato } = params;
    const sql = `UPDATE ${db_vendas}.cad_orca SET
                 cliente = ?, total_produtos = ?, total_geral = ?, desc_prod = ?, valor_frete = ?,
                 vendedor = ?, QTDE_PARCELAS = ?, TRANSPORTADORA = ?, OBSERVACOES2 = ?, FORMA_PAGAMENTO = ?,
                 TIPO = ?, contato = ?
                 WHERE cod_site = ?`;
    await conn2.query(sql, [cliente, totalProdutos, totalGeral, descProd, valorFrete, vendedor, qtdeParcelas, transportadora, observacoes2, formaPagamento, tipo, contato, codigoSite]);
  }

  static async insertCadOrca(params: paramsInsertCadOrca) {
    const { codSite, cliente, totalProdutos, descProd, totalGeral, agora, valorFrete, vendedor, contato, observacoes2, tipo, qtdeParcelas, formaPagamento } = params;
    const sql = `INSERT INTO ${db_vendas}.cad_orca
                 (status, cod_site, cliente, total_produtos, desc_prod, total_geral, data_pedido, valor_frete, situacao, data_cadastro, hora_cadastro, data_inicio, hora_inicio, vendedor, contato, observacoes, observacoes2, tipo, NF_ENT_OS, RECEPTOR, VAL_PROD_MANIP, PERC_PROD_MANIP, PERC_SERV_MANIP, REVISAO_COMPLETA, DESTACAR, TABELA, QTDE_PARCELAS, ALIQ_ISSQN, OUTRAS_DESPESAS, PESO_LIQUIDO, BASE_ICMS_UF_DEST, FORMA_PAGAMENTO)
                 VALUES ('0', ?, ?, ?, ?, ?, ?, ?, 'EA', ?, ?, ?, ?, ?, ?, '', ?, ?, '', '', ?, '100', '100', 'N', 'N', 'P', ?, '0.00', '0', '0', '0.00', ?)`;
    await conn2.query(sql, [codSite, cliente, totalProdutos, descProd, totalGeral, agora, valorFrete, agora, agora, agora, agora, vendedor, contato, observacoes2, tipo, totalProdutos, qtdeParcelas, formaPagamento]);
  }

  static async findCadOrcaByCodSite(codigoSite: number): Promise<resultCadOrcaByCodSite[]> {
    const sql = `SELECT * FROM ${db_vendas}.cad_orca WHERE cod_site = ?`;
    const [rows] = await conn2.query(sql, [codigoSite]);
    return rows as resultCadOrcaByCodSite[];
  }

  static async deleteProOrca(codigoOrcamento: number) {
    const sql = `DELETE FROM ${db_vendas}.pro_orca WHERE ORCAMENTO = ?`;
    await conn2.query(sql, [codigoOrcamento]);
  }

  static async deleteParOrca(codigoOrcamento: number) {
    const sql = `DELETE FROM ${db_vendas}.par_orca WHERE ORCAMENTO = ?`;
    await conn2.query(sql, [codigoOrcamento]);
  }

  static async insertProOrca(params: paramsInsertProOrca) {
    const { orcamento, sequencia, produto, unidade, quantidade, unitario, tabela, precoTabela, custoMedio, ultimoCusto, frete, ipi, desconto } = params;
    const sql = `INSERT INTO ${db_vendas}.pro_orca
                 (orcamento, sequencia, produto, grade, padronizado, complemento, unidade, item_unid, just_ipi, just_icms, just_subst, quantidade, unitario, tabela, preco_tabela, CUSTO_MEDIO, ULT_CUSTO, FRETE, ipi, desconto)
                 VALUES (?, ?, ?, '0', '0', '', ?, '1', '0', '0', '0', ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await conn2.query(sql, [orcamento, sequencia, produto, unidade, quantidade, unitario, tabela, precoTabela, custoMedio, ultimoCusto, frete, ipi, desconto]);
  }

  static async insertParOrca(params: paramsInsertParOrca) {
    const { orcamento, parcela, valor, diasPagto, tipoReceb } = params;
    const sql = `INSERT INTO ${db_vendas}.par_orca (orcamento, parcela, valor, vencimento, tipo_receb)
                 VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`;
    await conn2.query(sql, [orcamento, parcela, valor, diasPagto, tipoReceb]);
  }

  static async updatePedidoMercosDataInclusao(codigoSite: number, dataInclusao: string) {
    const sql = `UPDATE ${db_vendas}.pedido_mercos SET data_inclusao = ? WHERE codigo_pedido_site = ?`;
    await conn2.query(sql, [dataInclusao, codigoSite]);
  }

  static async insertPedidoMercos(params: { codigoPedidoSite: number | string, codigoPedidoBd: number, dataInclusao: string, situacao: number }) {
    const { codigoPedidoSite, codigoPedidoBd, dataInclusao, situacao } = params;
    const sql = `INSERT INTO ${db_vendas}.pedido_mercos (codigo_pedido_site, codigo_pedido_bd, data_inclusao, situacao)
                 VALUES (?, ?, ?, ?)`;
    await conn2.query(sql, [codigoPedidoSite, codigoPedidoBd, dataInclusao, situacao]);
  }

}
