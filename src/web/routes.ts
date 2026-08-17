import { Router } from "express";

import 'dotenv/config';
import { ProductController } from "../modules/products/controller/product-controller.ts";
import { CategoriaController } from "../modules/categories/controller/categoria-controller.ts";
import { PaymentMethodController } from "../modules/payment-method/controller/payment-method-controller.ts";
import { OrdersController } from "../modules/order/controller/orders-controller.ts";
import { PricesTableController } from "../modules/prices-tables/controller/prices-table-controller.ts";

const router = Router();


 
router.post('/produtos', new ProductController().syncProduct)

 router.get('/produtos', new ProductController().getAllProduct);


 router.get('/categorias', new CategoriaController().getAllCategories)
 router.post('/categorias', new CategoriaController().postCategory)

 router.get('/condicoes-pagamento', new PaymentMethodController().getAllPaymentConditions)
 router.post('/condicoes-pagamento', new PaymentMethodController().postPaymentConditions)
 router.delete('/condicoes-pagamento/:id', new PaymentMethodController().deletePaymentCondition)

router.get('/pedidos', new OrdersController().getAllOrders)
router.post('/pedidos', new OrdersController().receivOrders)

router.get('/tabelas-precos', new PricesTableController().getAllPricesTables)
router.post('/tabelas-precos', new PricesTableController().postPriceTables)

/** 

router.get('/produto/:codigo', async (req, res) => {
    try {
        const codigo = req.params.codigo;
        const produtoRepository = new ProductErpRepository();
        const fotosProdutosIntegration = new FotosProdutoIntegration(); // MySQL
        const pgImagensProdutos = new PgImagensProdutos(); // Postgres
        const configuracoesIntegration = new ConfiguracoesIntegration();

        const configIntegration = await configuracoesIntegration.select();

        const {  tabela_preco } =configIntegration[0];
        // 1. Busca os detalhes do produto no ERP
        const produtos = await produtoRepository.findSingleCompleteErpProduct(Number(codigo), tabela_preco);
        if (!produtos || produtos.length === 0) return res.status(404).send("Produto não encontrado.");

        const produto = produtos[0] as any;

        // 2. Busca fotos que já foram processadas (estão no MySQL)
        const fotosNoMysql = await fotosProdutosIntegration.selectByParam({ erp_sku: codigo });

        // 3. Busca fotos que estão no Postgres (Imagens originais)
        const fotosNoPostgres = await pgImagensProdutos.find(codigo.toString());

        // 4. Criamos uma lista unificada para a tela
        // Vamos marcar o que vem do Postgres para o JS saber tratar
        const imagensUnificadas: any[] = [];

        // Adiciona as do MySQL primeiro (que já tem link externo)
        fotosNoMysql.forEach(img => {
            imagensUnificadas.push({
                link: img.link,
                id_postgres: img.id_postgres, // importante ter essa coluna no seu MySQL
                ativo: 'S',
                origem: 'mysql'
            });
        });

        // Adiciona as do Postgres que AINDA NÃO estão no MySQL
        if (fotosNoPostgres) {
            fotosNoPostgres.forEach(pgImg => {
                const jaExiste = fotosNoMysql.some(m => m.id_postgres == pgImg.id);
                if (!jaExiste) {
                    imagensUnificadas.push({
                        link: `data:image/jpeg;base64,${pgImg.imagem}`, // Base64 para exibir o preview
                        id_postgres: pgImg.id,
                        ativo: 'S',
                        origem: 'postgres'
                    });
                }
            });
        }


        produto.IMAGENS = imagensUnificadas;

        res.render('produto-editar', {
            produto: produto,
            pageTitle: `Editar Produto ${codigo}`,
        });

    } catch (error) {
        console.error("Erro ao carregar produto:", error);
        res.status(500).send("Erro interno.");
    }
})

router.post('/post-products', new ProdutoController().syncProduct)

//router.post('/produtos/acao-global', new ProdutoController().bulkGlobalAction);


router.post('/post-preco', new PrecoController().post)

router.post('/post-estoque', new EstoqueController().postSaldo)



router.get('/setores', async (req, res) => {
    const locaisIntegration = new LocaisIntegration();
    const arrLocais = await locaisIntegration.selectAll();
    res.render('setores', {
        locais: arrLocais
    });
});


router.get('/canais-venda', async (req, res) => {
    const canaisVendaIntegration = new CanaisVendaIntegration();
    const arrCanais = await canaisVendaIntegration.findAll();
    res.render('canais-venda', {
        canais: arrCanais
    });
});
router.post('/canais/sync', async (req, res) => {
    const service = new GetPublications();
    const result = await service.get();
    res.json(result);
});


router.post('/locais/sync', async (req, res) => {
    const service = new GetLocation();
    const result = await service.getAllLocation();
    res.json(result);
});


router.get('/pedidos', async (req, res) => {
    try {
        const pedidoIntegration = new PedidoIntegration();

        // Paginação e Filtros via Query Params
        const numberPage = Number(req.query.page)
        const page = numberPage || 1;
        const limit = 20;
        const search = req.query.search || '' as any;
        const sync_status = String(req.query.sync_status) || '';

        // Busca dados
        const { data, total } = await pedidoIntegration.findAll({ search, sync_status }, page, limit);

        const totalPages = Math.ceil(total / limit);

        res.render('pedidos', {
            pedidos: data,
            filters: { search, sync_status },
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total
            }
        });

    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        res.render('pedidos', {
            pedidos: [],
            filters: {},
            pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
            error: "Erro ao carregar dados."
        });
    }
});

router.post('/api/pedidos/sync-manual', async (req, res) => {
    const obj = new PedidoController()
    await obj.getpedidos(req, res)
})

router.get('/configuracoes', async (req, res) => {
    try {
        const objeConfigurcoes = new ConfiguracoesIntegration();
        const fpgtRepositoty = new FpgtRepositoty();
        const erpPriceRepository = new ErpPriceRepository();
        const erpInventoryRepository = new ErpInventoryRepository();

        const data = await objeConfigurcoes.select();
        const setores = await erpInventoryRepository.findSectorErp();
        const tabelas = await erpPriceRepository.findPriceTables();


        const formas_pagamento = await fpgtRepositoty.findAll();

        // Verifica se existe o parametro ?sucesso=true na URL
        const showSuccessMessage = req.query.sucesso === 'true';
        const showErrorMessage = req.query.erro === 'true';

        res.render('configuracoes', {
            // Passamos as flags para o EJS
            msgSucesso: showSuccessMessage,
            msgErro: showErrorMessage,

            dados: {
                vendedor: data[0]?.vendedor_pedido || '',
                enviar_estoque: data[0]?.enviar_estoque,
                enviar_preco: data[0]?.enviar_preco,
                enviar_produtos: data[0]?.enviar_produtos,
                importar_pedidos: data[0]?.importar_pedidos,
                forma_pagamento: data[0]?.forma_pagamento
            },
            formas_pagamento: formas_pagamento || [],
            setores: setores,
            tabelas: tabelas,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao carregar configurações");
    }
});

router.post('/ajusteConfig', async (req, res) => {
    try {
        const configuracoesIntegration = new ConfiguracoesIntegration();

        if (req.body) {
            await configuracoesIntegration.update({
                enviar_estoque: req.body.enviar_estoque,
                enviar_preco: req.body.enviar_preco,
                enviar_produtos: req.body.enviar_produtos,
                tabela_preco: req.body.tabela_preco,
                importar_pedidos: req.body.importar_pedidos,
                vendedor_pedido: req.body.codigo_vendedor,
                forma_pagamento: req.body.forma_pagamento
            });

            // SUCESSO: Redireciona para a mesma página com a flag de sucesso
            // Isso força o navegador a recarregar a página com os dados novos
            return res.redirect('/configuracoes?sucesso=true');
        } else {
            return res.redirect('/configuracoes?erro=true');
        }

    } catch (error) {
        console.error("Erro ao salvar config:", error);
        // ERRO: Redireciona com flag de erro
        return res.redirect('/configuracoes?erro=true');
    }
});

router.get('/logs', async (req, res) => {
    try {
        const logIntegration = new LogsIntegration();

        // Pega parâmetros da URL (ex: /logs?page=2&status=error)
        const numberPage = Number(req.query.page);
        const page = numberPage || 1;
        const status = String(req.query.status) || 'sucess';
        const search = req.query.search || '' as any;
        const limit = 20;

        // Busca no banco
        const { data, total } = await logIntegration.findAll({ status, search }, page, limit);

        // Calcula total de páginas
        const totalPages = Math.ceil(total / limit);

        res.render('logs', {
            logs: data,
            filters: { page, status, search },
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total
            }
        });

    } catch (error) {
        console.error("Erro ao carregar logs:", error);
        res.status(500).send("Erro interno ao carregar logs.");
    }
});


router.get('/fotos', async (req, res) => {
    const sku = req.query.sku as string;

    const fotosPostgres: { base64: string; id: string }[] = [];
    const fotosOldSite: { url: string; id: number }[] = [];

    if (sku) {
        const pgRepo = new PgImagensProdutos();
        const pgResult = await pgRepo.find(sku);
        if (pgResult) {
            for (const img of pgResult) {
                fotosPostgres.push({ base64: img.imagem, id: img.id });
            }
        }

       
    }

    res.render('fotos/index', {
        sku: sku || '',
        fotosPostgres,
    });
});

router.get('/auth', new AuthController().auth);

router.get('/auth/callback', new AuthController().callback);

const intelipostController = new IntelipostListController();
router.get('/intelipost/envios', (req, res) => intelipostController.listarPedidos(req, res));
router.post('/api/intelipost/enviar-lote', (req, res) => intelipostController.enviarLote(req, res));

*/
 
export { router };


