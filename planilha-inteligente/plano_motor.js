/* =====================================================================
   MOTOR DE PLANO E ORÇAMENTO (window.PL) · funções puras, sem DOM
   Igual para todos os pacotes (ESPECIALIDADES_SPEC.md §3.1):
     valor  = precoBase × qtd × fatorLado + Σ componentes − ajusteCombo
     fatorLado = 2 se lado = "bi" e o procedimento tem porLado: true; senão 1
     total  = Σ linhas não recusadas da variante ativa − desconto
     parcela = total ÷ n (sem juros); "à vista" aplica pixDesc %
   Regras por unidade:
     U        toxina: passo 2, preço por unidade
     seringa / frasco / sessao / area / mes: preço × quantidade
     lesao    1ª unidade cheia + (qtd − 1) × precoAdicional
     dente    uma linha por dente (qtd 1)
     face     porFace: preço pela contagem de faces (1, 2, 3 ou mais) → precoFaces
     arcada   1 ou 2 arcadas
   Preço travado: linha com `valorFechado` (plano fechado antes) usa esse valor,
   e não muda quando a tabela da clínica muda.
   `recorrenteMensal` é informativo: aparece em "Recorrente previsto" e soma no
   total do plano, mas nunca na meta do Painel (que é faturamento realizado).
   Depende de window.PAC (pacotes.js). Datas no formato dd/mm/aaaa.
   ===================================================================== */
(function () {
  const W = typeof window !== "undefined" ? window : globalThis;
  const PAC = () => W.PAC;
  const HOJE = "13/11/2026";
  const STATUS = ["proposto", "aceito", "realizado", "em_aberto", "recusado"];
  const MOTIVOS = ["Preço", "Vai pensar", "Vai comparar", "Decide com outra pessoa"];

  /* ---------- Datas ---------- */
  const parse = s => { const [d, m, a] = String(s).split("/").map(Number); return Date.UTC(a, m - 1, d); };
  const fmt = t => { const x = new Date(t); return [x.getUTCDate(), x.getUTCMonth() + 1].map(n => String(n).padStart(2, "0")).join("/") + "/" + x.getUTCFullYear(); };
  const somaDias = (s, d) => fmt(parse(s) + d * 864e5);
  const diasEntre = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mesAno = s => { const x = new Date(parse(s)); return MESES[x.getUTCMonth()] + "/" + String(x.getUTCFullYear()).slice(2); };

  /* ---------- Pacote e procedimento efetivo (tabela da clínica ou PAC) ---------- */
  const pacDe = p => typeof p === "string" ? PAC().get(p) : p;
  const procDe = (pac, id, tab) => PAC().proc(pacDe(pac), id, tab);

  /* ---------- Regras de unidade ---------- */
  function normalizaQtd(proc, qtd, item) {
    const u = PAC().UNIDADES[proc.unidade] || { passo: 1, min: 1, max: 99 };
    if (proc.porFace) { const n = item && Array.isArray(item.faces) ? new Set(item.faces).size : qtd; return Math.max(1, Math.min(5, n || 1)); }
    if (proc.unidade === "dente" || proc.unidade === "pacote") return 1;
    let q = Number(qtd); if (!isFinite(q) || q <= 0) q = u.min;
    q = Math.round(q / u.passo) * u.passo;
    return Math.max(u.min, Math.min(u.max, q));
  }
  // preço unitário × qtd, antes de lado, componentes e combo
  function base(proc, qtd, item) {
    if (proc.aDefinir || proc.parceiro || proc.precoBase == null) return 0;
    const q = normalizaQtd(proc, qtd, item);
    if (proc.porFace) { const f = proc.precoFaces || [proc.precoBase, proc.precoBase, proc.precoBase]; return f[Math.min(q, 3) - 1]; }
    if (proc.unidade === "lesao") return proc.precoBase + (q - 1) * (proc.precoAdicional != null ? proc.precoAdicional : proc.precoBase);
    return proc.precoBase * q;
  }
  const fatorLado = (proc, item) => item.lado === "bi" && proc.porLado ? 2 : 1;
  const somaComp = proc => (proc.componentes || []).reduce((s, c) => s + (c.v || 0), 0);
  const brutoLinha = (item, pac, tab) => {
    const proc = procDe(pac, item.proc, tab); if (!proc) return 0;
    if (typeof item.valorFechado === "number") return item.valorFechado;
    if (proc.aDefinir || proc.parceiro) return 0;
    return base(proc, item.qtd, item) * fatorLado(proc, item) + somaComp(proc);
  };
  // sugestão do profissional ainda não aceita pela closer fica fora do total (e do resumo da paciente)
  const conta = (it, plano) => it.status !== "recusado" && !it.sugerido && (!it.variante || !plano || it.variante === plano.variante);

  // ajuste de combo: o preço do combo é distribuído em proporção pelas linhas
  // com o mesmo `combo` (instância), com resto pelo maior resíduo (soma exata).
  function ajustesCombo(plano, pac, tab) {
    const out = {}, grupos = {};
    plano.itens.forEach(it => { if (it.combo && conta(it, plano) && typeof it.valorFechado !== "number") (grupos[it.combo] = grupos[it.combo] || []).push(it); });
    Object.entries(grupos).forEach(([inst, its]) => {
      const c = PAC().combo(pacDe(pac), inst.split("#")[0], tab); if (!c || typeof c.preco !== "number") return;
      const brutos = its.map(it => brutoLinha(it, pac, tab)), soma = brutos.reduce((a, b) => a + b, 0);
      if (!soma || c.preco >= soma) return;
      const alvo = soma - c.preco;
      const parts = brutos.map(b => alvo * b / soma), chao = parts.map(Math.floor);
      let resto = alvo - chao.reduce((a, b) => a + b, 0);
      parts.map((p, i) => [p - chao[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (resto > 0) { chao[i]++; resto--; } });
      its.forEach((it, i) => (out[it.uid] = chao[i]));
    });
    return out;
  }

  /* valorLinha(item, pac, plano?, tab?) → R$ da linha (com combo se o plano vier junto) */
  function valorLinha(item, pac, plano, tab) {
    pac = pacDe(pac || (plano && plano.pacote));
    const bruto = brutoLinha(item, pac, tab);
    const aj = plano ? (ajustesCombo(plano, pac, tab)[item.uid] || 0) : (item.ajusteCombo || 0);
    return Math.max(0, bruto - aj);
  }

  /* totalPlano(plano, tab?) → { subtotal, desconto, total, aVista, parcelas, parcela, porStatus, emAberto, aceito, realizado, recorrenteMensal, itens } */
  function totalPlano(plano, tab) {
    const pac = pacDe(plano.pacote), aj = ajustesCombo(plano, pac, tab);
    const porStatus = { proposto: 0, aceito: 0, realizado: 0, em_aberto: 0, recusado: 0 };
    let subtotal = 0, recorrente = 0;
    const linhas = plano.itens.map(it => {
      const v = Math.max(0, brutoLinha(it, pac, tab) - (aj[it.uid] || 0));
      const proc = procDe(pac, it.proc, tab);
      if (it.status in porStatus) porStatus[it.status] += v;
      if (conta(it, plano)) { subtotal += v; if (proc && proc.recorrenteMensal) recorrente += proc.precoBase || 0; }
      return { uid: it.uid, valor: v, aDefinir: !!(proc && proc.aDefinir) };
    });
    const d = plano.desconto || {};
    const desconto = typeof d.valor === "number" ? Math.min(d.valor, subtotal) : Math.round(subtotal * (d.pct || 0) / 100);
    const total = subtotal - desconto;
    const pg = PAC().pagamento(pac, tab).pagamento;
    const n = Math.max(1, Math.min(pg.maxParcelas || 1, (plano.pagamento && plano.pagamento.parcelas) || 1));
    return {
      subtotal, desconto, total, aVista: total - Math.round(total * (pg.pixDesc || 0) / 100),
      parcelas: n, parcela: parcela(total, n), porStatus,
      emAberto: porStatus.em_aberto, aceito: porStatus.aceito, realizado: porStatus.realizado,
      recorrenteMensal: recorrente, itens: linhas,
    };
  }
  const total = (plano, tab) => totalPlano(plano, tab).total;
  // parcela(total, n) → valor de cada parcela, sem juros, em centavos arredondados
  function parcela(total, n) { n = Math.max(1, Math.floor(n || 1)); return Math.round(total / n * 100) / 100; }

  /* seriesDe(serie | item, inicio, pac?) → datas sugeridas de cada sessão da série
     - seriesDe({ n: 3, intervalo: 45 }, "13/11/2026") → ["13/11/2026", "28/12/2026", "11/02/2027"]
     - seriesDe(item, null, pac) usa a `serie` do procedimento e a data do item */
  function seriesDe(s, inicio, pac) {
    let serie = s;
    if (s && s.proc) { const proc = procDe(pac, s.proc); serie = s.serie && s.serie.n ? s.serie : proc && proc.serie; inicio = inicio || s.data || HOJE; }
    if (!serie || !serie.n) return [];
    inicio = inicio || HOJE;
    return Array.from({ length: serie.n }, (_, i) => somaDias(inicio, i * (serie.intervalo || 0)));
  }

  /* recallsDe(plano, opts?) → recalls de venda que o plano cria
     Itens aceitos e realizados (opts.incluirPropostos também conta propostos e em aberto).
     Data = data do item (realização ou prevista; série → última sessão) + cada offset de `recall`.
     Retorno pós-procedimento NÃO é recall de venda. */
  function recallsDe(plano, opts) {
    opts = opts || {};
    const pac = pacDe(plano.pacote), out = [], ok = opts.incluirPropostos ? ["aceito", "realizado", "proposto", "em_aberto"] : ["aceito", "realizado"];
    plano.itens.forEach(it => {
      if (!ok.includes(it.status) || !conta(it, plano)) return;
      if (it.sessao && it.sessao.i < it.sessao.n) return;   // etapa intermediária: o recall sai da última
      const proc = procDe(pac, it.proc, opts.tab); if (!proc) return;
      if (Array.isArray(it.recall) && it.recall.length && !opts.recalcular) {
        it.recall.forEach(d => out.push(linhaRecall(it, proc, pac, d, null, plano, opts.tab)));
        return;
      }
      if (!proc.recall || !proc.recall.length) return;
      const ini = it.data || plano.criado || HOJE;
      const datas = it.serie && it.serie.n ? seriesDe(it.serie, ini) : [ini];
      const ref = datas[datas.length - 1];
      proc.recall.forEach(r => out.push(linhaRecall(it, proc, pac, somaDias(ref, r.d), r, plano, opts.tab)));
    });
    return out.sort((a, b) => parse(a.data) - parse(b.data));
  }
  function linhaRecall(it, proc, pac, data, r, plano, tab) {
    return { uid: it.uid, alvo: it.alvo, alvoNome: PAC().nomeAlvo(pac, it), proc: proc.id, procNome: proc.nome, familia: proc.familia,
      data, mes: mesAno(data), dias: diasEntre(HOJE, data), rot: (r && r.rot) || "Recall", msg: "recall", valorPrevisto: valorLinha(it, pac, plano, tab) };
  }
  // R$ de recall com data até hoje + N dias (Painel · "Recall previsto · 90 dias")
  const recallPrevisto = (planos, dias) => planos.reduce((s, p) => s + recallsDe(p).filter(r => r.dias >= 0 && r.dias <= (dias || 90)).reduce((a, r) => a + r.valorPrevisto, 0), 0);

  /* ---------- Montagem (para a tela de plano; continuam puras: devolvem cópias) ---------- */
  let seq = 0;
  const uid = () => "n" + Date.now().toString(36) + (seq++).toString(36);
  function novaLinha(pac, alvoId, procId, o) {
    pac = pacDe(pac); o = o || {};
    const proc = procDe(pac, procId), a = PAC().alvo(pac, alvoId);
    if (!proc || !a) throw new Error("alvo ou procedimento fora do pacote: " + alvoId + " / " + procId);
    const it = { uid: o.uid || uid(), alvo: alvoId, proc: procId, unidade: proc.unidade, status: o.status || "proposto", origem: o.origem || "closer",
      grupo: o.grupo || a.grupo || (pac.grupos[0] && pac.grupos[0].id) };
    if (o.lado) it.lado = o.lado;
    if (proc.porFace) it.faces = (o.faces && o.faces.length ? o.faces : ["O"]).slice();
    it.qtd = normalizaQtd(proc, o.qtd != null ? o.qtd : PAC().qtdPadrao(proc, alvoId), it);
    if (o.combo) it.combo = o.combo;
    if (o.data) it.data = o.data;
    if (proc.serie && o.serie !== false) it.serie = Object.assign({}, proc.serie, { i: 1 });
    return it;
  }
  function aplicaCombo(pac, comboId, o) {
    pac = pacDe(pac); o = o || {};
    const c = PAC().combo(pac, comboId); if (!c) return [];
    const inst = comboId + "#" + (o.n || 1);
    return c.itens.map(([alvoId, procId, qtd, lado]) => novaLinha(pac, alvoId, procId, Object.assign({}, o, { qtd, lado, combo: inst })));
  }

  W.PL = {
    HOJE, STATUS, MOTIVOS,
    valorLinha, totalPlano, total, parcela, recallsDe, seriesDe, recallPrevisto,
    normalizaQtd, base, fatorLado, ajustesCombo, novaLinha, aplicaCombo,
    data: { parse, fmt, somaDias, diasEntre, mesAno },
  };
})();
