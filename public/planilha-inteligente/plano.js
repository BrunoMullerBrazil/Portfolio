/* =====================================================================
   plano.js · tela do plano e orçamento por região (window.PLT)
   Revisão "pacotes" · Estética (id "dermato") e Odontologia (id "odonto").
   - Motor: plano_motor.js (window.PL). Dados: pacotes.js (PAC), planos_dados.js (PLD).
   - Desenhos: desenhos/desenhos_estetica.js e desenhos_odonto.js (window.DES).
     Os desenhos da estética ainda trazem ids antigos (r-glabela, r-bracos…);
     normaliza() os converte para os ids do pacote (glabela, braco_e/braco_d…).
   - Linha vermelha de prontuário: só comercial (alvo, procedimento do catálogo,
     quantidade, valor, grupo, status, motivo fechado, datas). Sem campo livre.
   - URL: ?p=<paciente> · ?demo=odonto|dermato · &modo=apresentacao · &perfil=…
   - Sem 3D: o efeito do modo apresentação vem do próprio SVG.
   ===================================================================== */
(function () {
  "use strict";
  const W = window, doc = document, body = doc.body;
  const PAC = W.PAC, PL = W.PL, PLD = W.PLD, UI = W.UI, VA = W.VA, DES = W.DES || {};
  if (!PAC || !PL || !PLD) return;
  const q = new URLSearchParams(location.search);
  const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.22,1,.36,1)";
  const $ = (s, r = doc) => r.querySelector(s), $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ico = (id, cls = "ico ico-sm") => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const real = v => Math.round(v).toLocaleString("pt-BR");
  const cent = v => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const milTxt = v => (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const anima = (el, kf, o) => { try { return el && !REDUZ ? el.animate(kf, o) : null; } catch (e) { return null; } };
  const celular = () => matchMedia("(max-width: 720px)").matches;
  const comMouse = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
  const aviso = h => { if (W.TL && W.TL.aviso) W.TL.aviso(h); };
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* sem armazenamento */ } },
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* idem */ } },
  };
  const HOJE = PL.HOJE, D = PL.data;
  let minutos = 0;
  const horaAgora = () => { const t = 9 * 60 + 40 + minutos; return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };

  /* ---------- ícones locais (o sprite de comum.js não tem estes) ---------- */
  const ICO = {
    "i-pl-mais3": '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
    "i-pl-menos": '<path d="M5 12h14"/>',
    "i-pl-ext": '<path d="M13.5 4.5h6v6M19.5 4.5 11 13M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    "i-pl-olho": '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    "i-pl-combo": '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><path d="M17 14v6M14 17h6"/>',
    "i-pl-sair": '<path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
    "i-pl-cima": '<path d="m6 14.5 6-6 6 6"/>',
    "i-pl-baixo": '<path d="m6 9.5 6 6 6-6"/>',
    "i-pl-enviar": '<path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z"/>',
  };
  body.insertAdjacentHTML("afterbegin", '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
    Object.entries(ICO).map(([id, d]) => `<symbol id="${id}" viewBox="0 0 24 24">${d}</symbol>`).join("") + "</svg>");

  /* O trilho não ganha item novo: o item ativo continua sendo o Funil */
  const itFunil = $('.trilho__item[href="funil.html"]'); if (itFunil) itFunil.setAttribute("aria-current", "page");

  /* =====================================================================
     1. PERFIL, PACIENTE E PLANO
     ===================================================================== */
  const PERFIL = W.MUNIN_PERFIL || q.get("perfil") || "closer";
  const MEDICO = PERFIL === "medico";
  const VER_RS = !MEDICO;   // médico: sem R$ (padrão da v1)
  // §4e: só Closer, Gestão e Médico abrem o plano. Recepção vê total e pagamento; SDR, só a categoria.
  const RESTRITO = PERFIL === "sdr" || PERFIL === "recepcao";
  const DEMO = { odonto: "mariana-alves", dermato: "cristina", estetica: "cristina" };
  let PID = q.get("p") || DEMO[q.get("demo")] || null;
  if (PID && !PLD.paciente(PID)) PID = null;
  body.classList.toggle("pl-medico", MEDICO);

  const coluna = $("#pl-coluna"), lado = $("#pl-lado");
  if (RESTRITO) { semAcesso(); return; }
  if (!PID) { escolhaPaciente(); return; }

  const PAC_ = PLD.paciente(PID);
  const chave = "munin:plano:" + PID;
  function planoNovo() {
    const cfg = PAC.config(), med = PAC_.med || "d";
    let pacId = (cfg.padrao && cfg.padrao[med]) || "dermato";
    if (!cfg.ativos.includes(pacId)) pacId = cfg.ativos[0] || "dermato";
    return { id: "pl-" + PID + "-1", paciente: PID, pacote: pacId, variante: "A", med, closer: "tatiana", criado: HOJE, atualizado: HOJE + " 09:40",
      itens: [], desconto: { pct: 0 }, pagamento: { forma: "cartao", parcelas: 1 }, valores: { liberadosApresentacao: false }, resumo: null };
  }
  const S = {
    plano: PLD.plano(PID) || planoNovo(),
    sel: null, lado: "bi", faces: [], escopo: "dente", clin: "clinico", arc: "sup", masc: false,
    modo: celular() ? "lista" : "mapa", mapaCel: false, busca: "", ultimo: null, aba: null, vista: null,
  };
  let PACOTE = PAC.get(S.plano.pacote) || PAC.get("dermato");
  const ODONTO = () => PACOTE.id === "odonto";
  // lista fechada e comercial (§1.3): a do pacote, sem estado emocional; sem remapear o dado salvo
  const MOTIVOS = () => PACOTE.motivosPendencia || PL.MOTIVOS;
  function normalizaPlano(p) {
    if (!p.pagamento) p.pagamento = { forma: "cartao", parcelas: 1 };
    if (!p.desconto) p.desconto = { pct: 0 };
    return p;
  }
  normalizaPlano(S.plano);
  const primeiraAba = () => {
    // aba com mais itens desenhados; senão a padrão
    const conta = {}; S.plano.itens.forEach(it => { const a = PAC.alvo(PACOTE, it.alvo); if (a && a.vista) conta[a.vista] = (conta[a.vista] || 0) + 1; });
    const abas = PACOTE.abas || [];
    let melhor = abas[0], n = -1;
    abas.forEach(ab => { const c = ab.vistas.reduce((s, v) => s + (conta[v] || 0), 0); if (c > n) { n = c; melhor = ab; } });
    return melhor;
  };
  function poeAba(id) {
    const ab = (PACOTE.abas || []).find(a => a.id === id) || PACOTE.abas[0];
    S.aba = ab.id; if (!ab.vistas.includes(S.vista)) S.vista = ab.vistas[0];
  }
  poeAba(primeiraAba().id);
  if (ODONTO()) { S.vista = "odontograma"; S.aba = "odontograma"; S.modo = "mapa"; }   // odonto no celular: uma arcada por vez

  const salvaTimer = { t: 0 };
  function salva(agora) {
    S.plano.atualizado = HOJE + " " + horaAgora();
    clearTimeout(salvaTimer.t);
    const f = () => ls.set(chave, JSON.stringify(S.plano));
    if (agora) f(); else salvaTimer.t = setTimeout(f, 120);
  }

  /* ---------- ajudantes de dados ---------- */
  const procDe = id => PAC.proc(PACOTE, id);
  const alvoDe = id => PAC.alvo(PACOTE, id);
  const nomeProf = med => PLD.nomeProf(med);
  const medCurto = med => (PLD.profissionais[med] && PLD.profissionais[med].curto) || (UI && UI.nomeMed ? UI.nomeMed(med) : nomeProf(med));
  const closerNome = c => c ? c.charAt(0).toUpperCase() + c.slice(1) : "Closer";
  const vivos = () => S.plano.itens.filter(it => it.status !== "recusado");
  const CURTO = { tox: "Toxina", "tox-masseter": "Toxina · masseter", "tox-axilas": "Toxina · axilas", "tox-pescoco": "Toxina · pescoço", ah: "Preenchimento",
    bio: "Bioestimulador", "bio-corpo": "Bioestimulador", skin: "Skinbooster", usm: "Ultrassom", "usm-corpo": "Ultrassom", rf: "Radiofrequência", crio: "Criolipólise",
    "laser-rosto": "Laser", peeling: "Peeling", "peeling-corpo": "Peeling", remocao: "Remoção", mapa: "Mapeamento", limpeza: "Limpeza", "manut-tri": "Manutenção",
    rest: "Restauração", "endo-ant": "Endodontia", "endo-pm": "Endodontia", "endo-mol": "Endodontia", coroa: "Coroa", onlay: "Onlay", extracao: "Extração",
    "extracao-siso": "Extração", implante: "Implante", "a-definir": "A definir", lente: "Lente", faceta: "Faceta", "contorno-gengival": "Contorno gengival",
    clareamento: "Clareamento", "clareamento-casa": "Clareamento caseiro", placa: "Placa noturna", "protese-total": "Prótese total", protocolo: "Protocolo",
    alinhadores: "Alinhadores", aparelho: "Aparelho" };
  const curto = id => CURTO[id] || (procDe(id) || { nome: id }).nome.split(" · ")[0];
  // sem repetir a região: "Masseter · Toxina · masseter" vira "Masseter · Toxina"
  const curtoEm = (id, alvoNome) => { const c = curto(id), i = c.lastIndexOf(" · "); return i > 0 && alvoNome && String(alvoNome).toLowerCase().includes(c.slice(i + 3).toLowerCase()) ? c.slice(0, i) : c; };
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const ESTETICO = p => p && (p.familia === "estetica" || p.familia === "ortodontia");
  const ST = { proposto: ["Proposto", "neutro"], aceito: ["Aceito", "ok"], realizado: ["Realizado", "neutro"], em_aberto: ["Em aberto", "atencao"], recusado: ["Recusado", "neutro"] };
  // estado agregado de um alvo (ordem de força para o ponto do mapa)
  const FORCA = { aceito: 4, proposto: 3, em_aberto: 2, realizado: 1 };
  // letra da face na tela: anteriores (1 a 3 de cada quadrante) usam I (incisal); palatina P na arcada superior.
  // O dado guarda a chave do desenho ("O"), que é a mesma face; só o rótulo muda.
  function letraFace(a, f) {
    if (a && a.tipo === "dente" && f === "O" && Number(String(a.fdi)[1]) <= 3) return "I";
    if (a && f === "L" && a.arcada === "arcada_sup") return "P";
    return f;
  }
  function qtdTxt(it) {
    const p = procDe(it.proc); if (!p) return "";
    const u = PAC.UNIDADES[p.unidade] || {};
    if (p.porFace) { const f = it.faces || [], n = f.length || it.qtd, a = alvoDe(it.alvo); return `${n} ${n === 1 ? "face" : "faces"}${f.length ? ` (${f.map(x => letraFace(a, x)).join(", ")})` : ""}`; }
    if (p.unidade === "U") return `${it.qtd} U`;
    if (p.unidade === "dente" || p.unidade === "pacote") return "";
    return `${it.qtd} ${it.qtd === 1 ? u.um : u.varios}`;
  }
  function faseDe(p) {
    if (!ODONTO()) return null;
    const g = PACOTE.grupos.map(x => x.id);
    if (p.familia === "estetica" || p.familia === "ortodontia") return g[2] || g[g.length - 1];
    if (p.familia === "reabilitacao" || p.familia === "implante") return g[1] || g[0];
    return g[0];
  }
  const nomeGrupo = g => {
    if (!g) return "Outros";
    if (ODONTO()) { const t = (S.plano.titulos && S.plano.titulos[g.id]) || g.titulo; return `${g.nome} · ${t}`; }
    return g.nome;
  };
  const voltaEm = it => {
    const r = PL.recallsDe({ pacote: S.plano.pacote, criado: S.plano.criado, itens: [Object.assign({}, it, { status: "aceito" })] }, { incluirPropostos: true });
    return r.length ? r[0] : null;
  };
  function tot() { return PL.totalPlano(S.plano); }
  const valorUid = (t, uid) => { const x = t.itens.find(i => i.uid === uid); return x ? x.valor : 0; };

  /* =====================================================================
     2. DESENHOS: normalização dos ids e estado das regiões
     ===================================================================== */
  const MAPA_ID = { "r-frontal": "frontal", "r-glabela": "glabela", "r-periorbital": "periorbital", "r-olheira": "olheira", "r-nariz": "nariz", "r-malar": "malar",
    "r-sulco-ng": "nasogeniano", "r-labios": "labios", "r-mento": "mento", "r-mandibula": "mandibula", "r-masseter": "masseter", "r-papada": "papada",
    "r-pescoco": "pescoco", "r-colo": "colo", "r-axilas": "axila", "r-bracos": "braco", "r-maos": "maos", "r-abdome-sup": "abdome_sup", "r-abdome-inf": "abdome_inf",
    "r-flancos": "flanco", "r-coxas-ext": "coxa_ext", "r-coxas-int": "coxa_int", "r-joelhos": "joelho", "r-costas-sup": "costas_sup", "r-costas-inf": "costas_inf",
    "r-bracos-post": "braco_post", "r-gluteos": "gluteo", "r-culote": "culote", "r-panturrilhas": "panturrilha" };
  function desenhoDe(vista) {
    if (vista && vista.startsWith("corpo") && S.masc && DES[vista + "_m"]) return DES[vista + "_m"];
    return DES[vista] || "";
  }
  function normaliza(svg, pac, interativo) {
    $$("[data-alvo]", svg).forEach(el => {
      const orig = el.dataset.alvo, base = MAPA_ID[orig] || orig;
      el.removeAttribute("id");
      const lados = $$(":scope > [data-lado]", el);
      if (lados.length && PAC.alvo(pac, base + "_e")) {
        el.removeAttribute("data-alvo"); el.classList.remove("pl-alvo"); el.classList.add("pl-par");
        lados.forEach(c => { c.dataset.alvo = base + "_" + c.dataset.lado.toLowerCase(); c.classList.add("pl-alvo"); });
      } else if (PAC.alvo(pac, base)) el.dataset.alvo = base;
      else { el.removeAttribute("data-alvo"); el.classList.remove("pl-alvo"); el.classList.add("pl-alvo-sem"); }
    });
    svg.removeAttribute("role"); svg.setAttribute("focusable", "false");
    $$("[data-alvo]", svg).forEach(el => {
      el.classList.add("pl-alvo");
      if (interativo) { el.setAttribute("tabindex", "0"); el.setAttribute("role", "button"); }
      else { el.removeAttribute("tabindex"); el.setAttribute("aria-hidden", "true"); }
    });
    return svg;
  }
  // estado do plano em cada id de desenho
  function estadoIds(itens) {
    const m = {};
    itens.forEach(it => {
      if (it.status === "recusado") return;
      PAC.alvosDoItem(PACOTE, it).forEach(id => {
        const atual = m[id];
        if (!atual || FORCA[it.status] > FORCA[atual.st]) m[id] = { st: it.status, faces: (atual && atual.faces) || [] };
        if (it.faces) m[id].faces = [...new Set(m[id].faces.concat(it.faces))];
      });
    });
    return m;
  }
  function pintaEstado(svg, itens, sel) {
    const m = estadoIds(itens);
    $$("[data-alvo]", svg).forEach(el => {
      const id = el.dataset.alvo, e = m[id];
      if (e) el.dataset.st = e.st; else el.removeAttribute("data-st");
      el.classList.toggle("is-sel", !!sel && sel.includes(id));
      $$("[data-face]", el).forEach(f => f.classList.toggle("is-face", !!e && e.faces.includes(f.dataset.face)));
    });
    return m;
  }
  const idsSel = () => {
    if (!S.sel) return [];
    const a = alvoDe(S.sel); if (!a) return [S.sel];
    return a.par && S.lado === "bi" ? [a.id, a.par] : [a.id];
  };

  /* ---------- HUD: pontos, rótulos e linhas-guia (ref. 5) ---------- */
  // rotulos: [{ids, html, cls}] · pontos: {id: estado} · opts.min: largura mínima da calha
  function hud(area, svg, rotulos, pontos, opts) {
    opts = opts || {};
    const camada = $(".pl-hud", area), rots = $(".pl-rots", area);
    if (!camada || !rots || !svg) return;
    const ar = area.getBoundingClientRect(), sr = svg.getBoundingClientRect();
    camada.setAttribute("viewBox", `0 0 ${Math.max(1, ar.width)} ${Math.max(1, ar.height)}`);
    camada.setAttribute("width", ar.width); camada.setAttribute("height", ar.height);
    const C = {};
    $$("[data-alvo]", svg).forEach(el => {
      const k = el.dataset.alvo; if (C[k]) return;
      const t = $(":scope > [data-lado]", el) || el, r = t.getBoundingClientRect();
      if (!r.width && !r.height) return;
      C[k] = [r.left + r.width / 2 - ar.left, r.top + r.height / 2 - ar.top];
    });
    // arcadas: âncora nos incisivos (o centro da faixa em U fica fora dela)
    const mid = (a, b, dy) => C[a] && C[b] ? [(C[a][0] + C[b][0]) / 2, (C[a][1] + C[b][1]) / 2 + dy] : null;
    if (C.arcada_sup) C.arcada_sup = mid("d11", "d21", 0) || C.arcada_sup;
    if (C.arcada_inf) C.arcada_inf = mid("d41", "d31", 0) || C.arcada_inf;
    let g = "";
    // dicas: onde dá para tocar (aparecem com o cursor sobre o mapa)
    if (opts.dicas) Object.entries(C).forEach(([k, [x, y]]) => { if (!pontos[k]) g += `<circle class="pl-dica" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/>`; });
    const calE = sr.left - ar.left - 14, calD = ar.right - sr.right - 14;
    const cabe = Math.min(calE, calD) >= (opts.min || 92);
    const lados = { e: [], d: [] };
    rotulos.forEach(r => {
      const ps = r.ids.map(id => C[id]).filter(Boolean); if (!ps.length) return;
      const p = ps.reduce((a, b) => (b[0] < a[0] ? b : a));
      const pd = ps.reduce((a, b) => (b[0] > a[0] ? b : a));
      const cx = (sr.left + sr.width / 2) - ar.left, m = (p[0] + pd[0]) / 2;
      const centro = Math.abs(m - cx) < sr.width * 0.06;
      const l = r.lado || (centro ? null : (m < cx ? "e" : "d"));
      (l ? lados[l] : (lados.c = lados.c || [])).push(Object.assign({ p, pd }, r, { lado: l }));
    });
    // os do meio vão para o lado com menos rótulos (equilíbrio visual)
    (lados.c || []).sort((a, b) => a.p[1] - b.p[1]).forEach(r => { r.lado = lados.e.length < lados.d.length ? "e" : "d"; lados[r.lado].push(r); });
    ["e", "d"].forEach(l => lados[l].forEach(r => { r.ax = l === "e" ? r.p[0] : r.pd[0]; r.ay = (l === "e" ? r.p : r.pd)[1]; }));
    let h = "";
    if (cabe) {
      const passo = opts.passo || 30, H = ar.height;
      ["e", "d"].forEach(l => {
        const L = lados[l].sort((a, b) => a.ay - b.ay);
        let y = -Infinity;
        L.forEach(r => { r.ly = Math.max(r.ay, y + passo); y = r.ly; });
        // se passou do fim, empurra para cima
        let lim = H - 14;
        for (let i = L.length - 1; i >= 0; i--) { if (L[i].ly > lim) L[i].ly = lim; lim = L[i].ly - passo; }
        L.forEach((r, i) => {
          const borda = l === "e" ? sr.left - ar.left - 8 : sr.right - ar.left + 8;
          const fim = l === "e" ? borda - 18 : borda + 18;
          const d = `M${r.ax.toFixed(1)} ${r.ay.toFixed(1)}L${borda.toFixed(1)} ${r.ly.toFixed(1)}L${fim.toFixed(1)} ${r.ly.toFixed(1)}`;
          g += `<path class="pl-guia-hud${r.cls ? " " + r.cls : ""}" d="${d}" pathLength="1" style="--i:${i}"/>`;
          const w = (l === "e" ? calE : calD) - 10;
          h += `<div class="pl-hrot pl-hrot--${l}${r.cls ? " " + r.cls : ""}" style="top:${r.ly.toFixed(1)}px;${l === "e" ? `right:${(ar.width - fim + 6).toFixed(1)}px` : `left:${(fim + 6).toFixed(1)}px`};max-width:${Math.max(80, w).toFixed(0)}px;--i:${i}">${r.html}</div>`;
        });
      });
    }
    Object.entries(pontos).forEach(([id, st]) => {
      if (!C[id] || opts.semPontos) return;
      const [x, y] = C[id];
      g += `<circle class="pl-pt pl-pt--${st}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${opts.r || 5}"/>`;
      if (st === "realizado") g += `<path class="pl-pt-ok" d="M${(x - 2.4).toFixed(1)} ${y.toFixed(1)}l1.7 1.7 3.1-3.4"/>`;
    });
    camada.innerHTML = g; rots.innerHTML = h;
    area.classList.toggle("pl-area--sem-rot", !cabe);
    return C;
  }

  /* =====================================================================
     3. CAMADAS: popover, diálogo e folha inferior
     ===================================================================== */
  const veu = doc.createElement("div"); veu.className = "pl-veu"; veu.hidden = true; body.appendChild(veu);
  const camada = doc.createElement("div"); camada.className = "pl-camada"; camada.hidden = true; camada.tabIndex = -1; body.appendChild(camada);
  let aberta = null;
  const focaveis = el => $$("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex='-1'])", el).filter(x => x.getClientRects().length);
  function abreCamada(html, o) {
    o = o || {};
    fechaCamada(true);
    const tipo = o.tipo === "pop" && celular() ? "folha" : (o.tipo || "dlg");
    camada.className = "pl-camada pl-camada--" + tipo + (o.cls ? " " + o.cls : "");
    camada.setAttribute("role", "dialog"); camada.setAttribute("aria-modal", tipo === "pop" ? "false" : "true");
    camada.setAttribute("aria-label", o.rotulo || "Detalhe");
    camada.innerHTML = (tipo === "folha" ? '<div class="pl-folha__alca" data-alca aria-hidden="true"><i></i></div>' : "") + html;
    camada.hidden = false; camada.style.left = camada.style.top = "";
    veu.hidden = tipo === "pop"; veu.classList.toggle("pl-veu--folha", tipo === "folha");
    aberta = { bt: o.bt || doc.activeElement, volta: o.volta, tipo, aoFechar: o.aoFechar };
    if (tipo === "pop" && o.bt) posiciona(o.bt);
    if (tipo === "folha") anima(camada, [{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 280, easing: EASE });
    else if (tipo === "dlg") anima(camada, [{ opacity: 0, transform: "translate(-50%, -48%) scale(.98)" }, { opacity: 1, transform: "translate(-50%, -50%)" }], { duration: 220, easing: EASE });
    else anima(camada, [{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], { duration: 160, easing: EASE });
    if (!veu.hidden) anima(veu, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    const f = (o.foco && $(o.foco, camada)) || focaveis(camada)[0] || camada;
    setTimeout(() => f.focus({ preventScroll: true }), 30);
    return camada;
  }
  function posiciona(bt) {
    const r = bt.getBoundingClientRect(), w = camada.offsetWidth, h = camada.offsetHeight, m = 12;
    let x = Math.min(Math.max(m, r.right - w), innerWidth - w - m), y = r.bottom + 8;
    if (y + h > innerHeight - m && r.top - 8 - h >= m) y = r.top - 8 - h;
    y = Math.max(m, Math.min(y, innerHeight - h - m));
    camada.style.left = x + "px"; camada.style.top = y + "px";
  }
  function fechaCamada(silencio) {
    if (!aberta) return;
    const a = aberta; aberta = null;
    camada.hidden = true; veu.hidden = true; camada.innerHTML = "";
    if (a.aoFechar) a.aoFechar();
    // o botão de origem pode ter sido trocado por um render(): volta pelo seletor
    const alvoFoco = a.bt && a.bt !== body && a.bt.isConnected && !camada.contains(a.bt) ? a.bt : (a.volta && $(a.volta));
    if (!silencio && alvoFoco) alvoFoco.focus({ preventScroll: true });
  }
  veu.addEventListener("click", () => fechaCamada());
  doc.addEventListener("keydown", e => {
    if (!aberta) return;
    if (e.key === "Escape") { e.preventDefault(); fechaCamada(); return; }
    if (e.key === "Tab" && aberta.tipo !== "pop") {
      const f = focaveis(camada); if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  doc.addEventListener("pointerdown", e => {
    if (aberta && aberta.tipo === "pop" && !camada.contains(e.target) && !(aberta.bt && aberta.bt.contains(e.target))) fechaCamada(true);
  });
  // folha: arrastar a alça para baixo fecha
  (function () {
    let y0 = null;
    camada.addEventListener("pointerdown", e => { if (e.target.closest("[data-alca]")) { y0 = e.clientY; camada.setPointerCapture(e.pointerId); } });
    camada.addEventListener("pointermove", e => { if (y0 != null) camada.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; });
    camada.addEventListener("pointerup", e => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; camada.style.transform = ""; if (dy > 80) fechaCamada(); });
  })();

  /* =====================================================================
     4. TOPO
     ===================================================================== */
  function topo() {
    const nome = PAC_.nome, cfg = PAC.config(), ativos = PAC.ativos();
    $("#pl-nome").innerHTML = `${UI && UI.av && VA && VA.P[PID] ? UI.av(PAC_.med, nome) + " " : `<span class="av av--o" aria-hidden="true">${esc(nome.split(" ").map(x => x[0]).slice(0, 2).join(""))}</span> `}${esc(nome)}`;
    const fechado = ss.get("munin:fechado:" + PID);
    const sub = S.plano.subStatus ? `<span class="chip chip--borda">${esc(S.plano.subStatus)}</span>` : "";
    $("#pl-data").innerHTML = `<b>Plano · ${esc(PACOTE.rot)}</b> · ${esc(medCurto(S.plano.med))} · closer ${esc(closerNome(S.plano.closer))} · atualizado ${esc(S.plano.atualizado.replace("/2026", ""))} ${sub}${fechado ? ` <span class="status status--ok">Fechado nesta sessão</span>` : ""}${MEDICO ? ` <span class="chip">Modo médico · sem valores</span>` : ""}`;
    // com itens no plano a especialidade fica fixa: selo estático (um select desabilitado parecia clicável)
    const sel = ativos.length > 1 && !S.plano.itens.length ? `<label class="pl-pacote"><span class="sr">Especialidade</span><select id="pl-pacote">${ativos.map(p => `<option value="${p.id}"${p.id === PACOTE.id ? " selected" : ""}>${esc(p.rot)}</option>`).join("")}</select></label>` : `<span class="pl-selo-esp">${esc(PACOTE.rot)}</span>`;
    const linkPront = PAC.linkProntuario(PID), pront = /exemplo\.com\.br/.test(linkPront)
      ? `<button type="button" class="bt-sec pl-pront" data-pront-cfg>Abrir no prontuário ${ico("i-pl-ext")}</button>`
      : `<a class="bt-sec pl-pront" href="${esc(linkPront)}" target="_blank" rel="noopener">Abrir no prontuário ${ico("i-pl-ext")}</a>`;
    $("#pl-topo").innerHTML = `${sel}
      ${pront}
      <button type="button" class="bt-ico pl-mais" id="pl-mais" aria-haspopup="menu" aria-label="Mais ações do plano" title="Mais">${ico("i-pl-mais3", "ico")}</button>`;
    const s = $("#pl-pacote"); if (s) s.addEventListener("change", () => {
      if (S.plano.itens.length) return;
      S.plano.pacote = s.value; PACOTE = PAC.get(s.value); S.sel = null; S.faces = [];
      poeAba(PACOTE.abas[0].id); salva(); renderTudo();
    });
    $("#pl-mais").addEventListener("click", e => {
      const html = `<div class="pl-menu" role="menu">
        <button role="menuitem" type="button" data-acao="apres">${ico("i-pl-olho")}Mostrar à paciente</button>
        ${VER_RS ? `<button role="menuitem" type="button" data-acao="resumo">${ico("i-whats")}Enviar resumo</button>` : ""}
        ${ODONTO() && !MEDICO ? `<button role="menuitem" type="button" data-acao="titulos">${ico("i-pl-combo")}Títulos das fases</button>` : ""}
        <button role="menuitem" type="button" data-acao="restaura">${ico("i-recall")}Restaurar o exemplo</button>
        <a role="menuitem" href="ajustes.html#tabela">${ico("i-ajustes")}Tabela de preços</a></div>`;
      abreCamada(html, { tipo: "pop", bt: e.currentTarget, rotulo: "Mais ações" });
    });
  }
  camada.addEventListener("click", e => {
    const b = e.target.closest("[data-acao]"); if (!b) return;
    const a = b.dataset.acao;
    if (a === "apres") { fechaCamada(true); apresentacao(); }
    else if (a === "resumo") { fechaCamada(true); enviaResumo(); }
    else if (a === "titulos") { fechaCamada(true); titulosFases(); }
    else if (a === "restaura") { ls.del(chave); S.plano = normalizaPlano(PLD.plano(PID) || planoNovo()); PACOTE = PAC.get(S.plano.pacote); S.sel = null; fechaCamada(true); renderTudo(); aviso("Plano de exemplo restaurado"); }
  });

  // odonto: o título comercial de cada fase sai do cabeçalho do orçamento e fica aqui (menu ···)
  function titulosFases() {
    const html = `<div class="pl-dlg"><div class="pl-dlg__cab"><h2>Títulos das fases</h2><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-dlg-fecha aria-label="Fechar">${ico("i-fechar")}</button></div>
      <div class="pl-titulos">${PACOTE.grupos.map(g => `<label class="pl-mot"><span>${esc(g.nome)}</span><select data-titulo="${g.id}">${PACOTE.titulosFase.map(x => `<option${((S.plano.titulos || {})[g.id] || g.titulo) === x ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`).join("")}</div>
      <p class="pl-dlg__nota">${ico("i-info")}O título aparece no orçamento, na apresentação e no resumo da paciente.</p>
      <div class="pl-dlg__pe"><button type="button" class="bt-principal" data-dlg-fecha>Pronto</button></div></div>`;
    abreCamada(html, { tipo: "dlg", bt: $("#pl-mais"), rotulo: "Títulos das fases" });
    delete camada.dataset.uid; delete camada.dataset.alvo;
  }
  camada.addEventListener("change", e => {
    const s = e.target.closest("[data-titulo]"); if (!s) return;
    S.plano.titulos = Object.assign({}, S.plano.titulos, { [s.dataset.titulo]: s.value }); salva(); render();
  });
  // prontuário ainda com o endereço de exemplo: explica onde configurar em vez de abrir uma página que não existe
  doc.addEventListener("click", e => {
    const bt = e.target.closest("[data-pront-cfg]"); if (!bt) return;
    abreCamada(`<div class="pl-pop"><div class="pl-pop__cab"><b>Prontuário ainda sem link</b><span>Informe o endereço do prontuário da clínica para abrir a ficha da paciente direto daqui.</span></div>
      <div class="pl-pop__pe"><button type="button" class="bt-texto" data-dlg-fecha>Agora não</button><a class="bt-sec" href="ajustes.html#especialidades">Configurar em Ajustes</a></div></div>`, { tipo: "pop", bt, rotulo: "Link do prontuário" });
    delete camada.dataset.uid; delete camada.dataset.alvo;
  });

  /* =====================================================================
     5. COLUNA: mapa (ou lista) + linha do tempo
     ===================================================================== */
  function abasHtml() {
    const abas = PACOTE.abas || [];
    return `<div class="abas pl-abas" role="tablist" aria-label="Vistas do ${esc(PACOTE.rot)}">${abas.map(a => {
      const n = S.plano.itens.filter(it => { const x = alvoDe(it.alvo); return x && it.status !== "recusado" && a.vistas.includes(x.vista); }).length;
      return `<button type="button" class="aba" role="tab" aria-selected="${S.aba === a.id}" data-aba="${a.id}">${esc(a.rot)}${n ? ` <span class="pilula__n">${n}</span>` : ""}</button>`;
    }).join("")}</div>`;
  }
  function cartaoMapa() {
    const ehPele = S.aba === "pele";
    const modoBt = `<div class="abas pl-modo" role="tablist" aria-label="Forma de montar"><button type="button" class="aba" role="tab" aria-selected="${S.modo === "mapa"}" data-modo="mapa">Mapa</button><button type="button" class="aba" role="tab" aria-selected="${S.modo === "lista"}" data-modo="lista">Lista</button></div>`;
    const combos = PACOTE.combos.filter(c => { const x = PAC.combo(PACOTE, c.id); return x && x.ativo !== false; }).length && !MEDICO
      ? `<button type="button" class="bt-sec pl-combos" id="pl-combos" aria-haspopup="menu">${ico("i-pl-combo")}Combos ${ico("i-pl-baixo")}</button>` : "";
    let sub = "";
    if (S.aba === "corpo") sub = `<div class="pl-sub"><div class="pilulas pl-pil" role="group" aria-label="Lado do corpo">${["corpo_frente", "corpo_costas"].map(v => `<button type="button" class="pilula" aria-pressed="${S.vista === v}" data-vista="${v}">${v === "corpo_frente" ? "Frente" : "Costas"}</button>`).join("")}</div>
      <div class="pilulas pl-pil" role="group" aria-label="Silhueta"><button type="button" class="pilula" aria-pressed="${!S.masc}" data-masc="0">Feminina</button><button type="button" class="pilula" aria-pressed="${S.masc}" data-masc="1">Masculina</button></div></div>`;
    if (ODONTO()) sub = `<div class="pl-sub"><div class="abas pl-clin" role="tablist" aria-label="Tipo de procedimento"><button type="button" class="aba" role="tab" aria-selected="${S.clin === "clinico"}" data-clin="clinico">Clínico</button><button type="button" class="aba" role="tab" aria-selected="${S.clin === "estetico"}" data-clin="estetico">Estético</button></div>
      <div class="pilulas pl-pil" role="group" aria-label="Escopo do toque">${PACOTE.escopos.filter(e => e.id !== "sorriso").map(e => `<button type="button" class="pilula" aria-pressed="${S.escopo === e.id}" data-escopo="${e.id}">${e.rot}</button>`).join("")}</div>
      <div class="pilulas pl-pil pl-so-cel" role="group" aria-label="Arcada">${["sup", "inf"].map(a => `<button type="button" class="pilula" aria-pressed="${S.arc === a}" data-arc="${a}">${a === "sup" ? "Superior" : "Inferior"}</button>`).join("")}</div></div>`;
    const lista = S.modo === "lista" && !ehPele;
    const mapaCel = celular() && !ehPele;
    let corpo;
    if (ehPele) corpo = pele();
    else if (lista) corpo = listaHtml() + (mapaCel ? `<button type="button" class="bt-sec pl-mapa-tg" id="pl-mapa-tg" aria-expanded="${S.mapaCel}">${S.mapaCel ? "Recolher o mapa" : "Ver no mapa"} ${ico(S.mapaCel ? "i-pl-cima" : "i-pl-baixo")}</button>${S.mapaCel ? areaHtml() : ""}` : "");
    else corpo = areaHtml();
    const leg = !ehPele && (!lista || S.mapaCel) ? `<div class="pl-legenda" aria-label="Legenda do mapa"><span><i class="pl-lg pl-lg--aceito"></i>aceito</span><span><i class="pl-lg pl-lg--proposto"></i>proposto</span><span><i class="pl-lg pl-lg--em_aberto"></i>em aberto</span><span><i class="pl-lg pl-lg--realizado"></i>realizado</span>${ODONTO() || lista ? "" : `<span class="pl-legenda__dica">Na Lista dá para montar mais rápido.</span>`}</div>` : "";
    // crédito dos desenhos (CC BY 4.0): fica em Ajustes › Sobre e créditos e no LEIAME dos desenhos, fora da tela do plano
    return `<section class="cartao pl-mapa${ODONTO() ? " pl-mapa--odo" : ""}" id="pl-mapa" aria-labelledby="pl-t-mapa">
      <h2 class="sr" id="pl-t-mapa">Mapa do plano</h2>
      <div class="cartao__cab pl-mapa__cab">${abasHtml()}<div class="linha-flex pl-cab-dir">${ehPele ? "" : modoBt}${combos}</div></div>
      ${sub}
      ${celular() && !ehPele ? alvosCel() : ""}
      <div class="pl-mapa__corpo">${corpo}${ODONTO() && !celular() ? `<div class="pl-dente" id="pl-dente">${painelDente()}</div>` : ""}</div>
      ${leg}
      ${!ODONTO() && !ehPele && !celular() ? `<div class="pl-chips-sec" id="pl-chips">${chipsHtml()}</div>` : ""}
    </section>`;
  }
  function areaHtml() {
    const ar = ODONTO() && celular() ? ` pl-area--arc-${S.arc}` : "";
    return `<div class="pl-area pl-area--${S.vista}${ODONTO() ? " pl-area--odo pl-escopo-" + S.escopo : ""}${ar}" id="pl-area">
      <div class="pl-des" id="pl-des" role="group" aria-label="${esc(rotVista())}"></div>
      <svg class="pl-hud" aria-hidden="true"></svg><div class="pl-rots" aria-hidden="true"></div>
      <div class="pl-lupa" id="pl-lupa" hidden aria-hidden="true"><div class="pl-lupa__in"></div></div>
    </div>`;
  }
  const rotVista = () => ({ rosto: "Mapa do rosto", corpo_frente: "Mapa do corpo, frente", corpo_costas: "Mapa do corpo, costas", odontograma: "Odontograma, vista oclusal", sorriso: "Sorriso, vista frontal" })[S.vista] || "Mapa";

  function montaDesenho() {
    const area = $("#pl-area"); if (!area) return;
    const box = $("#pl-des", area);
    box.innerHTML = desenhoDe(S.vista);
    const svg = $("svg", box); if (!svg) return;
    normaliza(svg, PACOTE, true);
    svg.classList.add("pl-svg");
    if (ODONTO() && celular() && S.vista === "odontograma") svg.setAttribute("viewBox", S.arc === "sup" ? "0 6 450 316" : "0 318 450 316");
    $$("[data-alvo]", svg).forEach(el => {
      const a = alvoDe(el.dataset.alvo); if (!a) return;
      const its = S.plano.itens.filter(it => it.status !== "recusado" && PAC.alvosDoItem(PACOTE, it).includes(a.id));
      const t = tot();
      const parte = its.length ? `, ${its.length} ${its.length === 1 ? "item" : "itens"}, ${its.map(i => ST[i.status][0].toLowerCase()).join(" e ")}${VER_RS ? ", R$ " + real(its.reduce((s, i) => s + valorUid(t, i.uid), 0)) : ""}` : ", sem itens";
      const g = a.grupo ? PACOTE._grupo[a.grupo] : null;
      el.setAttribute("aria-label", `${a.tipo === "dente" ? a.nome : PAC.nomeAlvo(PACOTE, a.id)}${g ? ", " + g.nome.toLowerCase() : ""}${parte}`);
      el.setAttribute("aria-pressed", String(its.length > 0));
    });
    atualizaMapa();
    // odonto no celular: rola até o centro (incisivos)
    if (ODONTO() && celular()) requestAnimationFrame(() => { area.scrollLeft = (area.scrollWidth - area.clientWidth) / 2; });
  }
  function rotulosDoPlano() {
    const t = tot(), por = new Map();
    S.plano.itens.forEach(it => {
      if (it.status === "recusado") return;
      const ids = PAC.alvosDoItem(PACOTE, it); if (!ids.length) return;
      const k = it.alvo + (it.lado === "bi" ? "#bi" : "");
      const o = por.get(k) || { ids: new Set(), itens: [] }; ids.forEach(i => o.ids.add(i)); o.itens.push(it); por.set(k, o);
    });
    const sel = idsSel();
    return [...por.values()].map(o => {
      const it0 = o.itens[0], nome = PAC.nomeAlvo(PACOTE, it0);
      const v = o.itens.reduce((s, i) => s + valorUid(t, i.uid), 0);
      const det = o.itens.length === 1 ? [curtoEm(it0.proc, nome), qtdTxt(it0)].filter(Boolean).join(" ") : `${o.itens.length} itens`;
      const aberto = o.itens.every(i => i.status === "em_aberto");
      const ehSel = [...o.ids].some(i => sel.includes(i));
      return { ids: [...o.ids], html: `<b>${esc(nome)}</b><span>${esc(det)}${VER_RS && v ? ` · R$ ${real(v)}` : ""}</span>`, cls: (aberto ? "is-aberto" : "") + (ehSel ? " is-sel" : "") };
    });
  }
  function atualizaMapa() {
    const area = $("#pl-area"), svg = area && $("#pl-des svg", area); if (!svg) return;
    const m = pintaEstado(svg, S.plano.itens, idsSel());
    if (ODONTO()) {
      const pts = {}; Object.entries(m).forEach(([id, e]) => { if (e.st === "realizado") pts[id] = "realizado"; });
      hud(area, svg, [], pts, { r: 6, min: 9999 });
    } else {
      const pts = {}; Object.entries(m).forEach(([id, e]) => (pts[id] = e.st));
      hud(area, svg, rotulosDoPlano(), pts, { dicas: true });
    }
    clonaLupa();
  }

  /* ---------- lupa (desktop): 140px, 2,5×, anel pena ---------- */
  let lupaSvg = null;
  function clonaLupa() {
    const lupa = $("#pl-lupa"), svg = $("#pl-des svg"); if (!lupa || !svg) return;
    lupaSvg = svg.cloneNode(true);
    $$("[tabindex]", lupaSvg).forEach(e => e.removeAttribute("tabindex"));
    $$("[role]", lupaSvg).forEach(e => e.removeAttribute("role"));
    $(".pl-lupa__in", lupa).innerHTML = ""; $(".pl-lupa__in", lupa).appendChild(lupaSvg);
  }
  let lupaRaf = 0, lupaEv = null;
  function moveLupa() {
    lupaRaf = 0;
    const e = lupaEv, area = $("#pl-area"), lupa = $("#pl-lupa"), svg = $("#pl-des svg");
    if (!e || !area || !lupa || !svg || !lupaSvg) return;
    const alvoEl = e.target.closest && e.target.closest("[data-alvo]");
    const a = alvoEl && alvoDe(alvoEl.dataset.alvo);
    const mostra = a && (a.pequena || a.tipo === "dente");
    if (!mostra) { if (!lupa.hidden) lupa.hidden = true; return; }
    const ar = area.getBoundingClientRect(), sr = svg.getBoundingClientRect(), Z = 2.5, R = 70;
    lupaSvg.style.width = sr.width * Z + "px"; lupaSvg.style.height = sr.height * Z + "px";
    lupaSvg.style.transform = `translate(${(R - (e.clientX - sr.left) * Z).toFixed(1)}px, ${(R - (e.clientY - sr.top) * Z).toFixed(1)}px)`;
    // a lupa sai para fora do desenho (lado do cursor em relação ao centro), sem cobrir o miolo
    const fora = e.clientX < sr.left + sr.width / 2 ? -1 : 1;
    let x = fora < 0 ? e.clientX - ar.left - 2 * R - 18 : e.clientX - ar.left + 18, y = e.clientY - ar.top - R;
    if (x < 0) x = e.clientX - ar.left + 18;
    if (x + 2 * R > ar.width) x = e.clientX - ar.left - 2 * R - 18;
    y = Math.max(0, Math.min(y, ar.height - 2 * R));
    lupa.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if (lupa.hidden) { lupa.hidden = false; anima(lupa, [{ opacity: 0, scale: .92 }, { opacity: 1, scale: 1 }], { duration: 160, easing: EASE }); }
  }

  /* ---------- chips de procedimento da região ---------- */
  function procsDoAlvo(a) {
    if (!a) return [];
    return a.procs.map(procDe).filter(p => p && p.ativo !== false).filter(p => !ODONTO() || S.clin === "clinico" ? !ESTETICO(p) || !ODONTO() : ESTETICO(p));
  }
  function precoPrev(a, p) {
    const it = { alvo: a.id, proc: p.id, qtd: PAC.qtdPadrao(p, a.id), faces: p.porFace ? (S.faces.length ? S.faces : ["O"]) : undefined, lado: a.par && S.lado === "bi" ? "bi" : undefined };
    return PL.valorLinha(it, PACOTE);
  }
  function chipsHtml() {
    const a = S.sel && alvoDe(S.sel);
    if (!a) return `<p class="pl-chips__vazio">${ico("i-info")}${S.modo === "lista" ? "Escolha uma região na lista" : "Escolha uma região no desenho"} para ver os procedimentos.${MEDICO ? " O que você marcar entra como sugestão para a closer." : ""}</p>`;
    const ps = procsDoAlvo(a);
    const ladoTg = a.par ? `<div class="pilulas pl-pil pl-lado-tg" role="group" aria-label="Lados"><button type="button" class="pilula" aria-pressed="${S.lado === "bi"}" data-lado="bi">Os dois lados</button><button type="button" class="pilula" aria-pressed="${S.lado !== "bi"}" data-lado="um">Só o ${a.lado === "E" ? "esquerdo" : "direito"}</button></div>` : "";
    return `<div class="pl-chips__cab"><b>${esc(a.par && S.lado === "bi" ? a.nomePar : PAC.nomeAlvo(PACOTE, a.id))}</b>${a.beneficio ? `<span>${esc(a.beneficio)}</span>` : ""}${ladoTg}</div>
      <div class="pl-chips" role="group" aria-label="Procedimentos para ${esc(a.nome)}">${ps.map(p => {
        const ja = S.plano.itens.find(it => it.status !== "recusado" && it.proc === p.id && PAC.alvosDoItem(PACOTE, it).includes(a.id));
        const q = PAC.qtdPadrao(p, a.id), u = p.unidade === "U" ? ` · ${q} U` : "";
        return `<button type="button" class="pl-chip" data-add="${p.id}" aria-pressed="${!!ja}">${ja ? ico("i-check") : ico("i-mais")}${esc(p.nome)}<small>${esc(u)}${VER_RS && !p.aDefinir ? ` · R$ ${real(precoPrev(a, p))}` : ""}</small></button>`;
      }).join("") || `<span class="muted">Nenhum procedimento ativo na tabela para esta região.</span>`}</div>`;
  }

  /* ---------- painel do dente (odonto · ref. Zendenta) ---------- */
  function cruzFaces(a, inter) {
    const q = Number(String(a.fdi)[0]), esq = q === 1 || q === 4;   // à esquerda de quem olha: mesial à direita
    const cel = (f, cls) => `<button type="button" class="pl-face ${cls}" data-face-bt="${f}" aria-pressed="${S.faces.includes(f)}" ${inter ? "" : "disabled"} aria-label="${a.rotFace[f]}">${letraFace(a, f)}<small>${a.rotFace[f]}</small></button>`;
    return `<div class="pl-cruz" role="group" aria-label="Faces do dente ${a.fdi}">${cel("V", "pl-face--v")}${cel(esq ? "D" : "M", "pl-face--e")}${cel("O", "pl-face--o")}${cel(esq ? "M" : "D", "pl-face--d")}${cel("L", "pl-face--l")}</div>`;
  }
  function cartoesDente(ids) {
    const t = tot();
    const its = S.plano.itens.filter(it => it.status !== "recusado" && PAC.alvosDoItem(PACOTE, it).some(i => ids.includes(i)));
    if (!its.length) return `<p class="muted pl-dente__vazio">Nenhum item neste ${ids[0].startsWith("arcada") ? "arcada" : "dente"} no plano atual.</p>`;
    return `<ol class="pl-dtl">${its.map(it => {
      const p = procDe(it.proc), feito = it.status === "realizado";
      const [dd, mm] = (it.data || "").split("/");
      const st = feito ? `<span class="status status--ok">${ico("i-check")}Feito</span>` : it.status === "aceito" ? `<span class="status status--ok">Aceito · a agendar</span>` : `<span class="status status--${it.status === "em_aberto" ? "atencao" : "neutro"}">${ico("i-relogio")}Pendente</span>`;
      const mot = !feito && it.status !== "aceito" ? `<label class="pl-mot"><span>Motivo da pendência</span><select data-motivo="${it.uid}"><option value="">—</option>${MOTIVOS().map(m => `<option${it.motivo === m ? " selected" : ""}>${m}</option>`).join("")}</select></label>` : "";
      return `<li class="pl-dtl__c${feito ? " is-feito" : ""}" data-uid="${it.uid}"><div class="datahora"><div><span>Data</span><b>${it.data ? dd + "/" + mm : "—"}</b></div></div>
        <div class="pl-dtl__t"><b>${esc(p.nome)}</b><span>${esc([qtdTxt(it), nomeProf(S.plano.med)].filter(Boolean).join(" · "))}${VER_RS && !p.aDefinir ? ` · R$ ${real(valorUid(t, it.uid))}` : ""}</span>${st}${mot}</div></li>`;
    }).join("")}</ol>`;
  }
  function painelDente() {
    const a = S.sel && alvoDe(S.sel);
    const boca = alvoDe("boca");
    const bocaChips = boca ? `<div class="pl-dente__boca"><span class="pl-k">Boca toda</span><div class="pl-chips">${boca.procs.map(procDe).filter(p => p && p.ativo !== false && (S.clin === "clinico" ? !ESTETICO(p) : ESTETICO(p))).map(p => {
      const ja = S.plano.itens.find(it => it.status !== "recusado" && it.proc === p.id);
      return `<button type="button" class="pl-chip" data-add-boca="${p.id}" aria-pressed="${!!ja}">${ja ? ico("i-check") : ico("i-mais")}${esc(curto(p.id))}${VER_RS ? `<small> · R$ ${real(p.precoBase * (p.qtdPadrao || 1))}</small>` : ""}</button>`; }).join("")}</div></div>` : "";
    if (!a || a.tipo === "pacote") return `<div class="pl-dente__cab"><span class="pl-k">Dente</span><h3>Toque num dente</h3><p class="muted">O número FDI aparece aqui com o nome do dente. Nas restaurações, escolha as faces.</p></div>${bocaChips}`;
    const ps = procsDoAlvo(a), temFace = ps.some(p => p.porFace) && a.tipo === "dente";
    return `<div class="pl-dente__cab"><span class="pl-k">${a.tipo === "dente" ? "Dente selecionado" : "Arcada"}</span><h3>${esc(a.nome)}</h3></div>
      ${temFace ? `<div class="pl-dente__faces"><span class="pl-k">Faces <small>para restauração</small></span>${cruzFaces(a, true)}</div>` : ""}
      <div class="pl-dente__procs"><span class="pl-k">${S.clin === "clinico" ? "Clínico" : "Estético"}</span><div class="pl-chips">${ps.map(p => {
        const ja = S.plano.itens.find(it => it.status !== "recusado" && it.proc === p.id && it.alvo === a.id);
        return `<button type="button" class="pl-chip" data-add="${p.id}" aria-pressed="${!!ja}">${ja ? ico("i-check") : ico("i-mais")}${esc(curto(p.id))}${VER_RS && !p.aDefinir ? `<small> · R$ ${real(precoPrev(a, p))}</small>` : ""}</button>`;
      }).join("") || `<span class="muted">Sem procedimento ${S.clin === "clinico" ? "clínico" : "estético"} para este alvo. Troque em Clínico / Estético.</span>`}</div></div>
      <div class="pl-dente__tl"><span class="pl-k">Linha do tempo ${a.tipo === "dente" ? "do dente" : "da arcada"}</span>${cartoesDente([a.id])}</div>`;
  }

  /* ---------- lista (alternativa completa ao mapa) ---------- */
  function alvosLista() {
    const vale = a => a.vista !== "pele" && (!a.par || a.lado === "E");
    if (ODONTO()) {
      const grupos = [["arcada_sup", "Arcada superior", a => a.arcada === "arcada_sup" || a.id === "arcada_sup"], ["arcada_inf", "Arcada inferior", a => a.arcada === "arcada_inf" || a.id === "arcada_inf"], ["boca", "Boca toda", a => a.id === "boca"]];
      return grupos.map(([id, nome, f]) => ({ id, nome, alvos: PACOTE.alvos.filter(f) }));
    }
    const abaVistas = (PACOTE.abas.find(a => a.id === S.aba) || { vistas: [] }).vistas;
    return PACOTE.grupos.map(g => ({ id: g.id, nome: g.nome, alvos: PACOTE.alvos.filter(a => a.grupo === g.id && vale(a) && abaVistas.includes(a.vista)) })).filter(g => g.alvos.length);
  }
  function listaHtml() {
    const b = S.busca.trim().toLowerCase();
    const t = tot();
    const grupos = alvosLista().map(g => {
      const alvos = g.alvos.filter(a => !b || (a.nomePar || a.nome).toLowerCase().includes(b) || a.procs.some(p => (procDe(p) || { nome: "" }).nome.toLowerCase().includes(b)));
      if (!alvos.length) return "";
      const nIt = alvos.reduce((s, a) => s + S.plano.itens.filter(it => it.status !== "recusado" && (it.alvo === a.id || (a.par && it.alvo === a.par))).length, 0);
      const aberto = nIt > 0 || !!b || g === alvosLista()[0];
      return `<details class="pl-lg-grupo"${aberto ? " open" : ""}><summary><span>${esc(g.nome)}</span>${nIt ? `<span class="pilula__n">${nIt}</span>` : ""}${ico("i-pl-baixo")}</summary><ul class="pl-lg-lista">${alvos.map(a => {
        const its = S.plano.itens.filter(it => it.status !== "recusado" && (it.alvo === a.id || (a.par && it.alvo === a.par)));
        const nome = a.par ? a.nomePar : a.tipo === "dente" ? a.nome : a.nome;
        return `<li><button type="button" class="pl-lg-alvo${S.sel === a.id ? " is-sel" : ""}" data-alvo-lista="${a.id}"><span class="pl-lg-alvo__n">${esc(nome)}</span>${its.length ? `<span class="pl-lg-alvo__its">${its.map(it => `${esc(curtoEm(it.proc, nome))}${qtdTxt(it) ? " " + esc(qtdTxt(it)) : ""}${VER_RS ? ` · R$ ${real(valorUid(t, it.uid))}` : ""}`).join(" · ")}</span>` : `<span class="pl-lg-alvo__its muted">${esc(a.procs.slice(0, 3).map(x => curtoEm(x, nome)).join(", "))}</span>`}${ico("i-dir")}</button></li>`;
      }).join("")}</ul></details>`;
    }).join("");
    return `<div class="pl-listagem"><label class="pl-busca">${ico("i-busca")}<span class="sr">Buscar região ou procedimento</span><input type="search" id="pl-busca" placeholder="Buscar região ou procedimento" value="${esc(S.busca)}" aria-controls="pl-lg" autocomplete="off"></label>
      <div id="pl-lg">${grupos || `<p class="muted">Nada encontrado para “${esc(S.busca)}”.</p>`}</div></div>`;
  }
  // celular: chips de alvo acima da lista (rolagem horizontal)
  function alvosCel() {
    const vs = (PACOTE.abas.find(a => a.id === S.aba) || { vistas: [] }).vistas;
    let alvos = PACOTE.alvos.filter(a => vs.includes(a.vista) && (!a.par || a.lado === "E") && a.tipo !== "dente");
    if (ODONTO()) alvos = PACOTE.alvos.filter(a => a.tipo === "arcada" || a.id === "boca");
    return `<div class="pl-alvos-cel" role="group" aria-label="Regiões">${alvos.map(a => `<button type="button" class="pl-chip pl-chip--alvo" data-alvo-lista="${a.id}" aria-pressed="${S.plano.itens.some(it => it.status !== "recusado" && (it.alvo === a.id || it.alvo === a.par))}">${esc(a.par ? a.nomePar : a.nome)}</button>`).join("")}</div>`;
  }

  /* ---------- pele: quantidade por área ampla, sem mapa ---------- */
  function pele() {
    const t = tot();
    const areas = PACOTE.alvos.filter(a => a.vista === "pele");
    return `<div class="pl-pele"><p class="pl-pele__nota">${ico("i-info")}Só a quantidade por área ampla. Sem ponto, sem posição e sem foto: isso fica no prontuário.</p>
      <ul class="pl-pele__lista">${areas.map(a => {
        if (a.fixo) {
          const it = S.plano.itens.find(i => i.alvo === a.id && i.status !== "recusado");
          return `<li class="pl-pele__l"><div><b>Mapeamento corporal</b><span>${esc(a.nome)} · por sessão</span></div><div class="pl-pele__v">${it && VER_RS ? `R$ ${real(valorUid(t, it.uid))}` : ""}</div>
            <button type="button" class="bt-sec" data-pele-fixo="${a.id}" aria-pressed="${!!it}">${it ? ico("i-check") + "No plano" : ico("i-mais") + "Adicionar"}</button></li>`;
        }
        const it = S.plano.itens.find(i => i.alvo === a.id && i.proc === "remocao" && i.status !== "recusado");
        const n = it ? it.qtd : 0;
        const outros = a.procs.filter(p => p !== "remocao").map(procDe).filter(p => p && p.ativo !== false);
        return `<li class="pl-pele__l"><div><b>${esc(a.nome)}</b><span>${n ? `${n} ${n === 1 ? "lesão" : "lesões"}${n > 1 ? " · a partir da 2ª, valor adicional" : ""}` : "Remoção por lesão"}</span>
            ${outros.length ? `<div class="pl-chips pl-chips--min">${outros.map(p => { const ja = S.plano.itens.some(i => i.alvo === a.id && i.proc === p.id && i.status !== "recusado"); return `<button type="button" class="pl-chip" data-add-area="${a.id}|${p.id}" aria-pressed="${ja}">${ja ? ico("i-check") : ico("i-mais")}${esc(curto(p.id))}</button>`; }).join("")}</div>` : ""}</div>
          <div class="pl-pele__v">${n && VER_RS ? `R$ ${real(valorUid(t, it.uid))}` : ""}</div>
          <div class="pl-step" role="group" aria-label="Lesões em ${esc(a.nome)}"><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-pele="${a.id}" data-d="-1" aria-label="Menos uma" ${n ? "" : "disabled"}>${ico("i-pl-menos")}</button><output class="num">${n}</output><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-pele="${a.id}" data-d="1" aria-label="Mais uma">${ico("i-mais")}</button></div></li>`;
      }).join("")}</ul></div>`;
  }

  /* ---------- linha do tempo do plano (ref. 2) ---------- */
  function eventos(plano, opts) {
    opts = opts || {};
    const ev = [];
    plano.itens.forEach(it => {
      if (it.status === "recusado") return;
      const p = procDe(it.proc); if (!p) return;
      const nome = curto(it.proc), alvo = PAC.nomeAlvo(PACOTE, it);
      if (!it.data && it.status !== "aceito" && it.status !== "realizado") { ev.push({ d: null, nome, alvo, tipo: "sessao", feito: false, st: it.status, it }); return; }
      if (it.serie && it.serie.n > 1) PL.seriesDe(it.serie, it.data || HOJE).forEach((d, i) => ev.push({ d, nome: `${nome} ${i + 1}ª`, alvo, tipo: "sessao", feito: it.status === "realizado" && i === 0, st: it.status, it }));
      else if (it.sessao) ev.push({ d: it.data || HOJE, nome: `${nome} ${it.sessao.i}ª de ${it.sessao.n}`, alvo, tipo: "sessao", feito: it.status === "realizado", st: it.status, it });
      else ev.push({ d: it.data || HOJE, nome, alvo, tipo: "sessao", feito: it.status === "realizado", st: it.status, it });
    });
    PL.recallsDe(plano, { incluirPropostos: true }).forEach(r => ev.push({ d: r.data, nome: `${r.rot === "Recall" ? "Retorno" : cap(r.rot.toLowerCase())} · ${curto(r.proc)}`, tipo: "recall", st: "recall" }));
    const ord = e => e.d ? D.parse(e.d) + (e.d === HOJE ? 0 : 864e5) : D.parse(HOJE) + 1;
    return ev.filter(e => !opts.futuro || !e.d || D.diasEntre(HOJE, e.d) >= 0).sort((a, b) => ord(a) - ord(b));
  }
  function nos(plano, max) {
    const ev = eventos(plano), m = new Map();
    ev.forEach(e => {
      if (!e.d) { const n = m.get("agendar") || { k: "agendar", d: HOJE, dias: 0, agendar: true, ev: [] }; n.ev.push(e); m.set("agendar", n); return; }
      const dias = D.diasEntre(HOJE, e.d); const k = dias > 30 ? D.mesAno(e.d) : e.d; const n = m.get(k) || { k, d: e.d, dias, ev: [] }; n.ev.push(e); m.set(k, n);
    });
    const ordN = n => D.parse(n.d) + (n.agendar ? 1 : 0);
    let L = [...m.values()].sort((a, b) => ordN(a) - ordN(b));
    if (L.length > max) L = L.slice(0, max - 1).concat([{ k: "mais", d: L[max - 1].d, dias: L[max - 1].dias, ev: L.slice(max - 1).flatMap(x => x.ev), mais: true }]);
    return L;
  }
  // mesma grafia de data do orçamento e do resumo ("mar/27"); só o primeiro mês fala em dias
  // "Retorno · Bioestimulador" + "Retorno · Ultrassom" → "Retorno · Bioestimulador e Ultrassom"
  function juntaNomes(nomes) {
    const out = [], por = new Map();
    nomes.forEach(x => { const i = x.indexOf(" · "); if (i < 0) { out.push(x); return; } const k = x.slice(0, i); if (!por.has(k)) { por.set(k, []); out.push({ k }); } por.get(k).push(x.slice(i + 3)); });
    return out.map(o => typeof o === "string" ? o : `${o.k} · ${por.get(o.k).length > 1 ? por.get(o.k).slice(0, -1).join(", ") + " e " + por.get(o.k).slice(-1) : por.get(o.k)[0]}`);
  }
  const rotNo = n => n.agendar ? "A agendar" : n.mais ? "Depois" : n.dias === 0 ? "Hoje" : n.dias < 0 ? n.d.slice(0, 5) : n.dias === 1 ? "Amanhã" : n.dias <= 30 ? `Em ${n.dias} dias` : D.mesAno(n.d);
  function cartaoTempo() {
    const L = nos(S.plano, celular() ? 6 : 8);
    if (!L.length) return "";
    return `<section class="cartao pl-tempo" aria-labelledby="pl-t-tempo"><div class="cartao__cab"><h2 id="pl-t-tempo">Linha do tempo do plano <span class="cartao__sub">sessões e retornos que este plano cria</span></h2></div>
      <ol class="pl-tl">${L.map(n => {
        const feito = n.ev.every(e => e.feito), hoje = n.dias === 0 && !n.agendar, so = n.ev.every(e => e.tipo === "recall");
        const nomes = juntaNomes([...new Set(n.ev.map(e => e.nome))]);
        return `<li class="pl-tl__no${feito ? " is-feito" : ""}${hoje ? " is-hoje" : ""}${so ? " is-recall" : ""}"><span class="pl-tl__q">${esc(rotNo(n))}</span><span class="pl-tl__p" aria-hidden="true">${feito ? ico("i-check") : ""}</span>
          <span class="pl-tl__ev">${nomes.slice(0, 3).map(x => `<span>${esc(x)}</span>`).join("")}${nomes.length > 3 ? `<span class="muted">+${nomes.length - 3} ${nomes.length - 3 === 1 ? "item" : "itens"}</span>` : ""}</span></li>`;
      }).join("")}</ol>
</section>`;
  }

  /* =====================================================================
     6. LADO: orçamento + cartão do total + ações
     ===================================================================== */
  function cartaoOrc() {
    const t = tot();
    const grupos = PACOTE.grupos.map(g => ({ g, its: S.plano.itens.filter(it => (it.grupo || (alvoDe(it.alvo) || {}).grupo) === g.id) }));
    const soltos = S.plano.itens.filter(it => !PACOTE._grupo[it.grupo || (alvoDe(it.alvo) || {}).grupo]);
    if (soltos.length) grupos.push({ g: { id: "_", nome: "Outros" }, its: soltos });
    const sug = S.plano.itens.filter(it => it.sugerido && !MEDICO);
    const linha = it => {
      const p = procDe(it.proc), v = valorUid(t, it.uid), [stR, stC] = ST[it.status], r = it.status !== "recusado" ? voltaEm(it) : null;
      const nome = alvoDe(it.alvo) && alvoDe(it.alvo).tipo === "dente" ? alvoDe(it.alvo).nomeCurto : PAC.nomeAlvo(PACOTE, it);
      const subs = [`<span class="status status--${stC}">${it.status === "realizado" ? ico("i-check") : ""}${stR}</span>`];
      if (it.motivo && (it.status === "em_aberto" || it.status === "recusado")) subs.push(`<span>${esc(it.motivo)}</span>`);
      if (it.sessao) subs.push(`<span>${it.sessao.i}ª de ${it.sessao.n}</span>`); else if (it.serie && it.serie.n > 1) subs.push(`<span>série de ${it.serie.n}</span>`);
      if (r) subs.push(`<span>volta em ${r.mes}</span>`);
      if (it.combo) subs.push(`<span class="chip chip--borda">pacote</span>`);
      if (typeof it.valorFechado === "number") subs.push(`<span>preço do fechamento</span>`);
      if (it.lado === "bi") subs.push(`<span>dois lados</span>`);
      return `<li class="pl-lin${it.status === "recusado" ? " is-recusado" : ""}${it.sugerido ? " is-sug" : ""}" data-uid="${it.uid}">
        <div class="pl-lin__txt"><span class="pl-lin__l1"><b>${esc(nome)}</b> · ${esc(p ? p.nome : it.proc)}${qtdTxt(it) ? ` <span class="pl-lin__q">${esc(qtdTxt(it))}</span>` : ""}</span>
          <span class="pl-lin__sub">${subs.join("")}</span>
          ${it.sugerido ? `<span class="pl-lin__sug"><span class="pl-selo">sugerido por ${esc(medCurto(S.plano.med))}${!MEDICO ? " · fora do total" : ""}</span>${!MEDICO ? `<button type="button" class="bt-sec pl-bt-mini" data-aceitar="${it.uid}">Aceitar</button>` : ""}</span>` : ""}</div>
        ${VER_RS ? `<div class="pl-lin__v num">${p && p.aDefinir ? `<span class="muted">a definir</span>` : real(v)}</div>` : ""}
        <button type="button" class="bt-ico bt-ico--sm bt-ico--plano pl-lin__m" data-linha="${it.uid}" aria-haspopup="dialog" aria-label="Ajustar ${esc(nome)} · ${esc(p ? p.nome : "")}">${ico("i-pl-mais3")}</button></li>`;
    };
    const blocos = grupos.filter(x => x.its.length).map(({ g, its }) => {
      const sub = its.filter(i => i.status !== "recusado" && !i.sugerido).reduce((s, i) => s + valorUid(t, i.uid), 0);
      const tit = `<span>${esc(nomeGrupo(g))}</span>`;
      return `<div class="pl-grupo"><h3 class="pl-grupo__t">${tit}${VER_RS ? `<span class="num">${sub ? real(sub) : "—"}</span>` : ""}</h3><ul class="pl-linhas">${its.map(linha).join("")}</ul></div>`;
    }).join("");
    const pg = PAC.pagamento(PACOTE).pagamento, dm = PAC.pagamento(PACOTE).descMax, maxD = dm[PERFIL] != null ? dm[PERFIL] : dm.closer;
    const pct = (S.plano.desconto || {}).pct || 0, forma = (S.plano.pagamento || {}).forma || "cartao";
    const opDesc = [...new Set([0, 3, 5, 10, 15, pct])].sort((a, b) => a - b);
    const recs = PL.recallsDe(S.plano, { incluirPropostos: true }).filter(r => r.dias >= 0 && r.dias <= 400);
    const recsU = []; recs.forEach(r => { if (!recsU.some(x => x.procNome === r.procNome && x.alvoNome === r.alvoNome)) recsU.push(r); });
    // desconto e pagamento ficam fora da rolagem do orçamento (cartão próprio, logo acima do total)
    const cond = VER_RS ? `<section class="cartao pl-cond" aria-label="Desconto e pagamento"><div class="pl-rod">
      <div class="pl-rod__l"><span>Subtotal</span><b class="num">${real(t.subtotal)}</b></div>
      <div class="pl-rod__l"><label for="pl-desc">Desconto</label><span class="linha-flex"><select id="pl-desc">${opDesc.map(d => `<option value="${d}"${d === pct ? " selected" : ""}>${d}%${d > maxD ? " · pedir aprovação" : ""}</option>`).join("")}</select><b class="num">${t.desconto ? "−" + real(t.desconto) : "—"}</b></span></div>
      <div class="pl-rod__l pl-rod__pg"><span>Pagamento</span><span class="linha-flex"><span class="pilulas pl-pil" role="group" aria-label="Forma de pagamento"><button type="button" class="pilula" data-forma="pix" aria-pressed="${forma === "pix"}">Pix −${pg.pixDesc}%</button><button type="button" class="pilula" data-forma="cartao" aria-pressed="${forma === "cartao"}">Cartão</button></span>
        ${forma === "cartao" ? `<select id="pl-parc" aria-label="Parcelas">${Array.from({ length: pg.maxParcelas }, (_, i) => i + 1).map(n => `<option value="${n}"${n === t.parcelas ? " selected" : ""}>${n}×</option>`).join("")}</select>` : ""}</span></div>
      ${t.recorrenteMensal ? `<div class="pl-rod__l"><span>Recorrente previsto <small>informativo, fora da meta</small></span><b class="num">${real(t.recorrenteMensal)}/mês</b></div>` : ""}
    </div></section>` : "";
    const recAno = PL.recallsDe(S.plano, { incluirPropostos: true }).filter(r => r.dias >= 0 && r.dias <= 365).reduce((s, r) => s + r.valorPrevisto, 0);
    const rodape = VER_RS ? `<div class="pl-rod">
      ${recsU.length ? `<div class="pl-rod__rec"><span>Recall que este plano cria${recAno ? ` <em>R$ ${real(recAno)} previstos em 12 meses</em>` : ""}</span><ul>${recsU.slice(0, 4).map(r => `<li><span>${esc(curtoEm(r.proc, r.alvoNome))} · ${esc(r.alvoNome.toLowerCase())}</span><b>${r.mes}</b></li>`).join("")}</ul></div>` : ""}
    </div>` : `<p class="pl-med-nota">${ico("i-info")}Valores ocultos no modo médico. Os itens que você marcar entram como sugestão para a closer.</p>`;
    return `<section class="cartao pl-orc" id="pl-orc" aria-labelledby="pl-t-orc">
      <div class="cartao__cab"><h2 id="pl-t-orc">${MEDICO ? "Itens do plano" : "Orçamento"} <span class="cartao__sub">${vivos().length} ${vivos().length === 1 ? "item" : "itens"}</span></h2>
        ${celular() ? `<button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-fecha-orc aria-label="Fechar o orçamento">${ico("i-fechar")}</button>` : ""}</div>
      <div id="pl-sug-aviso">${sugAvisoHtml()}</div>
      ${sug.length ? `<div class="pl-sug-faixa">${ico("i-info")}<span><b>${sug.length}</b> ${sug.length === 1 ? "item sugerido" : "itens sugeridos"} por ${esc(medCurto(S.plano.med))}</span>${sug.length > 1 ? `<button type="button" class="bt-texto" data-aceitar="todos">Aceitar todos</button>` : ""}</div>` : ""}
      ${blocos || `<p class="pl-vazio">${ico("i-info")}Nenhum item ainda. Toque numa região do mapa ou use a lista.</p>`}
      ${rodape}
      <div class="pl-orc__mais" aria-hidden="true"><span>${ico("i-pl-baixo")}mais itens abaixo</span></div>
    </section>${cond}`;
  }
  // dica de rolagem do orçamento (desktop): aparece só quando há conteúdo escondido abaixo
  function dicaRolagem() {
    const o = $("#pl-orc"); if (!o) return;
    const f = () => o.classList.toggle("is-rola", o.scrollHeight - o.clientHeight - o.scrollTop > 8);
    f(); if (!o._dica) { o._dica = true; o.addEventListener("scroll", f, { passive: true }); }
  }
  let sugPendente = null;
  const sugAvisoHtml = () => sugPendente ? `<div class="pl-sug-aviso" role="status"><span class="pl-sug-aviso__pt" aria-hidden="true"></span><span><b>${esc(medCurto(sugPendente.med))}</b> sugeriu ${sugPendente.n} ${sugPendente.n === 1 ? "item" : "itens"}</span><button type="button" class="bt-sec pl-bt-mini" data-ver-sug>Ver</button></div>` : "";

  function cartaoTotal() {
    const t = tot(), pg = PAC.pagamento(PACOTE).pagamento;
    if (!VER_RS) {
      const sug = S.plano.itens.filter(i => i.sugerido).length, reg = new Set(vivos().map(i => i.alvo.replace(/_(e|d)$/, ""))).size;
      const nDentes = new Set(vivos().filter(i => (alvoDe(i.alvo) || {}).tipo === "dente").map(i => i.alvo)).size;
      const rotReg = ODONTO() ? `${nDentes} ${nDentes === 1 ? "dente" : "dentes"}` : `${reg} ${reg === 1 ? "região" : "regiões"}`;
      return `<section class="cartao cartao--foco pl-total"><span class="kpi__rot">Plano de ${esc(PAC_.nome.split(" ")[0])}</span>
        <div class="pl-total__v">${vivos().length}<small>${vivos().length === 1 ? "item" : "itens"}</small></div>
        <div class="pl-total__parc">${rotReg} · ${sug ? `${sug} ${sug === 1 ? "sugestão sua" : "sugestões suas"} para a closer` : "nenhuma sugestão sua ainda"}</div></section>`;
    }
    // a trinca soma o total: o que conta nele, por status (sugestão não aceita fica fora)
    const pS = { aceito: 0, proposto: 0, em_aberto: 0 };
    S.plano.itens.forEach(i => { if (i.status === "recusado" || i.sugerido) return; const k = i.status === "realizado" ? "aceito" : i.status; if (k in pS) pS[k] += valorUid(t, i.uid); });
    // com o mesmo % de desconto do plano, para a trinca fechar com o total do cartão
    const fator = t.subtotal ? t.total / t.subtotal : 1;
    const mil = v => v ? `<small>R$</small>${milTxt(v * fator)}<small>mil</small>` : `<span class="pl-total__nada">—</span>`;
    const forma = (S.plano.pagamento || {}).forma || "cartao";
    const parc = forma === "pix" ? `à vista no Pix <b>R$ ${real(t.aVista)}</b> <small>(−${pg.pixDesc}%)</small>` : `<b>${t.parcelas}× R$ ${cent(t.parcela)}</b> sem juros`;
    return `<section class="cartao cartao--foco pl-total" aria-labelledby="pl-t-total">
      <span class="kpi__rot" id="pl-t-total">Total do plano</span>
      <div class="pl-total__v"><small>R$</small><span id="pl-tv" data-v="${t.total}">${real(t.total)}</span></div>
      <div class="pl-total__parc">${parc}</div>
      <div class="pl-total__x">
        <div><span>Aceito</span><b>${mil(pS.aceito)}</b></div>
        <div><span>Proposto</span><b>${mil(pS.proposto)}</b></div>
        <div><span>Em aberto</span><b>${mil(pS.em_aberto)}</b></div>
      </div>
      <p class="sr" aria-live="polite" id="pl-vivo"></p>
    </section>`;
  }
  function acoesHtml() {
    const t = tot(), dm = PAC.pagamento(PACOTE).descMax, maxD = dm[PERFIL] != null ? dm[PERFIL] : dm.closer;
    const pede = ((S.plano.desconto || {}).pct || 0) > maxD;
    if (MEDICO) return `<div class="pl-acoes"><button type="button" class="bt-sec" data-apres>${ico("i-pl-olho")}Mostrar à paciente</button>
      <button type="button" class="bt-principal" id="pl-enviar" ${S.plano.itens.some(i => i.sugerido) ? "" : `disabled aria-describedby="pl-enviar-dica"`}>${ico("i-pl-enviar")}Enviar para a closer</button>
      ${S.plano.itens.some(i => i.sugerido) ? "" : `<p class="pl-acoes__dica" id="pl-enviar-dica">Nenhuma sugestão ainda · toque ${ODONTO() ? "num dente" : "numa região"} para sugerir.</p>`}</div>`;
    return `<div class="pl-acoes"><button type="button" class="bt-sec" data-apres>${ico("i-pl-olho")}Mostrar à paciente</button>
      <button type="button" class="bt-sec pl-bt-wa" data-resumo>${ico("i-whats")}Enviar resumo</button>
      <button type="button" class="bt-principal" id="pl-fechar" ${t.total || S.plano.itens.length ? "" : "disabled"}>${pede ? `${ico("i-sino")}Pedir aprovação à Gestão` : `${ico("i-check")}Fechar plano`}</button></div>`;
  }

  /* =====================================================================
     7. RENDER
     ===================================================================== */
  let totalAnt = null;
  function renderTudo() {
    topo();
    coluna.innerHTML = cartaoMapa() + cartaoTempo();
    lado.innerHTML = cartaoOrc() + cartaoTotal() + acoesHtml();
    barraCel();
    requestAnimationFrame(dicaRolagem);
    requestAnimationFrame(montaDesenho);
    contaTotal();
    poeTopo();
  }
  // altura útil da coluna direita (fixa ao rolar): o total e "Fechar plano" ficam sempre à vista
  function poeTopo() { const t = lado.getBoundingClientRect().top + scrollY; if (t > 0) lado.style.setProperty("--pl-top", Math.min(t, 260) + "px"); }
  // re-render parcial (mantém o desenho; só pinta estado, rótulos e painéis)
  function render() {
    const foco = doc.activeElement && doc.activeElement.closest("[data-alvo]") ? doc.activeElement.dataset.alvo : null;
    const focoSel = doc.activeElement && doc.activeElement.id;
    const temArea = !!$("#pl-area");
    const precisaMapa = S.modo === "mapa" || (celular() && S.mapaCel);
    if (!temArea && precisaMapa && S.aba !== "pele") return renderTudo();
    topo();
    // abas (contagem), chips, lista, painel do dente, pele
    const abas = $(".pl-abas"); if (abas) abas.outerHTML = abasHtml();
    const ch = $("#pl-chips"); if (ch) ch.innerHTML = chipsHtml();
    const dn = $("#pl-dente"); if (dn) dn.innerHTML = painelDente();
    const lg = $("#pl-lg"); if (lg) { const tmp = doc.createElement("div"); tmp.innerHTML = listaHtml(); lg.replaceWith($("#pl-lg", tmp)); }
    const pe = $(".pl-pele"); if (pe) pe.outerHTML = pele();
    const ac = $(".pl-alvos-cel"); if (ac) ac.outerHTML = alvosCel();
    const tp = $(".pl-tempo"); const novoT = cartaoTempo();
    if (tp) { if (novoT) tp.outerHTML = novoT; else tp.remove(); } else if (novoT) coluna.insertAdjacentHTML("beforeend", novoT);
    lado.innerHTML = cartaoOrc() + cartaoTotal() + acoesHtml();
    barraCel();
    requestAnimationFrame(dicaRolagem);
    atualizaMapa();
    contaTotal();
    if (foco) { const el = $(`#pl-des [data-alvo="${foco}"]`); if (el) el.focus({ preventScroll: true }); }
    else if (focoSel && $("#" + focoSel)) $("#" + focoSel).focus({ preventScroll: true });
  }
  function contaTotal() {
    const el = $("#pl-tv"); if (!el) return;
    const v = Number(el.dataset.v), t = tot();
    const vivo = $("#pl-vivo"); if (vivo && totalAnt != null && totalAnt !== v) vivo.textContent = `Total atualizado: ${real(v)} reais${t.parcelas > 1 ? `, ${t.parcelas} vezes de ${real(t.parcela)}` : ""}`;
    if (totalAnt != null && totalAnt !== v && !REDUZ) {
      const de = totalAnt, t0 = performance.now();
      const passo = now => { const p = Math.min(1, (now - t0) / 400), e = 1 - Math.pow(1 - p, 3); el.textContent = real(de + (v - de) * e); if (p < 1) requestAnimationFrame(passo); };
      requestAnimationFrame(passo);
    }
    totalAnt = v;
    const b = $("#pl-barra-v"); if (b) b.innerHTML = VER_RS ? `<small>R$</small>${real(v)}` : `${vivos().length}<small> itens</small>`;
  }
  function flash(uid) {
    const li = $(`.pl-lin[data-uid="${uid}"]`); if (!li) return;
    anima(li, [{ backgroundColor: "var(--suave-2)", opacity: .4, transform: "translateY(-4px)" }, { backgroundColor: "var(--suave-2)", opacity: 1, transform: "none", offset: .35 }, { backgroundColor: "transparent" }], { duration: 820, easing: EASE });
    if (!celular()) li.scrollIntoView({ block: "nearest", behavior: REDUZ ? "auto" : "smooth" });
  }

  /* ---------- celular: barra de total fixa + orçamento em gaveta ---------- */
  function barraCel() {
    let b = $("#pl-barra");
    if (!celular()) { if (b) b.remove(); body.classList.remove("pl-orc-aberto"); return; }
    const t = tot();
    if (!b) { b = doc.createElement("button"); b.type = "button"; b.id = "pl-barra"; b.className = "pl-barra"; body.appendChild(b); b.addEventListener("click", () => abreOrc(!body.classList.contains("pl-orc-aberto"))); }
    b.setAttribute("aria-expanded", String(body.classList.contains("pl-orc-aberto")));
    b.innerHTML = `<span class="pl-barra__v" id="pl-barra-v">${VER_RS ? `<small>R$</small>${real(t.total)}` : `${vivos().length}<small> itens</small>`}</span><span class="pl-barra__p">${VER_RS ? (t.parcelas > 1 ? `${t.parcelas}× R$ ${cent(t.parcela)}` : "à vista") : "sugestões para a closer"}</span><span class="pl-barra__a">${body.classList.contains("pl-orc-aberto") ? "Fechar" : MEDICO ? "Itens" : "Orçamento"}${ico(body.classList.contains("pl-orc-aberto") ? "i-pl-baixo" : "i-pl-cima")}</span>`;
  }
  // gaveta do orçamento (celular): o que fica atrás dela sai do foco e da leitura (inert)
  // (a barra do total continua ativa: com a gaveta aberta ela é o botão "Fechar" e entra no laço de foco)
  const atrasDaGaveta = () => [$(".trilho"), $("#pl-app .topo"), coluna].filter(Boolean);
  function abreOrc(on) {
    body.classList.toggle("pl-orc-aberto", on);
    veu.hidden = !on; veu.classList.toggle("pl-veu--orc", on);
    barraCel();
    atrasDaGaveta().forEach(x => { if (on) x.setAttribute("inert", ""); else x.removeAttribute("inert"); });
    if (on) { lado.setAttribute("role", "dialog"); lado.setAttribute("aria-modal", "true"); } else { lado.removeAttribute("role"); lado.removeAttribute("aria-modal"); }
    if (on) { lado.scrollTop = 0; anima(lado, [{ transform: "translateY(40px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 280, easing: EASE }); const f = $("[data-fecha-orc]", lado); if (f) f.focus({ preventScroll: true }); }
    else { const b = $("#pl-barra"); if (b) b.focus({ preventScroll: true }); }
  }
  veu.addEventListener("click", () => { if (body.classList.contains("pl-orc-aberto")) abreOrc(false); });
  doc.addEventListener("keydown", e => {
    if (!body.classList.contains("pl-orc-aberto") || aberta) return;
    if (e.key === "Escape") { abreOrc(false); return; }
    if (e.key === "Tab") {   // mesmo laço de foco da camada, dentro da gaveta
      const f = focaveis(lado).concat($("#pl-barra") ? [$("#pl-barra")] : []); if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (!f.includes(doc.activeElement)) { e.preventDefault(); a.focus(); }
      else if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  /* =====================================================================
     8. AÇÕES
     ===================================================================== */
  function adiciona(alvoId, procId, o) {
    o = o || {};
    const p = procDe(procId); let a = alvoDe(alvoId); if (!p || !a) return null;
    if (p.alvoFixo && p.alvoFixo !== alvoId) { alvoId = p.alvoFixo; a = alvoDe(alvoId); }
    const opt = { origem: MEDICO ? "medico" : "closer", status: "proposto" };
    if (a.par && S.lado === "bi") opt.lado = "bi";
    if (p.porFace) opt.faces = S.faces.length ? S.faces.slice() : ["O"];
    if (ODONTO()) opt.grupo = faseDe(p);
    if (o.qtd != null) opt.qtd = o.qtd;
    let it;
    try { it = PL.novaLinha(PACOTE, alvoId, procId, opt); } catch (e) { return null; }
    if (MEDICO) it.sugerido = true;
    S.plano.itens.push(it); S.ultimo = it.uid; minutos++;
    salva(); render(); flash(it.uid);
    const v = valorUid(tot(), it.uid);
    if (!celular() && !REDUZ) setTimeout(() => { const b = $(`[data-linha="${it.uid}"]`); if (b && !aberta) abreLinha(it.uid, b, true); }, 260);
    if (celular()) aviso(`${esc(curto(procId))} · ${esc(PAC.nomeAlvo(PACOTE, it))}${VER_RS ? ` · R$ ${real(v)}` : ""} no plano`);
    return it;
  }
  function itemDe(uid) { return S.plano.itens.find(i => i.uid === uid); }
  function mudaQtd(it, d) {
    const p = procDe(it.proc), u = PAC.UNIDADES[p.unidade] || { passo: 1 };
    it.qtd = PL.normalizaQtd(p, it.qtd + d * (u.passo || 1), it);
    delete it.valorFechado;
  }
  function abreLinha(uid, bt, rapido) {
    const it = itemDe(uid); if (!it) return;
    const p = procDe(it.proc), a = alvoDe(it.alvo), t = tot();
    const u = PAC.UNIDADES[p.unidade] || {}, fixo = p.unidade === "dente" || p.unidade === "pacote" || p.porFace;
    const r = voltaEm(it);
    const html = `<div class="pl-pop">
      <div class="pl-pop__cab"><b>${esc(a.tipo === "dente" ? a.nome : PAC.nomeAlvo(PACOTE, it))}</b><span>${esc(p.nome)}</span></div>
      ${!fixo ? `<div class="pl-pop__l"><span>Quantidade</span><div class="pl-step" role="group" aria-label="Quantidade"><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-qtd="-1" aria-label="Menos">${ico("i-pl-menos")}</button><output class="num">${esc(qtdTxt(it))}</output><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-qtd="1" aria-label="Mais">${ico("i-mais")}</button></div></div>` : ""}
      ${p.porFace && a.tipo === "dente" ? `<div class="pl-pop__l pl-pop__l--col"><span>Faces · ${esc(qtdTxt(it))}</span>${(() => { const ant = S.faces; S.faces = it.faces || []; const h = cruzFaces(a, true).replace(/data-face-bt=/g, "data-face-it="); S.faces = ant; return h; })()}</div>` : ""}
      ${a.par ? `<div class="pl-pop__l"><span>Lados</span><div class="pilulas pl-pil" role="group" aria-label="Lados"><button type="button" class="pilula" data-it-lado="bi" aria-pressed="${it.lado === "bi"}">Os dois</button><button type="button" class="pilula" data-it-lado="um" aria-pressed="${it.lado !== "bi"}">Só um</button></div></div>` : ""}
      ${VER_RS ? `<div class="pl-pop__l"><span>Valor</span><b class="num">${p.aDefinir ? "a definir pelo dentista" : "R$ " + real(valorUid(t, it.uid))}</b></div>` : ""}
      ${r ? `<div class="pl-pop__l"><span>Recall</span><span>volta em ${r.mes}</span></div>` : ""}
      ${rapido ? "" : `<div class="pl-pop__l pl-pop__l--col"><span>Status comercial</span><div class="pl-seg" role="radiogroup" aria-label="Status">${["proposto", "aceito", "em_aberto", "recusado"].map(s => `<button type="button" role="radio" aria-checked="${it.status === s}" data-st="${s}">${ST[s][0]}</button>`).join("")}</div>
        ${it.status === "em_aberto" || it.status === "recusado" ? `<label class="pl-mot"><span>Motivo</span><select data-motivo="${it.uid}"><option value="">—</option>${MOTIVOS().map(m => `<option${it.motivo === m ? " selected" : ""}>${m}</option>`).join("")}</select></label>` : ""}</div>`}
      <div class="pl-pop__pe">${rapido ? `<button type="button" class="bt-texto" data-mais-opcoes>Status e motivo</button>` : `<button type="button" class="bt-texto pl-remover" data-remover>Remover</button>`}<button type="button" class="bt-sec" data-ok>Pronto</button></div>
    </div>`;
    abreCamada(html, { tipo: "pop", bt, rotulo: `Ajustar ${p.nome}`, foco: rapido ? "[data-qtd='1'], [data-ok]" : null });
    camada.dataset.uid = uid;
  }
  camada.addEventListener("click", e => {
    const uid = camada.dataset.uid, it = uid && itemDe(uid); if (!it) return;
    const t = e.target.closest("button"); if (!t) return;
    const bt = aberta && aberta.bt;
    const reabre = rapido => { render(); const nb = $(`[data-linha="${uid}"]`); if (nb) abreLinha(uid, nb, rapido); };
    if (t.dataset.qtd) { mudaQtd(it, Number(t.dataset.qtd)); salva(); reabre(true); const b = $(`[data-qtd="${t.dataset.qtd}"]`, camada); if (b) b.focus(); }
    else if (t.dataset.faceIt) { const f = t.dataset.faceIt, fs = new Set(it.faces || []); fs.has(f) ? fs.delete(f) : fs.add(f); if (!fs.size) fs.add(f); it.faces = [...fs]; it.qtd = it.faces.length; S.faces = it.faces.slice(); salva(); reabre(true); }
    else if (t.dataset.itLado) { const a = alvoDe(it.alvo); if (t.dataset.itLado === "bi" && a.par) it.lado = "bi"; else delete it.lado; salva(); reabre(true); }
    else if (t.dataset.st) { it.status = t.dataset.st; if (it.status === "aceito" || it.status === "proposto") delete it.motivo; if (it.status === "aceito") { it.sugerido = false; if (!it.data) it.data = HOJE; } salva(); reabre(false); }
    else if ("maisOpcoes" in t.dataset) reabre(false);
    else if ("remover" in t.dataset) { S.plano.itens = S.plano.itens.filter(i => i.uid !== uid); fechaCamada(true); salva(); render(); aviso("Item removido do plano"); }
    else if ("ok" in t.dataset) { fechaCamada(true); const nb = $(`[data-linha="${uid}"]`); if (nb) nb.focus(); else if (bt) bt.focus(); }
  });
  camada.addEventListener("change", e => {
    const s = e.target.closest("[data-motivo]"); if (!s) return;
    const it = itemDe(s.dataset.motivo); if (!it) return;
    it.motivo = s.value || undefined; if (!it.motivo) delete it.motivo;
    salva(); render();
  });

  function seleciona(id, origem) {
    let a = alvoDe(id); if (!a) return;
    if (ODONTO() && S.escopo === "arcada" && a.arcada) { id = a.arcada; a = alvoDe(id); }
    S.sel = id;
    // faces: começa pelas do item de restauração do dente (se houver)
    const rest = S.plano.itens.find(it => it.alvo === id && procDe(it.proc) && procDe(it.proc).porFace && it.status !== "recusado");
    S.faces = rest ? (rest.faces || []).slice() : [];
    if (a.vista && a.vista !== S.vista && (PACOTE.abas.find(x => x.vista === a.vista) || PACOTE.abas.some(x => x.vistas.includes(a.vista)))) {
      const ab = PACOTE.abas.find(x => x.vistas.includes(a.vista));
      if (ab && origem === "lista" && !celular()) { S.aba = ab.id; S.vista = a.vista; S.modo = "mapa"; renderTudo(); return; }
    }
    const ae = doc.activeElement;
    folhaVolta = ae && ae.closest("[data-alvo-lista]") ? (ae.closest(".pl-alvos-cel") ? `.pl-alvos-cel [data-alvo-lista="${id}"]` : `#pl-lg [data-alvo-lista="${id}"]`)
      : ae && ae.closest("#pl-des [data-alvo]") ? `#pl-des [data-alvo="${ae.closest("[data-alvo]").dataset.alvo}"]` : null;
    render();
    if (celular()) abreFolha(id);
  }

  /* ---------- folha inferior do alvo (celular) ---------- */
  let folhaProc = null, folhaQtd = 1, folhaVolta = null;
  function abreFolha(id, procId) {
    const a = alvoDe(id); if (!a) return;
    const ps = procsDoAlvo(a); if (!ps.length && a.tipo !== "dente") return;
    folhaProc = procId || (folhaProc && ps.some(p => p.id === folhaProc) ? folhaProc : (ps[0] && ps[0].id));
    const p = procDe(folhaProc);
    if (!procId) folhaQtd = p ? PAC.qtdPadrao(p, a.id) : 1;
    const it = p ? { alvo: a.id, proc: p.id, qtd: folhaQtd, faces: p.porFace ? (S.faces.length ? S.faces : ["O"]) : undefined, lado: a.par && S.lado === "bi" ? "bi" : undefined } : null;
    const v = it ? PL.valorLinha(it, PACOTE) : 0, r = it ? voltaEm(it) : null;
    const fixo = !p || p.unidade === "dente" || p.unidade === "pacote" || p.porFace;
    const html = `<div class="pl-folha">
      <div class="pl-folha__cab"><div><span class="pl-k">${a.tipo === "dente" ? "Dente" : a.tipo === "arcada" ? "Arcada" : "Região"}</span><h3>${esc(a.par && S.lado === "bi" ? a.nomePar : a.tipo === "dente" ? a.nome : PAC.nomeAlvo(PACOTE, a.id))}</h3></div><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-fecha-folha aria-label="Fechar">${ico("i-fechar")}</button></div>
      ${a.par ? `<div class="pilulas pl-pil" role="group" aria-label="Lados"><button type="button" class="pilula" aria-pressed="${S.lado === "bi"}" data-lado="bi">Os dois lados</button><button type="button" class="pilula" aria-pressed="${S.lado !== "bi"}" data-lado="um">Só o ${a.lado === "E" ? "esquerdo" : "direito"}</button></div>` : ""}
      <div class="pl-chips pl-chips--folha" role="radiogroup" aria-label="Procedimento">${ps.map(x => `<button type="button" class="pl-chip" role="radio" aria-checked="${x.id === folhaProc}" data-folha-proc="${x.id}">${esc(curto(x.id))}</button>`).join("") || `<span class="muted">Troque em Clínico / Estético para ver outros procedimentos.</span>`}</div>
      ${p && p.porFace && a.tipo === "dente" ? cruzFaces(a, true) : ""}
      ${p && !fixo ? `<div class="pl-step pl-step--lg" role="group" aria-label="Quantidade"><button type="button" class="bt-ico bt-ico--plano" data-folha-q="-1" aria-label="Menos">${ico("i-pl-menos", "ico")}</button><output class="num">${esc(qtdTxt(Object.assign({ qtd: PL.normalizaQtd(p, folhaQtd, it) }, it)))}</output><button type="button" class="bt-ico bt-ico--plano" data-folha-q="1" aria-label="Mais">${ico("i-mais", "ico")}</button></div>` : ""}
      ${p ? `<p class="pl-folha__v">${VER_RS ? (p.aDefinir ? "Valor a definir pelo dentista" : `<b>R$ ${real(v)}</b>`) : ""}${r ? `${VER_RS ? " · " : ""}volta em ${r.mes}` : ""}</p>` : ""}
      ${a.tipo === "dente" ? `<div class="pl-dente__tl">${cartoesDente([a.id])}</div>` : ""}
      ${p ? `<button type="button" class="bt-principal pl-folha__ok" data-folha-add>${MEDICO ? "Sugerir à closer" : "Adicionar ao plano"}</button>` : ""}
    </div>`;
    abreCamada(html, { tipo: "folha", rotulo: `Procedimentos · ${a.nome}`, cls: "pl-camada--folha-alvo", volta: folhaVolta });
    camada.dataset.alvo = id; delete camada.dataset.uid;
  }
  camada.addEventListener("click", e => {
    const id = camada.dataset.alvo; if (!id || camada.dataset.uid) return;
    const t = e.target.closest("button"); if (!t) return;
    if ("fechaFolha" in t.dataset) fechaCamada();
    else if (t.dataset.folhaProc) abreFolha(id, t.dataset.folhaProc === folhaProc ? folhaProc : (folhaQtd = PAC.qtdPadrao(procDe(t.dataset.folhaProc), id), t.dataset.folhaProc));
    else if (t.dataset.folhaQ) { const p = procDe(folhaProc), u = PAC.UNIDADES[p.unidade] || { passo: 1 }; folhaQtd = PL.normalizaQtd(p, folhaQtd + Number(t.dataset.folhaQ) * (u.passo || 1)); abreFolha(id, folhaProc); const b = $(`[data-folha-q="${t.dataset.folhaQ}"]`, camada); if (b) b.focus(); }
    else if (t.dataset.lado) { S.lado = t.dataset.lado === "bi" ? "bi" : "um"; abreFolha(id, folhaProc); }
    else if (t.dataset.faceBt) { togFace(t.dataset.faceBt); abreFolha(id, folhaProc); }
    else if ("folhaAdd" in t.dataset) { const p = folhaProc; fechaCamada(true); adiciona(id, p, { qtd: folhaQtd }); }
  });
  camada.addEventListener("change", e => { const s = e.target.closest("[data-motivo]"); if (s && camada.dataset.alvo) { const it = itemDe(s.dataset.motivo); if (it) { it.motivo = s.value || undefined; if (it.motivo && it.status === "proposto") it.status = "em_aberto"; salva(); render(); } } });
  function togFace(f) {
    const fs = new Set(S.faces); fs.has(f) ? fs.delete(f) : fs.add(f); S.faces = [...fs];
    // se já há restauração neste dente, ajusta as faces do item
    const it = S.plano.itens.find(i => i.alvo === S.sel && procDe(i.proc) && procDe(i.proc).porFace && i.status !== "realizado" && i.status !== "recusado");
    if (it && S.faces.length) { it.faces = S.faces.slice(); it.qtd = it.faces.length; salva(); }
  }

  /* ---------- delegação na página ---------- */
  doc.addEventListener("click", e => {
    if (camada.contains(e.target)) return;
    const t = e.target;
    const ab = t.closest("button[data-aba]"); if (ab) { poeAba(ab.dataset.aba); S.sel = null; renderTudo(); return; }
    const md = t.closest("button[data-modo]"); if (md) { S.modo = md.dataset.modo; renderTudo(); return; }
    const vs = t.closest("button[data-vista]"); if (vs) { S.vista = vs.dataset.vista; renderTudo(); return; }
    const ms = t.closest("button[data-masc]"); if (ms) { S.masc = ms.dataset.masc === "1"; renderTudo(); return; }
    const cl = t.closest("button[data-clin]"); if (cl) { S.clin = cl.dataset.clin; $$("button[data-clin]").forEach(b => b.setAttribute("aria-selected", String(b === cl))); render(); return; }
    const es = t.closest("button[data-escopo]"); if (es) { S.escopo = es.dataset.escopo; S.sel = null; renderTudo(); return; }
    const arc = t.closest("button[data-arc]"); if (arc) { S.arc = arc.dataset.arc; renderTudo(); return; }
    const mt = t.closest("#pl-mapa-tg"); if (mt) { S.mapaCel = !S.mapaCel; renderTudo(); return; }
    const ld = t.closest(".pl-lado-tg [data-lado]"); if (ld) { S.lado = ld.dataset.lado === "bi" ? "bi" : "um"; render(); return; }
    let alvoEl = t.closest("#pl-des [data-alvo]");
    // odontograma no celular: toque no espaço entre os dentes vai para o dente mais próximo (até 26px),
    // o que amplia a área útil dos incisivos inferiores sem sobrepor alvos; a folha confirma o dente escolhido
    if (!alvoEl && ODONTO() && celular() && t.closest("#pl-des svg")) {
      let melhor = null, dm = 26;
      $$("#pl-des .pl-dente[data-alvo]").forEach(d => { const r = d.getBoundingClientRect(); if (!r.width) return; const dd = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); if (dd < dm) { dm = dd; melhor = d; } });
      alvoEl = melhor;
    }
    if (alvoEl) {
      const face = t.closest("[data-face]");
      if (face && ODONTO() && S.escopo === "dente" && S.sel === alvoEl.dataset.alvo && !celular()) { togFace(face.dataset.face); render(); return; }
      seleciona(alvoEl.dataset.alvo, "mapa"); return;
    }
    const al = t.closest("[data-alvo-lista]"); if (al) { seleciona(al.dataset.alvoLista, "lista"); return; }
    const add = t.closest("[data-add]");
    if (add) {
      const ja = add.getAttribute("aria-pressed") === "true" && S.plano.itens.find(it => it.status !== "recusado" && it.proc === add.dataset.add && PAC.alvosDoItem(PACOTE, it).includes(S.sel));
      if (ja && !procDe(add.dataset.add).porFace) { abreLinha(ja.uid, $(`[data-linha="${ja.uid}"]`) || add); return; }
      adiciona(S.sel, add.dataset.add); return;
    }
    const ab2 = t.closest("[data-add-boca]"); if (ab2) { const ja = S.plano.itens.find(it => it.status !== "recusado" && it.proc === ab2.dataset.addBoca); if (ja) abreLinha(ja.uid, $(`[data-linha="${ja.uid}"]`) || ab2); else adiciona("boca", ab2.dataset.addBoca); return; }
    const aa = t.closest("[data-add-area]"); if (aa) { const [al2, pr] = aa.dataset.addArea.split("|"); const ja = S.plano.itens.find(i => i.alvo === al2 && i.proc === pr && i.status !== "recusado"); if (ja) abreLinha(ja.uid, $(`[data-linha="${ja.uid}"]`) || aa); else adiciona(al2, pr); return; }
    const pl = t.closest("[data-pele]");
    if (pl) {
      const id = pl.dataset.pele, d = Number(pl.dataset.d);
      const it = S.plano.itens.find(i => i.alvo === id && i.proc === "remocao" && i.status !== "recusado");
      if (!it && d > 0) { adiciona(id, "remocao", { qtd: 1 }); return; }
      if (it) { it.qtd += d; if (it.qtd <= 0) S.plano.itens = S.plano.itens.filter(i => i !== it); salva(); render(); const nb = $(`[data-pele="${id}"][data-d="${d}"]`); if (nb && !nb.disabled) nb.focus(); }
      return;
    }
    const pf = t.closest("[data-pele-fixo]"); if (pf) { const it = S.plano.itens.find(i => i.alvo === pf.dataset.peleFixo && i.status !== "recusado"); if (it) { S.plano.itens = S.plano.itens.filter(i => i !== it); salva(); render(); } else adiciona(pf.dataset.peleFixo, "mapa"); return; }
    const fb = t.closest("[data-face-bt]"); if (fb) { togFace(fb.dataset.faceBt); render(); return; }
    const lm = t.closest("[data-linha]"); if (lm) { abreLinha(lm.dataset.linha, lm); return; }
    const ac = t.closest("[data-aceitar]");
    if (ac) {
      const alvo = ac.dataset.aceitar === "todos" ? S.plano.itens.filter(i => i.sugerido) : [itemDe(ac.dataset.aceitar)].filter(Boolean);
      alvo.forEach(i => { i.sugerido = false; i.origem = "medico"; i.status = i.status === "recusado" ? "proposto" : i.status; });
      salva(); render(); aviso(`${alvo.length} ${alvo.length === 1 ? "sugestão aceita" : "sugestões aceitas"} no orçamento`); return;
    }
    if (t.closest("[data-ver-sug]")) { recarregaDeFora(); return; }
    if (t.closest("#pl-combos")) { menuCombos(t.closest("#pl-combos")); return; }
    const pg = t.closest("[data-forma]"); if (pg) { S.plano.pagamento = Object.assign({}, S.plano.pagamento, { forma: pg.dataset.forma }); if (pg.dataset.forma === "cartao" && !S.plano.pagamento.parcelas) S.plano.pagamento.parcelas = PAC.pagamento(PACOTE).pagamento.maxParcelas; salva(); render(); return; }
    if (t.closest("[data-apres]")) { apresentacao(); return; }
    if (t.closest("[data-resumo]")) { enviaResumo(); return; }
    if (t.closest("#pl-fechar")) { fechar(); return; }
    if (t.closest("#pl-enviar")) { enviaCloser(); return; }
    if (t.closest("[data-fecha-orc]")) { abreOrc(false); return; }
  });
  doc.addEventListener("change", e => {
    if (camada.contains(e.target)) return;
    const t = e.target;
    if (t.id === "pl-desc") { S.plano.desconto = { pct: Number(t.value), aprovado: Number(t.value) <= (PAC.pagamento(PACOTE).descMax[PERFIL] != null ? PAC.pagamento(PACOTE).descMax[PERFIL] : PAC.pagamento(PACOTE).descMax.closer) }; salva(); render(); }
    else if (t.id === "pl-parc") { S.plano.pagamento = Object.assign({}, S.plano.pagamento, { parcelas: Number(t.value) }); salva(); render(); }
    else if (t.dataset.titulo) { S.plano.titulos = Object.assign({}, S.plano.titulos, { [t.dataset.titulo]: t.value }); salva(); render(); }
    else if (t.dataset.motivo) { const it = itemDe(t.dataset.motivo); if (it) { it.motivo = t.value || undefined; if (!it.motivo) delete it.motivo; else if (it.status === "proposto") it.status = "em_aberto"; salva(); render(); } }
  });
  doc.addEventListener("input", e => {
    if (e.target.id !== "pl-busca") return;
    S.busca = e.target.value;
    const lg = $("#pl-lg"); const tmp = doc.createElement("div"); tmp.innerHTML = listaHtml(); lg.replaceWith($("#pl-lg", tmp));
  });
  // teclado no mapa: setas percorrem os alvos; Enter/Espaço seleciona
  doc.addEventListener("keydown", e => {
    const el = e.target.closest && e.target.closest("#pl-des [data-alvo]"); if (!el) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seleciona(el.dataset.alvo, "mapa"); return; }
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key)) return;
    e.preventDefault();
    const todos = $$("#pl-des [data-alvo]").filter(x => x.getClientRects().length && !x.classList.contains("pl-arcada"));
    const i = todos.indexOf(el), n = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : -1;
    const prox = todos[(i + n + todos.length) % todos.length]; if (prox) prox.focus();
  });
  // lupa no hover (desktop)
  doc.addEventListener("pointermove", e => {
    if (!comMouse()) return;
    const area = e.target.closest && e.target.closest("#pl-area");
    const lupa = $("#pl-lupa");
    if (!area) { if (lupa && !lupa.hidden) lupa.hidden = true; return; }
    lupaEv = e; if (!lupaRaf) lupaRaf = requestAnimationFrame(moveLupa);
  });
  doc.addEventListener("pointerleave", () => { const l = $("#pl-lupa"); if (l) l.hidden = true; });

  /* ---------- combos ---------- */
  function menuCombos(bt) {
    const t = tot();
    const html = `<div class="pl-menu pl-menu--combos" role="menu" aria-label="Combos">${PACOTE.combos.map(c => PAC.combo(PACOTE, c.id)).filter(c => c && c.ativo !== false).map(c => {
      const bruto = PL.aplicaCombo(PACOTE, c.id).reduce((s, it) => s + PL.valorLinha(it, PACOTE), 0);
      return `<button type="button" role="menuitem" data-combo="${c.id}"><span><b>${esc(c.nome)}</b><small>${c.itens.length} ${c.itens.length === 1 ? "linha" : "linhas"}${c.serie ? " · série" : ""}${bruto > c.preco ? ` · de R$ ${real(bruto)}` : ""}</small></span><b class="num">R$ ${real(c.preco)}</b></button>`;
    }).join("")}</div>`;
    abreCamada(html, { tipo: "pop", bt, rotulo: "Combos" }); void t;
  }
  camada.addEventListener("click", e => {
    const b = e.target.closest("[data-combo]"); if (!b) return;
    const id = b.dataset.combo, n = S.plano.itens.filter(i => i.combo && i.combo.startsWith(id + "#")).map(i => Number(i.combo.split("#")[1])).reduce((a, x) => Math.max(a, x), 0) + 1;
    const its = PL.aplicaCombo(PACOTE, id, { n, origem: "closer", grupo: undefined });
    its.forEach(it => { if (ODONTO()) it.grupo = faseDe(procDe(it.proc)); });
    S.plano.itens.push(...its); fechaCamada(true); salva(); render();
    its.forEach(it => flash(it.uid));
    const c = PAC.combo(PACOTE, id);
    aviso(`${esc(c.nome)} · ${its.length} ${its.length === 1 ? "linha" : "linhas"} · R$ ${real(c.preco)}`);
  });

  /* ---------- fechar plano ---------- */
  function fechar() {
    const dm = PAC.pagamento(PACOTE).descMax, maxD = dm[PERFIL] != null ? dm[PERFIL] : dm.closer, pct = (S.plano.desconto || {}).pct || 0;
    if (pct > maxD) {
      S.plano.desconto = { pct, aprovado: false, pedido: HOJE + " " + horaAgora() }; salva(true);
      aviso(`Pedido de aprovação enviado à Gestão · desconto de ${pct}%`);
      try { ls.set("munin:desconto-pedido", JSON.stringify({ paciente: PID, pct, ts: Date.now() })); } catch (e) { /* ok */ }
      return;
    }
    const t = tot(), its = S.plano.itens.filter(i => i.status !== "recusado" && i.status !== "realizado");
    // "Tudo" aceita também as sugestões do profissional: o valor mostrado é o total já com elas (e com o desconto)
    const nSug = its.filter(i => i.sugerido).length;
    const tTudo = nSug ? PL.totalPlano(Object.assign({}, S.plano, { itens: S.plano.itens.map(i => Object.assign({}, i, { sugerido: false })) })) : t;
    const vTudo = tTudo.total, valorTudo = uid => valorUid(tTudo, uid);
    const html = `<div class="pl-dlg"><div class="pl-dlg__cab"><h2>Fechar o plano de ${esc(PAC_.nome.split(" ")[0])}</h2><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-dlg-fecha aria-label="Fechar">${ico("i-fechar")}</button></div>
      <fieldset class="pl-esc"><legend class="sr">O que a paciente aceitou</legend>
        <label><input type="radio" name="pl-esc" value="tudo" checked><span><b>Tudo</b><small>${its.length} ${its.length === 1 ? "item" : "itens"} · R$ ${real(vTudo)}${t.desconto || tTudo.desconto ? " com desconto" : ""}${nSug ? ` · inclui ${nSug === 1 ? "a sugestão" : `as ${nSug} sugestões`} de ${esc(medCurto(S.plano.med))}` : ""}</small></span></label>
        <label><input type="radio" name="pl-esc" value="marcados"><span><b>Só os marcados</b><small>os demais ficam em aberto, com motivo</small></span></label>
        <label><input type="radio" name="pl-esc" value="recusou"><span><b>Recusou</b><small>tudo fica em aberto e entra em Leads parados com o valor</small></span></label>
      </fieldset>
      <ul class="pl-dlg__its" id="pl-dlg-its" hidden>${its.map(i => `<li><label><input type="checkbox" value="${i.uid}"${i.status === "aceito" ? " checked" : ""}><span>${esc(alvoDe(i.alvo).tipo === "dente" ? alvoDe(i.alvo).nomeCurto : PAC.nomeAlvo(PACOTE, i))} · ${esc(curto(i.proc))}</span><b class="num">${real(valorTudo(i.uid))}</b></label></li>`).join("")}</ul>
      <label class="pl-mot" id="pl-dlg-mot" hidden><span>Motivo para o que ficou em aberto</span><select id="pl-dlg-motivo">${MOTIVOS().map(m => `<option>${m}</option>`).join("")}</select></label>
      <p class="pl-dlg__nota">${ico("i-info")}Ao confirmar, os aceitos viram recall com data e os em aberto aparecem em Leads parados com o valor. A etapa do lead no funil não muda neste protótipo.</p>
      <div class="pl-dlg__pe"><button type="button" class="bt-sec" data-dlg-fecha>Cancelar</button><button type="button" class="bt-principal" data-dlg-ok>${ico("i-check")}Confirmar</button></div></div>`;
    abreCamada(html, { tipo: "dlg", bt: $("#pl-fechar"), rotulo: "Fechar o plano" });
    delete camada.dataset.uid; delete camada.dataset.alvo;
  }
  camada.addEventListener("change", e => {
    if (e.target.name !== "pl-esc") return;
    const v = e.target.value; $("#pl-dlg-its", camada).hidden = v !== "marcados"; $("#pl-dlg-mot", camada).hidden = v === "tudo";
  });
  camada.addEventListener("click", e => {
    if (e.target.closest("[data-dlg-fecha]")) { fechaCamada(); return; }
    if (!e.target.closest("[data-dlg-ok]")) return;
    const esc_ = ($("input[name=pl-esc]:checked", camada) || {}).value || "tudo";
    const marc = new Set($$("#pl-dlg-its input:checked", camada).map(x => x.value));
    const mot = ($("#pl-dlg-motivo", camada) || {}).value;
    S.plano.itens.forEach(i => {
      if (i.status === "recusado" || i.status === "realizado") return;
      const aceita = esc_ === "tudo" || (esc_ === "marcados" && marc.has(i.uid));
      if (aceita) { i.status = "aceito"; i.sugerido = false; delete i.motivo; if (!i.data) i.data = HOJE; }
      else { i.status = "em_aberto"; i.motivo = i.motivo || mot; }
    });
    S.plano.fechado = HOJE; minutos++;
    salva(true); fechaCamada(true);
    const t = tot(), recs = PL.recallsDe(S.plano).length;
    // valor fechado = aceitos com o mesmo % de desconto do plano (com "Tudo", é o total do cartão)
    const fechadoV = esc_ === "tudo" ? t.total : t.subtotal ? Math.round((t.aceito + t.realizado) * t.total / t.subtotal) : 0;
    ss.set("munin:fechado:" + PID, "1");
    try { W.dispatchEvent(new CustomEvent("munin:plano-fechado", { detail: { paciente: PID, total: fechadoV, recalls: recs } })); } catch (er) { /* ok */ }
    ls.set("munin:plano-fechado", JSON.stringify({ paciente: PID, ts: Date.now() }));
    render();
    aviso(esc_ === "recusou" ? `Plano em aberto · R$ ${real(t.emAberto)} em Leads parados` : `Plano fechado · R$ ${real(fechadoV)} · ${recs} ${recs === 1 ? "recall criado" : "recalls criados"}`);
  });

  /* ---------- médico: enviar para a closer (evento storage na outra aba) ---------- */
  function enviaCloser() {
    const n = S.plano.itens.filter(i => i.sugerido).length;
    salva(true);
    ls.set("munin:sugestao", JSON.stringify({ paciente: PID, n, med: S.plano.med, ts: Date.now() }));
    aviso(`Enviado para a closer · ${n} ${n === 1 ? "item sugerido" : "itens sugeridos"}`);
  }
  function recarregaDeFora() {
    const novo = PLD.plano(PID); if (novo) S.plano = normalizaPlano(novo);
    sugPendente = null; render();
    $$(".pl-lin.is-sug .pl-selo").forEach(s => anima(s, [{ boxShadow: "0 0 0 0 rgba(70,87,200,.5)" }, { boxShadow: "0 0 0 8px rgba(70,87,200,0)" }], { duration: 900, easing: EASE }));
    const p = $(".pl-lin.is-sug"); if (p) p.scrollIntoView({ block: "nearest" });
  }
  W.addEventListener("storage", e => {
    if (MEDICO) return;
    if (e.key === "munin:sugestao" && e.newValue) {
      try { const d = JSON.parse(e.newValue); if (d.paciente !== PID) return; sugPendente = d; } catch (er) { return; }
      const box = $("#pl-sug-aviso"); if (box) box.innerHTML = sugAvisoHtml();
      aviso(`${esc(medCurto(sugPendente.med))} sugeriu ${sugPendente.n} ${sugPendente.n === 1 ? "item" : "itens"} · <b>${esc(PAC_.nome)}</b>`);
      const s = $(".pl-sug-aviso"); anima(s, [{ transform: "translateY(-6px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 320, easing: EASE });
    }
  });

  /* ---------- resumo pelo WhatsApp: link que expira, sem procedimento ---------- */
  function enviaResumo() {
    if (!S.plano.resumo || D.diasEntre(HOJE, S.plano.resumo.expira) < 0) S.plano.resumo = { token: Math.random().toString(36).slice(2, 6), expira: D.somaDias(HOJE, 7) };
    salva(true);
    const link = new URL("resumo.html?t=" + S.plano.resumo.token, location.href).href;
    // na mensagem vai o link curto do produto; "Ver o resumo" abre a página de demonstração
    const linkCurto = "munin.app/r/" + S.plano.resumo.token;
    const nome = PAC_.nome.split(" ")[0];
    const txt = `Olá, ${nome}! Seu resumo está pronto: ${linkCurto} (vale até ${S.plano.resumo.expira.slice(0, 5)}).\n\nClínica Aurora`;
    const fone = VA && VA.fone && VA.P[PID] ? VA.fone(PID) : "";
    const html = `<div class="pl-dlg pl-dlg--wa"><div class="pl-dlg__cab"><h2>Enviar resumo</h2><button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-dlg-fecha aria-label="Fechar">${ico("i-fechar")}</button></div>
      <p class="muted">${esc(PAC_.nome)}${fone ? ` · <span class="num">(${fone.slice(0, 2)}) ${fone.slice(2, 7)}-${fone.slice(7)}</span>` : ""}</p>
      <label class="pl-wa-txt"><span class="sr">Mensagem</span><textarea id="pl-wa-txt" rows="5">${esc(txt)}</textarea></label>
      <p class="pl-dlg__nota">${ico("i-info")}A mensagem leva só o link, sem procedimento, valor ou desenho: ela pode ser lida por outra pessoa no celular. O link pede o dia e o mês de nascimento e vale por 7 dias.</p>
      <div class="pl-dlg__pe"><a class="bt-sec" href="${esc(link)}" target="_blank" rel="noopener">Ver o resumo ${ico("i-pl-ext")}</a><a class="bt-principal" id="pl-wa-abrir" href="${fone ? `https://wa.me/55${fone}?text=${encodeURIComponent(txt)}` : `https://wa.me/?text=${encodeURIComponent(txt)}`}" target="_blank" rel="noopener">${ico("i-whats")}Abrir no WhatsApp</a></div></div>`;
    abreCamada(html, { tipo: "dlg", rotulo: "Enviar resumo pelo WhatsApp", foco: "#pl-wa-txt" });
    delete camada.dataset.uid; delete camada.dataset.alvo;
    $("#pl-wa-txt", camada).insertAdjacentHTML("afterend", `<p class="pl-wa-aviso" id="pl-wa-aviso" role="status" hidden></p>`);
    $("#pl-wa-txt", camada).addEventListener("input", ev => {
      const a = $("#pl-wa-abrir", camada), v = ev.target.value, av = $("#pl-wa-aviso", camada);
      a.href = a.href.split("?text=")[0] + "?text=" + encodeURIComponent(v);
      const motivo = waProblema(v);
      av.hidden = !motivo; av.innerHTML = motivo ? `${ico("i-info")}<span>${esc(motivo)}</span>` : "";
      ev.target.setAttribute("aria-invalid", String(!!motivo)); if (motivo) ev.target.setAttribute("aria-describedby", "pl-wa-aviso"); else ev.target.removeAttribute("aria-describedby");
    });
  }
  // a mensagem leva só o link: avisa (sem bloquear) quando aparece dado clínico, procedimento, região ou valor
  function waProblema(txt) {
    if (PAC.sensivel && PAC.sensivel(txt)) return (PAC.TERMOS_SENSIVEIS && PAC.TERMOS_SENSIVEIS.aviso) || "Isso parece dado clínico. Registre no prontuário da clínica.";
    if (/R\$\s?\d|\d+\s?reais\b/i.test(txt)) return "A mensagem leva só o link: tire o valor. Ele aparece no resumo, depois da data de nascimento.";
    const sem = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const t = " " + sem(txt).replace(/[^a-z0-9 ]/g, " ") + " ";
    const nomes = [];
    (PACOTE.procedimentos || []).forEach(p => { nomes.push(p.nome); (p.sinonimos || []).forEach(x => nomes.push(x)); });
    (PACOTE.alvos || []).forEach(a => { if (a.tipo !== "dente" && a.tipo !== "pacote") nomes.push(a.nome); });
    const achou = nomes.map(n => sem(n).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()).find(n => n.length >= 4 && t.includes(" " + n + " "));
    return achou ? "A mensagem leva só o link: tire o nome do procedimento ou da região. Ela pode ser lida por outra pessoa no celular." : "";
  }

  /* =====================================================================
     9. MODO APRESENTAÇÃO (tela cheia escura, sem 3D)
     ===================================================================== */
  function segura(bt, ms, feito) {
    let raf = 0, t0 = 0;
    const fim = () => { cancelAnimationFrame(raf); raf = 0; bt.classList.remove("is-segurando"); bt.style.setProperty("--p", 0); };
    const ini = e => {
      if (e.type === "keydown") { if (!(e.key === "Enter" || e.key === " ") || e.repeat) return; e.preventDefault(); }
      if (raf) return;
      t0 = performance.now(); bt.classList.add("is-segurando");
      const loop = () => { const p = Math.min(1, (performance.now() - t0) / ms); bt.style.setProperty("--p", p.toFixed(3)); if (p >= 1) { fim(); feito(); } else raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    };
    bt.addEventListener("pointerdown", ini);
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => bt.addEventListener(ev, fim));
    bt.addEventListener("keydown", ini); bt.addEventListener("keyup", fim);
    bt.addEventListener("click", e => e.preventDefault());
  }
  let apres = null;
  function apresentacao() {
    if (apres) return;
    fechaCamada(true); if (body.classList.contains("pl-orc-aberto")) abreOrc(false);
    const voltar = doc.activeElement;
    const el = doc.createElement("div");
    el.className = "pl-apres"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", `Plano de ${PAC_.nome.split(" ")[0]}`);
    const vistasPlano = () => {
      if (ODONTO()) return ["sorriso"];
      const c = {}; vivos().forEach(it => { const a = alvoDe(it.alvo); if (a && a.vista && DES[a.vista]) c[a.vista] = (c[a.vista] || 0) + 1; });
      const L = Object.keys(c).sort((a, b) => c[b] - c[a]);
      return L.length ? L : ["rosto"];
    };
    let vista = vistasPlano()[0];
    const st = { valores: VER_RS && !!(S.plano.valores && S.plano.valores.liberadosApresentacao && q.get("valores") === "1") };
    el.innerHTML = `<div class="pl-apres__fx" aria-hidden="true"></div>
      <header class="pl-apres__topo"><svg class="munin pl-apres__marca" viewBox="0 0 94 94" aria-hidden="true">${($(".trilho__logo svg") || { innerHTML: "" }).innerHTML}</svg>
        <span class="pl-apres__clin">Clínica Aurora</span>
        <div class="pl-apres__bts">${VER_RS ? `<button type="button" class="pl-segura" id="pl-ap-val" aria-describedby="pl-ap-dica-v"><span class="pl-segura__anel" aria-hidden="true"></span>${ico("i-moeda")}<span>Valores</span></button>` : ""}
        <button type="button" class="pl-segura" id="pl-ap-sair" aria-describedby="pl-ap-dica-s"><span class="pl-segura__anel" aria-hidden="true"></span>${ico("i-pl-sair")}<span>Sair</span></button></div>
        <span class="sr" id="pl-ap-dica-v">Segure por 1 segundo para mostrar os valores (teclado: segure Enter)</span><span class="sr" id="pl-ap-dica-s">Segure por 1 segundo para sair (teclado: segure Enter)</span>
      </header>
      <div class="pl-apres__palco"><div class="pl-apres__intro"><span class="pl-apres__k">Seu plano</span><h2>${esc(PAC_.nome.split(" ")[0])}</h2><div class="pl-apres__vistas" id="pl-ap-vistas"></div></div>
        <div class="pl-area pl-apres__area" id="pl-ap-area"><div class="pl-des pl-apres__des"></div><svg class="pl-hud" aria-hidden="true"></svg><div class="pl-rots"></div></div>
        <aside class="pl-apres__tl" aria-label="Linha do tempo do plano"><span class="pl-apres__k">${ODONTO() ? "Fases do plano" : "Seu plano no tempo"}</span><ol id="pl-ap-tl"></ol></aside></div>
      <div class="pl-apres__nums" id="pl-ap-nums"></div>
      <footer class="pl-apres__pe"><div class="pl-apres__val" id="pl-ap-v" aria-live="polite"></div><button type="button" class="pl-apres__ag" id="pl-ap-ag">Quero agendar</button></footer>
      <p class="pl-apres__dica" id="pl-ap-dica" role="status"></p>`;
    body.appendChild(el); body.classList.add("pl-com-apres");
    apres = el;
    try { if (el.requestFullscreen && !q.get("modo")) el.requestFullscreen().catch(() => {}); } catch (e) { /* sem tela cheia */ }
    anima(el, [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 500, easing: EASE });
    const itens = () => vivos().filter(i => !i.sugerido || MEDICO);
    function pinta() {
      const area = $("#pl-ap-area", el), box = $(".pl-des", area);
      box.innerHTML = desenhoDe(vista);
      const svg = $("svg", box); if (!svg) return;
      normaliza(svg, PACOTE, false); svg.classList.add("pl-svg");
      svg.setAttribute("aria-hidden", "true");
      const m = estadoIds(itens());
      let i = 0;
      $$("[data-alvo]", svg).forEach(x => { if (m[x.dataset.alvo]) { x.classList.add("is-on"); x.style.setProperty("--i", i++); } });
      if (ODONTO()) $$(".pl-dente", svg).forEach(x => { const a = alvoDe(x.dataset.alvo); if (a) x.insertAdjacentHTML("afterbegin", `<title>${esc(a.nome)}</title>`); });
      // rótulos com benefício (sem valores, sem status interno)
      const por = new Map();
      itens().forEach(it => {
        const ids = PAC.alvosDoItem(PACOTE, it).filter(id => $(`[data-alvo="${id}"]`, svg)); if (!ids.length) return;
        const a = alvoDe(it.alvo);
        const k = ODONTO() ? (a.tipo === "arcada" ? it.proc : "d-" + it.proc) : it.alvo;
        const o = por.get(k) || { ids: new Set(), itens: [], a }; ids.forEach(x => o.ids.add(x)); o.itens.push(it); por.set(k, o);
      });
      const rots = [...por.values()].map(o => {
        const it0 = o.itens[0];
        let nome, ben;
        if (ODONTO()) { const n = o.ids.size; nome = o.a.tipo === "arcada" ? curto(it0.proc) : `${curto(it0.proc)}${n > 1 ? ` · ${n} dentes` : ""}`; ben = o.a.beneficio || ""; }
        else { nome = PAC.nomeAlvo(PACOTE, it0); ben = o.a.beneficio || ""; }
        return { ids: [...o.ids], html: `<b>${esc(nome)}</b>${ben ? `<span>${esc(ben)}</span>` : ""}` };
      });
      requestAnimationFrame(() => hud(area, svg, rots, {}, { semPontos: true, min: 110, passo: 46 }));
      // pílulas discretas para alternar a vista
      const vs = vistasPlano();
      $("#pl-ap-vistas", el).innerHTML = vs.length > 1 ? vs.map(v => `<button type="button" class="pl-apres__pil" aria-pressed="${v === vista}" data-ap-vista="${v}">${({ rosto: "Rosto", corpo_frente: "Corpo · frente", corpo_costas: "Corpo · costas" })[v] || v}</button>`).join("") : "";
    }
    function lado_() {
      // linha do tempo / fases
      if (ODONTO()) {
        $("#pl-ap-tl", el).innerHTML = PACOTE.grupos.map(g => {
          const its = itens().filter(i => i.grupo === g.id); if (!its.length) return "";
          const feito = its.every(i => i.status === "realizado");
          const tit = (S.plano.titulos && S.plano.titulos[g.id]) || g.titulo;
          return `<li class="${feito ? "is-feito" : ""}"><span class="pl-apres__pt"></span><div><b>${esc(g.nome)} · ${esc(tit)}</b><span>${esc([...new Set(its.map(i => curto(i.proc)))].join(", "))}${feito ? " · feito" : ""}</span></div></li>`;
        }).join("");
      } else {
        $("#pl-ap-tl", el).innerHTML = nos(S.plano, 6).map(n => `<li class="${n.ev.every(e => e.feito) ? "is-feito" : ""}${n.dias === 0 && !n.agendar ? " is-hoje" : ""}${n.agendar ? " is-agendar" : ""}"><span class="pl-apres__pt"></span><div><b>${esc(rotNo(n))}</b><span>${esc(juntaNomes([...new Set(n.ev.map(e => e.nome))]).slice(0, 3).join(", "))}</span></div></li>`).join("");
      }
      // três números finos com linha-guia
      // mesmos números para closer e médico: só o que está no plano (sem sugestão ainda não aceita)
      const noPlano = vivos().filter(i => !i.sugerido), planoP = Object.assign({}, S.plano, { itens: noPlano });
      const regs = new Set(noPlano.map(i => ODONTO() ? i.alvo : i.alvo.replace(/_(e|d)$/, ""))).size;
      const hoje = eventos(planoP).filter(e => e.d === HOJE && e.tipo === "sessao" && (e.st === "aceito" || e.st === "realizado")).length;
      // retornos = visitas (datas distintas), não itens: 6 lentes revisadas no mesmo dia contam 1
      const ret = new Set(eventos(planoP, { futuro: true }).filter(e => e.d && D.diasEntre(HOJE, e.d) > 0 && D.diasEntre(HOJE, e.d) <= 365).map(e => e.d)).size;
      const nums = ODONTO()
        ? [[new Set(noPlano.filter(i => (alvoDe(i.alvo) || {}).tipo === "dente").map(i => i.alvo)).size, "dentes no plano"], [new Set(noPlano.map(i => i.grupo)).size, "fases"], [ret, ret === 1 ? "retorno no ano" : "retornos no ano"]]
        : [[regs, regs === 1 ? "região" : "regiões"], [hoje, hoje === 1 ? "sessão hoje" : "sessões hoje"], [ret, ret === 1 ? "retorno no ano" : "retornos no ano"]];
      $("#pl-ap-nums", el).innerHTML = nums.map(([n, r]) => `<div class="pl-apres__num"><b data-n="${n}">${REDUZ ? n : 0}</b><i aria-hidden="true"></i><span>${r}</span></div>`).join("");
      if (!REDUZ) $$("[data-n]", el).forEach(b => { const alvo = Number(b.dataset.n), t0 = performance.now(); const f = now => { const p = Math.min(1, (now - t0) / 700); b.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; setTimeout(() => requestAnimationFrame(f), 260); });
      valores();
    }
    function valores() {
      const v = $("#pl-ap-v", el), t = tot();
      const VAL_DEPOIS = `<span class="pl-apres__k">Valores</span><span class="pl-apres__oculto">conversamos sobre o investimento a seguir</span>`;
      if (!VER_RS) { v.innerHTML = VAL_DEPOIS; return; }
      v.innerHTML = st.valores ? `<span class="pl-apres__k">Investimento</span><b><small>R$</small>${real(t.total)}</b><span>${t.parcelas > 1 ? `${t.parcelas}× de R$ ${cent(t.parcela)} sem juros` : "à vista"}</span>` : VAL_DEPOIS;
      $("#pl-ap-val", el).setAttribute("aria-pressed", String(st.valores));
    }
    pinta(); lado_();
    if (VER_RS) segura($("#pl-ap-val", el), 1000, () => {
      st.valores = !st.valores;
      if (st.valores) { S.plano.valores = Object.assign({}, S.plano.valores, { liberadosApresentacao: true }); salva(true); }
      valores();
      anima($("#pl-ap-v", el), [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: EASE });
    });
    segura($("#pl-ap-sair", el), 1000, sai);
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-ap-vista]"); if (b) { vista = b.dataset.apVista; pinta(); return; }
      if (e.target.closest("#pl-ap-ag")) { const d = $("#pl-ap-dica", el); d.textContent = "Combinado! A clínica reserva o horário com você agora."; d.classList.add("is-on"); setTimeout(() => d.classList.remove("is-on"), 2600); }
    });
    const onKey = e => {
      if (e.key === "Escape") { e.preventDefault(); const d = $("#pl-ap-dica", el); d.textContent = "Segure “Sair” por 1 segundo para voltar."; d.classList.add("is-on"); clearTimeout(d._t); d._t = setTimeout(() => d.classList.remove("is-on"), 2400); }
      if (e.key === "Tab") { const f = focaveis(el); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); } }
    };
    doc.addEventListener("keydown", onKey, true);
    const onRes = () => pinta(); W.addEventListener("resize", onRes);
    setTimeout(() => $("#pl-ap-ag", el).focus({ preventScroll: true }), 60);
    function sai() {
      doc.removeEventListener("keydown", onKey, true); W.removeEventListener("resize", onRes);
      try { if (doc.fullscreenElement) doc.exitFullscreen(); } catch (e) { /* ok */ }
      const fimA = () => { el.remove(); body.classList.remove("pl-com-apres"); apres = null; if (voltar && voltar.isConnected) voltar.focus({ preventScroll: true }); };
      const a = anima(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: EASE });
      if (a) a.onfinish = fimA; else fimA();
    }
  }

  /* =====================================================================
     10. INÍCIO
     ===================================================================== */
  renderTudo();
  let largAnt = innerWidth, roT = 0;
  W.addEventListener("resize", () => {
    clearTimeout(roT);
    roT = setTimeout(() => {
      const mudou = (largAnt <= 720) !== (innerWidth <= 720); largAnt = innerWidth;
      if (mudou) { S.modo = celular() && !ODONTO() ? "lista" : "mapa"; fechaCamada(true); abreOrc(false); renderTudo(); } else atualizaMapa();
    }, 120);
  });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => atualizaMapa());
  if (q.get("modo") === "apresentacao") setTimeout(apresentacao, 80);
  if (q.get("folha") && celular()) setTimeout(() => seleciona(q.get("folha"), "lista"), 120);
  if (q.get("sel")) setTimeout(() => seleciona(q.get("sel"), "mapa"), 60);

  W.PLT = { estado: S, render, renderTudo, adiciona, apresentacao, seleciona, total: () => tot() };

  /* ---------- SDR e Recepção: sem itens, regiões nem desenho ---------- */
  function semAcesso() {
    const pac = PID && PLD.paciente(PID);
    let pl = PID ? PLD.plano(PID) : null;
    try { const s = PID && ls.get("munin:plano:" + PID); if (s) pl = JSON.parse(s); } catch (e) { /* usa o exemplo */ }
    const rec = PERFIL === "recepcao", pc = pl ? PAC.get(pl.pacote) : null;
    // mesmo cabeçalho da closer (avatar + especialidade e profissional), sem regra interna no subtítulo
    const nomeP = pac ? pac.nome : "Plano";
    const avP = pac ? (UI && UI.av && VA && VA.P[PID] ? UI.av(pac.med, nomeP) + " " : `<span class="av av--o" aria-hidden="true">${esc(nomeP.split(" ").map(x => x[0]).slice(0, 2).join(""))}</span> `) : "";
    $("#pl-nome").innerHTML = avP + esc(nomeP);
    const med = (pl && pl.med) || (pac && pac.med);
    $("#pl-data").innerHTML = `<b>Plano${pc ? " · " + esc(pc.rot) : ""}</b>${med ? " · " + esc((PLD.profissionais[med] && PLD.profissionais[med].curto) || (UI && UI.nomeMed ? UI.nomeMed(med) : PLD.nomeProf(med))) : ""} · ${rec ? "para cobrar e agendar" : `interesse: ${esc(pc ? pc.rot : "—")}`}`;
    coluna.innerHTML = `<section class="cartao pl-sem-acesso"><div class="cartao__cab"><h2>${rec ? "Total e pagamento" : "Categoria de interesse"}</h2></div>
      <p class="muted">${rec ? "Para cobrar e agendar, aqui ficam o total e a forma de pagamento. Os itens do plano ficam com a closer e o profissional." : "Os itens e valores do plano ficam com a closer e o profissional. Aqui fica a categoria de interesse para o contato."}</p>
      <a class="bt-sec" href="painel.html">Voltar ao início</a></section>`;
    if (rec && pl) {
      const t = PL.totalPlano(pl), forma = (pl.pagamento || {}).forma || "cartao";
      const pg = PAC.pagamento(pc || PAC.get("dermato")).pagamento;
      const parc = forma === "pix" ? `à vista no Pix <b>R$ ${real(t.aVista)}</b> <small>(−${pg.pixDesc}%)</small>` : `<b>${t.parcelas}× R$ ${cent(t.parcela)}</b> sem juros no cartão`;
      lado.innerHTML = `<section class="cartao cartao--foco pl-total" aria-labelledby="pl-t-total"><span class="kpi__rot" id="pl-t-total">Total do plano</span>
        <div class="pl-total__v"><small>R$</small><span>${real(t.total)}</span></div><div class="pl-total__parc">${parc}</div></section>`;
    } else {
      lado.innerHTML = `<section class="cartao"><span class="kpi__rot">Categoria de interesse</span><p class="pl-sem-acesso__cat"><b>${esc(pc ? pc.rot : "—")}</b></p></section>`;
    }
  }

  /* ---------- sem paciente: escolha rápida (atalho "Montar orçamento") ---------- */
  function escolhaPaciente() {
    $("#pl-nome").textContent = "Montar plano";
    $("#pl-data").innerHTML = "<b>Escolha a paciente</b> · planos em andamento e leads na etapa Plano";
    const com = PLD.ids.map(id => ({ id, p: PLD.paciente(id), pl: PLD.plano(id) })).filter(x => x.p);
    const novos = VA ? Object.values(VA.P).filter(p => p.etapa === "plano" && !PLD.ids.includes(p.id)).slice(0, 8) : [];
    const li = (id, nome, sub) => `<li><a class="pl-esc-pac" href="plano.html?p=${encodeURIComponent(id)}"><span class="av av--${VA && VA.P[id] ? VA.P[id].med : "o"}" aria-hidden="true">${esc(nome.split(" ").map(x => x[0]).slice(0, 2).join(""))}</span><span><b>${esc(nome)}</b><small>${esc(sub)}</small></span>${ico("i-dir")}</a></li>`;
    coluna.innerHTML = `<section class="cartao"><div class="cartao__cab"><h2>Planos em andamento</h2></div><ul class="pl-esc-lista">${com.map(x => li(x.id, x.p.nome, `${(PAC.get(x.pl.pacote) || {}).rot || ""} · ${x.pl.itens.length} itens`)).join("")}</ul></section>
      ${novos.length ? `<section class="cartao"><div class="cartao__cab"><h2>Leads na etapa Plano <span class="cartao__sub">começar um plano novo</span></h2></div><ul class="pl-esc-lista">${novos.map(p => li(p.id, p.nome, p.proc)).join("")}</ul></section>` : ""}`;
    lado.innerHTML = `<section class="cartao"><p class="muted">Dica: a busca (<b>/</b> ou Ctrl K) também abre a ficha, e lá está o botão “Montar plano”.</p></section>`;
  }
})();
