const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve o index.html

app.post('/executar', (req, res) => {
  const { estado, ano, mes } = req.body;
  const nomeArquivo = `dados-fundeb-${estado}-${ano}-${mes}.csv`;

  const processo = spawn('node', [
    'consulta.js',
    estado,
    ano,
    mes,
    nomeArquivo
  ]);

  processo.stdout.on('data', data => console.log(`stdout: ${data}`));
  processo.stderr.on('data', data => console.error(`stderr: ${data}`));
  processo.on('close', code => {
    console.log(`Processo finalizado com código ${code}`);
    res.send(`✅ Arquivo gerado: ${nomeArquivo}`);
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));