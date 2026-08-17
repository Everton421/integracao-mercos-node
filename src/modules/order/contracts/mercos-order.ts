export type MercosDesconto = {
  desconto: number
}

export type MercosEnderecoEntrega = {
  id: number | null
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
}

export type MercosPedidoItem = {
  id: number
  produto_id: number
  tabela_preco_id: number
  quantidade: number
  quantidade_grades: any[]
  preco_tabela: number
  preco_liquido: number
  ipi: number
  tipo_ipi: string
  st: number
  subtotal: number
  cotacao_moeda: number
  excluido: boolean
  descontos_do_vendedor: number[]
  descontos_de_promocoes: MercosDesconto[]
  descontos_de_politicas: MercosDesconto[]
  observacoes: string
  produto_codigo: string
  produto_nome: string
  grupo_grades: any
  produto_agregador_id: number | null
  desconto_de_cupom: number | null
}

export type MercosPedido = {
  id: number
  pedido_origem_id: number | null
  cliente_id: number
  transportadora_id: number
  transportadora_nome: string
  tipo_pedido_id: number | null
  criador_id: number
  nome_contato: string
  status: string
  numero: number
  rastreamento: string
  valor_frete: number | null
  total: number
  condicao_pagamento: string
  condicao_pagamento_id: number
  forma_pagamento_id: number
  data_emissao: string
  observacoes: string
  itens: MercosPedidoItem[]
  extras: any[]
  ultima_alteracao: string
  cliente_razao_social: string
  cliente_nome_fantasia: string
  cliente_cnpj: string
  cliente_inscricao_estadual: string
  cliente_rua: string
  cliente_numero: string
  cliente_complemento: string
  cliente_cep: string
  cliente_bairro: string
  cliente_cidade: string
  cliente_estado: string
  cliente_suframa: string
  contato_nome: string
  representada_id: number
  representada_nome_fantasia: string
  representada_razao_social: string
  status_faturamento: string
  status_custom_id: number | null
  status_b2b: number | null
  endereco_entrega: MercosEnderecoEntrega
  data_criacao: string
  cliente_telefone: string[]
  cliente_email: string[]
  cupom_de_desconto: number | null
  percentual_total_comissao_pedido: number
  comissoes_vendedores: any[]
}
