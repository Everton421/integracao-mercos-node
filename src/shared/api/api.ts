import axios from "axios";
import { RetryExecution } from "../utils/retry-execution.ts";

const APPLICATION_TOKEN = process.env.APPLICATION_TOKEN
const COMPANY_TOKEN = process.env.COMPANY_TOKEN
const API_DOMAIN = process.env.API_DOMAIN

const MAX_RETRIES = 5;

const  headers=
{
    'ApplicationToken': APPLICATION_TOKEN,
    'CompanyToken': COMPANY_TOKEN,
     'Content-Type': 'Application/json'
  }
export const api = axios.create({
  baseURL: API_DOMAIN,
  headers  
})


                  

api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const { config, response } = error;

    if (response?.status === 429 && config) {
      const retryCount = config.retryCount ?? 0;

      if (retryCount >= MAX_RETRIES) {
        console.error(`[429] Limite de ${MAX_RETRIES} tentativas atingido no interceptor.`);
        return Promise.reject(error);
      }

      const retryConfig = { ...config, retryCount: retryCount + 1 };
      await RetryExecution.waitThrottle(RetryExecution.getTempoRestante(error));
      return api(retryConfig);
    }

    return Promise.reject(error);
  }
);


/***
 
    const result = await    await axios.post('https://sandbox.mercos.com/api/v1/produtos', input ,{ 
                    headers:{
                    'ApplicationToken': '900c2d9a-b26b-11ea-998c-fa9daa6bc61c',
                    'CompanyToken':'6048abb6-ec7c-11ee-8d47-3679598f8f34'
                    },
                  },
                  )

 */