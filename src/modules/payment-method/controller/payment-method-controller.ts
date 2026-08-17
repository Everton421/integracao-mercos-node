import type { Response, Request } from "express"
import { ErpPaymentMethodRepository } from "../repository/erp-payment-method-repository.ts"
import { SendPaymentMethodService, type PaymentMethodResultItem } from "../service/send-payment-method-service.ts";

export class PaymentMethodController {

    async getAllPaymentConditions(req: Request, res: Response) {
        const resultConditions = await ErpPaymentMethodRepository.findAllPaymentConditions();
        res.render('condicoes-pagamento', {
            condicoes: resultConditions
        })
    }

    async postPaymentConditions(req: Request, res: Response) {
        const conditionsId = req.body.condicoes as string[];
        const sendPaymentMethodService = new SendPaymentMethodService();
        const allSuccess: PaymentMethodResultItem[] = [];
        const allErrors: PaymentMethodResultItem[] = [];

        for (const id of conditionsId) {
            const resultPostCondition = await sendPaymentMethodService.sendPaymentMethod(Number(id));
            if (resultPostCondition.data) {
                allSuccess.push(...resultPostCondition.data.sucesso);
                allErrors.push(...resultPostCondition.data.erros);
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
            conditions: [...allSuccess, ...allErrors]
        });
    }

    async deletePaymentCondition(req: Request, res: Response) {
        const id = Number(req.params.id);
        const sendPaymentMethodService = new SendPaymentMethodService();
        const result = await sendPaymentMethodService.deletePaymentMethod(id);

        const httpStatus = result.status === 'excluido' ? 200 : 500;

        return res.status(httpStatus).json({
            success: result.status === 'excluido',
            message: result.erro || `Condição de pagamento ${result.status === 'excluido' ? 'excluída' : 'não foi excluída'}.`,
            condition: result
        });
    }
}
