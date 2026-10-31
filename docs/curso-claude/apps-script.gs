/**
 * Recebe as inscrições da LP aue.productions/curso-claude e grava na planilha
 * PESSOAL_CursoClaude_Inscricoes_v01_20261031.
 *
 * Como publicar (uma vez só):
 * 1. Abra a planilha → Extensões → Apps Script.
 * 2. Apague o conteúdo e cole este arquivo inteiro. Salve.
 * 3. Implantar → Nova implantação → tipo "App da Web".
 *    Executar como: Eu. Quem pode acessar: Qualquer pessoa.
 * 4. Autorize, copie a URL que termina em /exec e cole em CFG.SHEET_ENDPOINT
 *    no arquivo public/curso-claude/index.html.
 */
var COLUNAS = ['data_hora', 'nome', 'email', 'whatsapp', 'perfil', 'cidade', 'consentimento',
  'origem_utm_source', 'origem_utm_medium', 'origem_utm_campaign', 'referrer', 'pagina'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    if (!d.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email))) {
      return ContentService.createTextOutput('invalid');
    }
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var linha = COLUNAS.map(function (c) {
      var v = String(d[c] == null ? '' : d[c]).slice(0, 500);
      return /^[=+\-@]/.test(v) ? "'" + v : v; // evita fórmula injetada na planilha
    });
    sh.appendRow(linha);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}
