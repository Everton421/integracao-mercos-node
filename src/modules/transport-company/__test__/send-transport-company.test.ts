import test from 'node:test';
import {   SendTransportCompanyService } from '../service/send-transport-company-service.ts';

test("TESTE ENVIO TRANSPORTADORAS", async (t) => {
  
  await t.test("ENVIO DE TRANSPORTADORA", async () => {

      const sendTransportCompanyService = new SendTransportCompanyService();
    
      try {
        await sendTransportCompanyService.sendTransportCompany(345)

    } catch (e) {
      console.log(e)
    }
  })
})
