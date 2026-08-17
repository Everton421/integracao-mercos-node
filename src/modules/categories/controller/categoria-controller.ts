import type { Response, Request  } from "express"
import { ErpCategoryRepository } from "../repository/erp-category-repository.ts"
import { SendCategoryService, type CategoryResultItem } from "../service/send-category-service.ts";

export class CategoriaController{

        async getAllCategories( req: Request, res: Response ) {
              const resultErpCategories = await ErpCategoryRepository.findAllCategories();
                res.render('categorias',{
                    categorias: resultErpCategories
                })
    }


    async postCategory( req: Request, res: Response ) {
        const categoriesId = req.body.categorias as string[];    
        const sendCategoryService = new SendCategoryService();
        const allSuccess: CategoryResultItem[] = [];
        const allErrors: CategoryResultItem[] = [];

        for( const id of categoriesId){
            const resultPostCategory = await sendCategoryService.sendCategory(Number(id));
            if(resultPostCategory.data) {
                allSuccess.push(...resultPostCategory.data.sucesso);
                allErrors.push(...resultPostCategory.data.erros);
            }
        }

        const total = allSuccess.length + allErrors.length;
        const hasMixed = allSuccess.length > 0 && allErrors.length > 0;
        const httpStatus = allErrors.length === 0 ? 200 : (hasMixed ? 207 : 500);

        return res.status(httpStatus).json({
            success: allErrors.length === 0,
            summary: {
                total,
                sucesso: allSuccess.length,
                erros: allErrors.length
            },
            categories: [...allSuccess, ...allErrors]
        });
    }
}