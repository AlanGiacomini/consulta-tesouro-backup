<?php
$estado = $_POST['estado'] ?? '';
$ano    = $_POST['ano'] ?? '';
$mes    = $_POST['mes'] ?? '';

// ⚠️ Validação simples dos valores
$ufs = [
    "1"  => "AC",
    "2"  => "AL",
    "3"  => "AM",
    "4"  => "AP",
    "5"  => "BA",
    "6"  => "CE",
    "7"  => "DF",
    "8"  => "ES",
    "9"  => "GO",
    "10" => "MA",
    "11" => "MG",
    "12" => "MS",
    "13" => "MT",
    "14" => "PA",
    "15" => "PB",
    "16" => "PE",
    "17" => "PI",
    "18" => "PR",
    "19" => "RJ",
    "20" => "RN",
    "21" => "RO",
    "22" => "RR",
    "23" => "RS",
    "24" => "SC",
    "25" => "SE",
    "26" => "SP",
    "27" => "TO"
];

if (!isset($ufs[$estado]) || !is_numeric($ano) || !is_numeric($mes)) {
    echo "Valores inválidos.";
    exit;
}

$uf = $ufs[$estado];
$nomeArquivo = "dados-fundeb-{$uf}-{$ano}-{$mes}.csv";

// Remove arquivo anterior, se existir
$caminho = "downloads/{$nomeArquivo}";
if (file_exists($caminho)) {
    unlink($caminho);
}

// 🟢 Executa o script Node.js passando os argumentos
$cmd = escapeshellcmd("node consulta.js $estado $ano $mes $nomeArquivo");
exec($cmd, $output, $retorno);
file_put_contents("log-node.txt", implode("\n", $output) . "\nRetorno: $retorno", FILE_APPEND);

// Aguarda o arquivo aparecer (até 10 segundos)
$tempo = 0;
while (!file_exists($caminho) && $tempo < 10) {
    sleep(1);
    $tempo++;
}

if (file_exists($caminho)) {
    header('Content-Type: application/octet-stream');
    header("Content-Disposition: attachment; filename=\"$nomeArquivo\"");
    readfile($caminho);
    //Redireciona para a página inicial após o download
    header("Location: index.html");
    exit;
} else {
    echo "Erro: Arquivo não foi gerado.";
}
