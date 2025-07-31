const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const estado = process.argv[2];
const ano = process.argv[3];
const mes = process.argv[4];
const nomeArquivo = process.argv[5] || 'dados-fundeb-' + estado + '-' + ano + '-' + mes + '.csv';

console.log('🚀 Iniciando script...');
console.log('📌 Parâmetros recebidos:', { estado, ano, mes, nomeArquivo });

(async () => {
    const downloadPath = path.resolve('./downloads');
    console.log('📂 Verificando pasta de downloads:', downloadPath);
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
        console.log('🆕 Pasta criada.');
    }

    console.log('🧭 Lançando navegador...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--window-size=1920,1080']
    });

    const [page] = await browser.pages();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath,
    });

    console.log('🌐 Acessando página principal...');
    await page.goto('https://sisweb.tesouro.gov.br/apex/f?p=2600:1:12739723203079:MOSTRA:NO:RP::', {
        waitUntil: 'networkidle0'
    });

    console.log('✅ Selecionando opções no formulário...');
    await page.click('#P1_CX_TRANSFERENCIA_2');
    await page.click('#P1_CX_TRANSFERENCIA_13');
    await page.click('#P1_RD_FORMA_BUSCA_3');
    await page.select('#P1_ST_ESTADO_LEFT', estado);
    await page.click('#P1_ST_ESTADO_MOVE');
    await page.select('#P1_ST_ANO_LEFT', ano);
    await page.click('#P1_ST_ANO_MOVE');
    await page.select('#P1_ST_MES_LEFT', mes);
    await page.click('#P1_ST_MES_MOVE');

    console.log('🔎 Executando busca...');
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('#btn-buscar')
    ]);

    console.log('📥 Aguardando botão de exportação...');
    await page.waitForSelector('#B103195718772628025', { timeout: 10000 });

    console.log('⬇️ Clicando no botão de exportar...');
    await page.click('#B103195718772628025');

    const esperarDownload = async () => {
        console.log('⏳ Monitorando pasta de downloads...');
        const inicio = Date.now();
        while (Date.now() - inicio < 20000) {
            const arquivos = fs.readdirSync(downloadPath);
            const arquivo = arquivos.find(nome =>
                nome.endsWith('.csv') || nome.endsWith('.xls') || nome.endsWith('.xlsx')
            );
            if (arquivo) {
                const origem = path.join(downloadPath, arquivo);
                const destino = path.join(downloadPath, nomeArquivo);
                fs.renameSync(origem, destino);
                console.log('✅ Arquivo salvo como:', nomeArquivo);
                return;
            }
            await new Promise(r => setTimeout(r, 500));
        }
        throw new Error('⏱️ Tempo limite atingido. O arquivo não foi baixado.');
    };

    await esperarDownload();

    console.log('📦 Processo concluído com sucesso!');
    // await browser.close(); // Ative se quiser fechar o navegador
})();