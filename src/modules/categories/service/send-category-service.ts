import { ErpCategoryRepository } from '../repository/erp-category-repository.ts';
import { SendCategoryRequest } from '../request/send-category-request.ts';

export type CategoryResultItem = {
  codigo: number
  nome: string
  status: 'enviado' | 'atualizado' | 'ja_sincronizado' | 'erro'
  erro?: string
}

export type ResultCategory = {
  success: boolean
  message: string
  data: { sucesso: CategoryResultItem[]; erros: CategoryResultItem[] } | null
}

export class SendCategoryService {

  async sendCategory(codcategoria?: number): Promise<ResultCategory> {

    const sucessos: CategoryResultItem[] = [];
    const erros: CategoryResultItem[] = [];

    try {

      const categorias = await ErpCategoryRepository.findCategoriesForSend(codcategoria);

      if (categorias.length === 0) {
        return { success: false, message: 'Nenhuma categoria encontrada para envio.', data: null };
      }

      for (const categoria of categorias) {

        try {

          const codigoPgru = categoria.CODIGO;
          const nome = categoria.NOME || '';
          const dataRecadBd = categoria.DATA_RECAD ? new Date(categoria.DATA_RECAD).toISOString().replace('T', ' ').slice(0, 19) : '';

          const categoriaMercos = await ErpCategoryRepository.findCategoryMercos(codigoPgru);

          if (categoriaMercos.length > 0) {

            const codigoCategoriaSite = categoriaMercos[0].codigo_site;
            const dataRecadMercos = categoriaMercos[0].data_recad;

            const precisaAtualizar = !dataRecadMercos
              || new Date(dataRecadBd) > new Date(dataRecadMercos);

            if (!precisaAtualizar) {
              console.log(`[ ] Categoria ${codigoPgru} - ${nome} já está atualizada.`);
              sucessos.push({ codigo: codigoPgru, nome, status: 'ja_sincronizado' });
              continue;
            }

            console.log(`[V] Atualizando categoria ${codigoPgru} - ${nome} no Mercos...`);

            const statusRequest = await SendCategoryRequest.putCategory(codigoCategoriaSite, { nome });

            if (statusRequest === 200 || statusRequest === 201) {
              await ErpCategoryRepository.updateCategorySyncDate(codigoCategoriaSite, codigoPgru, dataRecadBd);
              console.log(`[V] Categoria ${codigoPgru} atualizada no Mercos e DATA_RECAD sincronizado no banco.`);
              sucessos.push({ codigo: codigoPgru, nome, status: 'atualizado' });
            } else {
              console.error(`[X] Falha ao atualizar categoria ${codigoPgru} no Mercos. Status: ${statusRequest}`);
              erros.push({ codigo: codigoPgru, nome, status: 'erro', erro: `Falha ao atualizar categoria no Mercos. Status: ${statusRequest}` });
            }

          } else {

            console.log(`[V] Inserindo categoria ${codigoPgru} - ${nome} no Mercos...`);

            const result = await SendCategoryRequest.postCategory({ nome, excluido: false });

            if (result.success) {
              const novoIdSite = result.data;

              if (novoIdSite) {
                const categoriaPosInsercao = await ErpCategoryRepository.findCategoryAfterInsert(codigoPgru);

                if (categoriaPosInsercao.length > 0 && !categoriaPosInsercao[0].codigo_site) {
                  await ErpCategoryRepository.insertCategoryMercos({
                    codigoBd: codigoPgru,
                    codigoSite: novoIdSite,
                    dataRecad: dataRecadBd,
                  });
                  console.log(`[V] Categoria ${codigoPgru} inserida no Mercos (ID ${novoIdSite}) e registrada no banco.`);
                  sucessos.push({ codigo: codigoPgru, nome, status: 'enviado' });
                } else {
                  console.log(`[V] Categoria ${codigoPgru} inserida no Mercos (ID ${novoIdSite}), porém já mapeada no banco.`);
                  sucessos.push({ codigo: codigoPgru, nome, status: 'enviado' });
                }
              } else {
                console.error(`[X] Categoria ${codigoPgru} inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.`);
                erros.push({ codigo: codigoPgru, nome, status: 'erro', erro: 'Categoria inserida no Mercos, porém o ID não foi retornado no header meuspedidosid.' });
              }
            } else {
                const resutlMessageequest =  result.data ; 
              console.error(`[X] Falha ao inserir categoria ${codigoPgru} no Mercos.   ${JSON.stringify(resutlMessageequest?.erros)}`);
              erros.push({ codigo: codigoPgru, nome, status: 'erro', erro: `Falha ao inserir categoria no Mercos.   ${JSON.stringify(resutlMessageequest?.erros)}` });
            }
          }

        } catch (e: any) {
          console.error(`[X] Erro ao processar categoria ${categoria.CODIGO}:`, e);
          erros.push({ codigo: categoria.CODIGO, nome: categoria.NOME, status: 'erro', erro: e?.message || 'Erro ao processar categoria.' });
        }
      }

      return {
        success: erros.length === 0,
        message: `Processamento finalizado. Sucessos: ${sucessos.length}, Falhas: ${erros.length}.`,
        data: { sucesso: sucessos, erros },
      };

    } catch (e: any) {
      console.error('[X] Erro ao enviar categorias:', e);
      return { success: false, message: e?.message || 'Erro inesperado ao enviar categorias.', data: null };
    }
  }
}
