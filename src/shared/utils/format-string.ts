    export class FormatString{

       formatCpf(cpf: string): string {
                cpf = cpf.replace(/\D/g, '');
                if (cpf.length === 11) {
                    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                } else if (cpf.length === 14) {
                    return cpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                } else {
                    throw new Error('CPF inválido');
                }
            }

        formatCep( cep:string): string{

                cep = cep.replace(/\D/g, '');

                if( cep.length === 8  ){
                    return cep.replace(/(\d{5})(\d{3})/,'$1-$2'); 
                }else{
                    throw new Error('cep invalido')
                }

        }

        formatCelular( celular:string ) :string{
            celular = celular.replace(/\D/g, '');

            if( celular.length === 11 ){
                return celular.replace(/(\d{2})(\d{5})(\d{4})/ , '($1) $2-$3');
            }else if( celular.length === 10 ){
                return celular.replace(/(\d{2})(\d{4})(\d{4})/ , '($1) $2-$3');
            }else{
                throw new Error('celular Invalido')
            }
            
        }

        formatTelefone( telefone:string ){
            telefone= telefone.replace(/\D/g, '');

            if( telefone.length === 10 ){
                return telefone.replace(/(\d{2})(\d{4})(\d{4})/ ,'($1) $2-$3');
            }
        }

   tiraAspas(descricao: string): string {
        return (descricao || '').replace(/['"]/g, '');
        }

   removeAccents(valor: string): string {
        return (valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
   }

   maskCpfCnpj(valor: string): string {
        valor = (valor || '').replace(/\D/g, '');
        if (valor.length === 11) {
            return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        if (valor.length === 14) {
            return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return valor;
   }

   maskCep(valor: string): string {
        valor = (valor || '').replace(/\D/g, '');
        if (valor.length === 8) {
            return valor.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
        return valor;
   }

   stateToUF(uf: string): string {
        if (!uf) return '';
        if (uf.length === 2) return uf.toUpperCase();

        switch (uf.toUpperCase()) {
            case "ACRE": return "AC";
            case "ALAGOAS": return "AL";
            case "AMAPÁ": return "AP";
            case "AMAPA": return "AP";
            case "AMAZONAS": return "AM";
            case "BAHIA": return "BA";
            case "CEARÁ": return "CE";
            case "CEARA": return "CE";
            case "DISTRITO FEDERAL": return "DF";
            case "ESPÍRITO SANTO": return "ES";
            case "ESPIRITO SANTO": return "ES";
            case "GOIÁS": return "GO";
            case "GOIAS": return "GO";
            case "MARANHÃO": return "MA";
            case "MARANHAO": return "MA";
            case "MATO GROSSO": return "MT";
            case "MATO GROSSO DO SUL": return "MS";
            case "MINAS GERAIS": return "MG";
            case "PARÁ": return "PA";
            case "PARA": return "PA";
            case "PARAÍBA": return "PB";
            case "PARAIBA": return "PB";
            case "PARANÁ": return "PR";
            case "PARANA": return "PR";
            case "PERNAMBUCO": return "PE";
            case "PIAUÍ": return "PI";
            case "PIAUI": return "PI";
            case "RIO DE JANEIRO": return "RJ";
            case "RIO GRANDE DO NORTE": return "RN";
            case "RIO GRANDE DO SUL": return "RS";
            case "RONDÔNIA": return "RO";
            case "RONDONIA": return "RO";
            case "RORAIMA": return "RR";
            case "SANTA CATARINA": return "SC";
            case "SÃO PAULO": return "SP";
            case "SAO PAULO": return "SP";
            case "SERGIPE": return "SE";
            case "TOCANTINS": return "TO";

            default: return '';
        }
   }


    }
