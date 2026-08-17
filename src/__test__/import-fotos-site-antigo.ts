import { createReadStream } from 'node:fs';
import csv from 'csv-parser';
import { conn2, database_api } from '../database/database-connection.ts';

const DOMINIO_BASE = 'https://www.syma.com.br/media/catalog/product';
const CSV_FILE = 'src/excel/fotos.csv';

async function importFotos() {
    console.log('[*] Iniciando importação de fotos...');

    let inseridos = 0;
    let erros = 0;

    const database = `\`${database_api}\``
    const stream = createReadStream(CSV_FILE)
        .pipe(csv({ separator: ';' }));

    for await (const row of stream) {
        const rowTyped = row as { sku: string; gallery: string };
        const fotos = rowTyped.gallery.split(';').filter(f => f.trim());

        for (const foto of fotos) {
            const urlCompleta = DOMINIO_BASE + foto.trim();

            const sql = `
                INSERT INTO ${database}.fotos_site_antigo (sku, gallery)
                VALUES (?, ?)
            `;

            try {
                await conn2.query(sql, [rowTyped.sku, urlCompleta]);
                inseridos++;
            } catch (err) {
                console.log(err)
                erros++;
                console.log(`[X] Erro ao inserir SKU ${rowTyped.sku}: ${foto}`);
            }
        }

        if (inseridos > 0 && inseridos % 500 === 0) {
            console.log(`[*] Progresso: ${inseridos} inseridos, ${erros} erros...`);
        }
    }

    console.log(`[OK] Importação concluída! Total inserido: ${inseridos}, Erros: ${erros}`);
}

await importFotos();
