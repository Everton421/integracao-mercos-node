import type { Request, Response } from 'express'
import { ErpTransportCompanyRepository } from '../repository/erp-transport-company-repository.ts'
import { SendTransportCompanyService, type TransportCompanyResultItem } from '../service/send-transport-company-service.ts';

export class TransportCompanyController {

    async getAllTransportCompanies(req: Request, res: Response) {
        const resultErpTransportCompanies = await ErpTransportCompanyRepository.findAllTransportCompanies();
        res.render('transportadoras', {
            transportadoras: resultErpTransportCompanies
        })
    }

    async postTransportCompany(req: Request, res: Response) {
        const transportCompanyId = req.body.transportadoras as string[];
        const sendTransportCompanyService = new SendTransportCompanyService();
        const allSuccess: TransportCompanyResultItem[] = [];
        const allErrors: TransportCompanyResultItem[] = [];

        for (const id of transportCompanyId) {
            const resultPostTransportCompany = await sendTransportCompanyService.sendTransportCompany(Number(id));
            if (resultPostTransportCompany.data) {
                allSuccess.push(...resultPostTransportCompany.data.sucesso);
                allErrors.push(...resultPostTransportCompany.data.erros);
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
            transportadoras: [...allSuccess, ...allErrors]
        });
    }

}
