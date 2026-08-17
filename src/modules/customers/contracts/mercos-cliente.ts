export type MercosClienteEmail = {
  tipo: string
  email: string
  id: number
}

export type MercosClienteTelefone = {
  tipo: string
  numero: string
  id: number
}

export type MercosClienteContato = {
  id: number
  nome: string
  cargo: string
  excluido: boolean
  telefones: MercosClienteTelefone[]
  emails: MercosClienteEmail[]
}

export type MercosCliente = {
  id: number
  criador_id: number
  tipo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  inscricao_estadual: string
  suframa: string
  rua: string
  numero: string
  complemento: string | null
  cep: string
  bairro: string
  cidade: string
  estado: string
  observacao: string
  ultima_alteracao: string
  excluido: boolean
  bloqueado_b2b: boolean
  bloqueado: boolean
  emails: MercosClienteEmail[]
  telefones: MercosClienteTelefone[]
  nome_excecao_fiscal: string
  contatos: MercosClienteContato[]
  enderecos_adicionais: any[]
  tags: any[]
  extras: any[]
  representadas_ids: any[]
  limite_credito: any[]
}
