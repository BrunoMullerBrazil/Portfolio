/* =====================================================================
   MOVIMENTO · motion.js (window.VAM)
   Carregar no fim do <body>, DEPOIS do script da página.
   Não altera o conteúdo das telas: trabalha por seletores, anima com
   Web Animations e injeta só peças próprias (prefixo vam-).
   Parâmetros de teste na URL:
     ?intro=1      força a abertura "Bom dia" (painel)
     ?nome=Dr.%20Rafael   pessoa da abertura (padrão: Dra. Lúcia)
     ?hora=18      simula a hora (saudação e botão "Encerrar o dia")
   ===================================================================== */
(function () {
  "use strict";
  const doc = document, html = doc.documentElement, body = doc.body;
  const q = new URLSearchParams(location.search);
  const mm = s => window.matchMedia && window.matchMedia(s).matches;
  const REDUZ = mm("(prefers-reduced-motion: reduce)");
  // Curvas macias (revisão "suave"): entradas desaceleram longo; saídas começam devagar
  const EASE = "cubic-bezier(.22,1,.36,1)", EASE_IN = "cubic-bezier(.55,0,.75,.3)", EASE_IO = "cubic-bezier(.65,0,.35,1)";
  const CORTINA = EASE_IO, CONTA = "cubic-bezier(.16,1,.3,1)";  // contagem: desaceleração forte no fim
  const pagina = body.dataset.pagina || "";
  const VA = window.VA || {};

  /* ---------- armazenamento seguro --------------------------------------- */
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } },
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* idem */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* idem */ } },
  };
  const hojeISO = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();

  /* ---------- quem e que horas ------------------------------------------- */
  const PESSOAS = ["Dra. Lúcia", "Dr. Rafael", "Recepção"];
  function nomeAtual() {
    const p = q.get("nome");
    if (p && p.trim()) return p.trim().slice(0, 40);
    const s = ls.get("vam:nome");
    return s && PESSOAS.includes(s) ? s : "Dra. Lúcia";
  }
  let NOME = nomeAtual();
  // Hora simulada: o protótipo vive às 09:40 de 13/11 (VA.AGORA); ?hora=18 testa a noite.
  const HORA = (() => {
    const h = q.get("hora");
    if (h != null && h !== "" && !isNaN(+h)) return Math.max(0, Math.min(23.99, +h));
    const [hh, mi] = String(VA.AGORA || "09:40").split(":").map(Number);
    return hh + (mi || 0) / 60;
  })();
  const hhmm = h => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
  const saudacao = h => h >= 18 ? "Boa noite" : h >= 12 ? "Boa tarde" : "Bom dia";

  /* ---------- digitação: nada anima enquanto se digita ------------------- */
  let ultimaTecla = 0, tDig = 0;
  const editavel = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  doc.addEventListener("keydown", e => {
    if (!editavel(e.target)) return;
    ultimaTecla = performance.now();
    html.classList.add("vam-digitando");
    clearTimeout(tDig); tDig = setTimeout(() => html.classList.remove("vam-digitando"), 900);
  }, true);
  const digitando = () => performance.now() - ultimaTecla < 900;

  /* ---------- utilidades ------------------------------------------------- */
  const anima = (el, kf, o) => { try { return el.animate(kf, o); } catch (e) { return null; } };
  /* Animações da entrada (para poder adiantá-las quando a abertura é pulada) */
  const ENTRADA = { anims: [] };
  const animaE = (el, kf, o) => { const a = anima(el, kf, o); if (a) ENTRADA.anims.push(a); return a; };
  function adiantaEntrada(ms) {
    if (ms <= 0) return;
    ENTRADA.anims.forEach(a => { try { if (a.playState !== "finished") a.currentTime = (a.currentTime || 0) + ms; } catch (e) { /* ok */ } });
  }
  const naTela = r => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0;
  const visivel = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

  /* =====================================================================
     3. ENTRADA DAS TELAS
     ===================================================================== */
  // Cartões: 520ms cada, escalonamento sobreposto de 55ms (o último começa em até 495ms)
  const PASSO = 55, DUR_CARTAO = 520, MAX_ATRASO = 495;

  function entradaCartoes(base = 0) {
    const els = [...doc.querySelectorAll("main .cartao")].filter(el => !el.closest(".fn-gaveta, .vam-tela") && visivel(el));
    const vis = els.map(el => ({ el, r: el.getBoundingClientRect() })).filter(x => naTela(x.r));
    vis.sort((a, b) => (Math.round(a.r.top / 24) - Math.round(b.r.top / 24)) || (a.r.left - b.r.left));
    // cartões aninhados (ex.: cartões do funil dentro de colunas) seguem a ordem visual
    vis.forEach((x, i) => {
      const atraso = base + Math.min(i * PASSO, MAX_ATRASO);
      animaE(x.el, REDUZ ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: "translateY(5px)", filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
        { duration: REDUZ ? 200 : DUR_CARTAO, delay: REDUZ ? base : atraso, easing: EASE, fill: "backwards" });
    });
    return base + (REDUZ ? 200 : Math.min(vis.length * PASSO, MAX_ATRASO) + DUR_CARTAO);
  }

  /* Números contam até o valor (900ms, desaceleração forte no fim). A largura fica travada
     no valor final (o texto real não muda; o número que corre é desenhado
     por cima), então o tamanho calculado por UI.medeNumeros não pula. */
  const RX_NUM = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$|^\d+(?:,\d+)?$/;
  const parseBR = s => +s.replace(/\./g, "").replace(",", ".");
  function fmtBR(v, modelo) {
    const dec = (modelo.split(",")[1] || "").length, milhar = /\./.test(modelo);
    const s = v.toFixed(dec).split(".");
    if (milhar) s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return s.join(",");
  }
  function contarNumeros(atraso = 0) {
    const alvos = doc.querySelectorAll("main .kpi__valor, main .funil__n, main .fn-col__n, main .metas-acum__n, main .anel__v, main .metas-kmeta, main .fn-fora__item strong");
    const itens = [];
    alvos.forEach(raiz => {
      if (raiz.closest(".fn-gaveta") || !visivel(raiz) || !naTela(raiz.getBoundingClientRect())) return;
      const w = doc.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      const nos = []; let n; while ((n = w.nextNode())) nos.push(n);
      nos.forEach(t => {
        const s = t.nodeValue.trim();
        if (!RX_NUM.test(s) || parseBR(s) === 0) return;
        itens.push({ t, s, fim: parseBR(s) });
      });
    });
    if (!itens.length || REDUZ) return;
    // Troca cada texto por uma camada: o texto final (invisível, mede a largura) + o número que corre
    itens.forEach(it => {
      const box = doc.createElement("span"); box.className = "vam-conta";
      box.style.cssText = "position:relative;display:inline-block";
      const fant = doc.createElement("span"); fant.textContent = it.t.nodeValue; fant.style.visibility = "hidden";
      const vivo = doc.createElement("span"); vivo.setAttribute("aria-hidden", "true");
      vivo.style.cssText = "position:absolute;inset:0;text-align:right;white-space:pre";
      vivo.textContent = it.t.nodeValue.replace(it.s, fmtBR(0, it.s));
      box.append(fant, vivo); it.t.replaceWith(box); Object.assign(it, { box, vivo, orig: fant.textContent });
    });
    // O relógio é uma animação neutra (opacidade 1→1): pode ser adiantada ou posicionada como as outras
    const relogio = animaE(itens[0].box, [{ opacity: 1 }, { opacity: 1 }], { duration: 900, delay: atraso, easing: CONTA });
    const fim = () => itens.forEach(it => { if (it.box.isConnected) it.box.replaceWith(doc.createTextNode(it.orig)); });
    if (!relogio) return fim();
    const passo = () => {
      const st = relogio.playState;
      if (st === "finished" || st === "idle") return fim();
      const e = relogio.effect.getComputedTiming().progress || 0;
      itens.forEach(it => { if (it.box.isConnected) it.vivo.textContent = it.orig.replace(it.s, fmtBR(it.fim * e, it.s)); });
      requestAnimationFrame(passo);
    };
    passo();
  }

  /* Anéis se desenham e barras crescem logo depois dos números */
  function graficos(atraso = 0) {
    const d = atraso + 80, DUR = 900;  // anéis e barras se desenham em 900ms, ease-out
    doc.querySelectorAll("main .anel__arco").forEach(c => {
      if (c.closest(".fn-gaveta") || !naTela(c.getBoundingClientRect())) return;
      const final = c.getAttribute("stroke-dasharray") || "100 0";
      animaE(c, REDUZ ? [{ opacity: 0 }, { opacity: 1 }] : [{ strokeDasharray: "0 100" }, { strokeDasharray: final }], { duration: REDUZ ? 200 : DUR, delay: d, easing: EASE, fill: "backwards" });
    });
    doc.querySelectorAll("main .anel__marca, main .anel__halo, main .bm__ponta, main .bm__rot").forEach(el => {
      animaE(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: d + DUR - 360, easing: EASE, fill: "backwards" });
    });
    const cresce = (el, eixo, origem) => {
      if (el.closest(".fn-gaveta") || !naTela(el.getBoundingClientRect())) return;
      if (REDUZ) return animaE(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: d, fill: "backwards" });
      const base = getComputedStyle(el).transform, pre = base && base !== "none" ? base + " " : "";
      el.style.transformOrigin = el.style.transformOrigin || origem;
      animaE(el, [{ transform: `${pre}scale${eixo}(0)` }, { transform: `${pre}scale${eixo}(1)` }], { duration: DUR, delay: d, easing: EASE, fill: "backwards" });
    };
    doc.querySelectorAll("main .bm__svg rect[fill^='url(']").forEach(r => { r.style.transformBox = "fill-box"; cresce(r, "X", "0 50%"); });
    doc.querySelectorAll("main .metas-ritmo__l i b").forEach(b => cresce(b, "X", "0 50%"));
    doc.querySelectorAll("main .funil__col > i").forEach(i => {
      const horizontal = i.offsetWidth < i.parentElement.offsetWidth - 1;
      cresce(i, horizontal ? "X" : "Y", horizontal ? "0 50%" : "50% 100%");
    });
    doc.querySelectorAll("main .metas-ano__barra").forEach(b => cresce(b, "Y", "50% 100%"));
    return d + DUR;
  }

  /* O alerta de parados pulsa UMA vez, devagar (halo vermelho que cresce e se dissolve em 1,6s) */
  function pulsoAlerta(atraso) {
    doc.querySelectorAll("main #aviso-parados, main .fn-alerta, main [data-alerta]").forEach(el => {
      if (el.hidden || !visivel(el) || !naTela(el.getBoundingClientRect())) return;
      if (REDUZ) { animaE(el, [{ opacity: 1 }, { opacity: .75 }, { opacity: 1 }], { duration: 300, delay: atraso }); return; }
      animaE(el, [
        { boxShadow: "0 1px 2px rgba(22,23,28,.05), 0 0 0 0 rgba(163,50,44,0)" },
        { boxShadow: "0 1px 2px rgba(22,23,28,.05), 0 0 0 3px rgba(163,50,44,.22)", offset: .25 },
        { boxShadow: "0 1px 2px rgba(22,23,28,.05), 0 0 0 16px rgba(163,50,44,0)" }],
        { duration: 1600, delay: atraso, easing: "cubic-bezier(.33,0,.2,1)" });
    });
  }

  function entrada(base = 0) {
    const fimCartoes = entradaCartoes(base);
    const dNum = base + 160;
    contarNumeros(dNum);
    const fimGraf = graficos(dNum + 60);
    pulsoAlerta(Math.max(fimCartoes, fimGraf) - 200);
  }

  /* =====================================================================
     4a. PÍLULA DO TRILHO
     ===================================================================== */
  if (/^https?:$/.test(location.protocol) && !REDUZ) {
    const st = doc.createElement("style");
    st.textContent = "@view-transition { navigation: auto; }";
    doc.head.appendChild(st);
  }
  const trilho = doc.querySelector(".trilho");
  let pil = null;
  function posDe(el) {
    const a = trilho.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height, cel: mm("(max-width: 720px)") };
  }
  function poePilula() {
    const atual = trilho && trilho.querySelector('.trilho__item[aria-current="page"]');
    if (!atual) return;
    pil = doc.createElement("span"); pil.className = "vam-pilula"; pil.setAttribute("aria-hidden", "true"); pil.innerHTML = "<i></i>";
    trilho.prepend(pil); trilho.classList.add("vam-pil");
    const coloca = () => { const p = posDe(atual); Object.assign(pil.style, { width: p.w + "px", height: p.h + "px", transform: `translate(${p.x}px, ${p.y}px)` }); return p; };
    const fim = coloca();
    addEventListener("resize", coloca);
    // a peça do computador é centralizada: se a altura dela mudar, a pílula acompanha
    const peca = trilho.querySelector(".trilho__peca");
    if (peca && window.ResizeObserver) new ResizeObserver(() => { if (!pil.getAnimations().length) coloca(); }).observe(peca);
    // fallback sem View Transitions: a pílula sai da posição do item clicado na página anterior
    let vt = false;
    addEventListener("pagereveal", e => { if (e.viewTransition) vt = true; });
    const salvo = ss.get("vam:pilula"); ss.del("vam:pilula");
    requestAnimationFrame(() => {
      if (vt || !salvo) return;
      let ini; try { ini = JSON.parse(salvo); } catch (e) { return; }
      if (!ini || ini.cel !== fim.cel || (ini.x === fim.x && ini.y === fim.y)) return;
      if (REDUZ) { anima(pil, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); return; }
      anima(pil, [{ transform: `translate(${ini.x}px, ${ini.y}px)` }, { transform: `translate(${fim.x}px, ${fim.y}px)` }], { duration: 440, easing: EASE });
    });
    trilho.addEventListener("click", e => {
      const a = e.target.closest("a.trilho__item, a.trilho__logo");
      if (!a || !/\.html(\?|#|$)/.test(a.getAttribute("href") || "")) return;
      // a pílula parte do item atual e vai para o clicado (a próxima página termina o trajeto)
      ss.set("vam:pilula", JSON.stringify(posDe(atual)));
      if (!REDUZ && !doc.startViewTransition) {
        const alvo = a.classList.contains("trilho__item") ? a : trilho.querySelector('.trilho__item[href="painel.html"]');
        if (alvo) { const p = posDe(alvo); anima(pil, [{ transform: pil.style.transform }, { transform: `translate(${p.x}px, ${p.y}px)` }], { duration: 280, easing: EASE_IO, fill: "forwards" }); }
      }
    });
  }

  /* =====================================================================
     4b. FLIP de listas filtradas (quadro do funil, Atenção hoje…)
     Captura as posições antes de qualquer clique; no quadro seguinte,
     os que saíram esmaecem e os que ficaram deslizam.
     ===================================================================== */
  const SEL_FLIP = "main .fn-card, main .lista > .linha, main .fn-lista tbody tr[data-med]";
  // Chave estável: a página pode re-renderizar a lista inteira (innerHTML) ao filtrar
  const chave = el => {
    const n = el.querySelector(".fn-card__nome, .linha__nome, .fn-pac b, b");
    return (el.dataset.id || (n && n.textContent.trim()) || "") + "|" + (el.closest("[data-etapa]") ? el.closest("[data-etapa]").dataset.etapa : "") + "|" + el.tagName;
  };
  let foto = null;
  function fotografa() {
    foto = new Map();
    doc.querySelectorAll(SEL_FLIP).forEach(el => {
      if (el.hidden || !visivel(el)) return;
      const r = el.getBoundingClientRect(), k = chave(el);
      if (!naTela(r) || foto.has(k)) return;
      foto.set(k, { el, r });
    });
  }
  function flip() {
    const antes = foto; foto = null;
    if (!antes || !antes.size || digitando()) return;
    const agora = new Map();
    doc.querySelectorAll(SEL_FLIP).forEach(el => { if (!el.hidden && visivel(el)) { const k = chave(el); if (!agora.has(k)) agora.set(k, el); } });
    const saem = [], ficam = [], entram = [];
    antes.forEach((v, k) => {
      const el = agora.get(k);
      if (!el) { saem.push(v); return; }
      const a = el.getBoundingClientRect();
      if (Math.abs(a.left - v.r.left) > 1 || Math.abs(a.top - v.r.top) > 1) ficam.push([el, v.r, a]);
    });
    agora.forEach((el, k) => { if (!antes.has(k) && naTela(el.getBoundingClientRect())) entram.push(el); });
    if (!saem.length && !ficam.length) return;  // nada saiu nem se moveu: não é filtro
    saem.forEach(({ el, r }) => {
      const c = el.cloneNode(true); c.hidden = false; c.removeAttribute("id"); c.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));
      c.classList.add("vam-fantasma"); c.setAttribute("aria-hidden", "true"); c.setAttribute("inert", "");
      Object.assign(c.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", display: el.tagName === "TR" ? "table" : "" });
      body.appendChild(c);
      const a = anima(c, REDUZ ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: "none", filter: "blur(0)" }, { opacity: 0, transform: "scale(.98)", filter: "blur(3px)" }], { duration: REDUZ ? 160 : 260, easing: EASE_IN, fill: "forwards" });
      if (a) a.finished.then(() => c.remove(), () => c.remove()); else c.remove();
    });
    if (!REDUZ) ficam.forEach(([el, r, a]) => anima(el, [{ transform: `translate(${r.left - a.left}px, ${r.top - a.top}px)` }, { transform: "none" }], { duration: 440, easing: EASE }));
    entram.forEach(el => anima(el, REDUZ ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, filter: "blur(3px)" }, { opacity: 1, filter: "blur(0)" }], { duration: REDUZ ? 160 : 380, delay: REDUZ ? 0 : 120, easing: EASE, fill: "backwards" }));
  }
  doc.addEventListener("click", e => { if (e.target.closest("main")) fotografa(); }, true);
  doc.addEventListener("click", () => { if (foto) requestAnimationFrame(flip); });

  /* =====================================================================
     4c. SALVAR / REGISTRAR: tique desenhado + aviso que sobe pela base
     ===================================================================== */
  const TIQUE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  let avisos = null;
  function aviso(html) {
    if (!avisos) { avisos = doc.createElement("div"); avisos.className = "vam-avisos"; avisos.setAttribute("role", "status"); avisos.setAttribute("aria-live", "polite"); body.appendChild(avisos); }
    const a = doc.createElement("div"); a.className = "vam-aviso";
    a.innerHTML = `<span class="vam-aviso__ok">${TIQUE}</span><span>${html}</span>`;
    avisos.appendChild(a);
    while (avisos.children.length > 2) avisos.firstElementChild.remove();
    anima(a, REDUZ ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: "translateY(12px)", filter: "blur(3px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: REDUZ ? 200 : 460, easing: EASE });
    setTimeout(() => {
      const s = anima(a, REDUZ ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(6px)" }], { duration: REDUZ ? 160 : 300, easing: EASE_IN, fill: "forwards" });
      if (s) s.finished.then(() => a.remove(), () => a.remove()); else a.remove();
    }, 2600);
  }
  function tique(bt) {
    if (bt.querySelector(".vam-tique")) return;
    if (getComputedStyle(bt).position === "static") bt.style.position = "relative";
    const t = doc.createElement("span"); t.className = "vam-tique"; t.innerHTML = TIQUE;
    bt.appendChild(t); bt.classList.add("vam-tique-on");
    setTimeout(() => { bt.classList.remove("vam-tique-on"); t.remove(); }, 1400);
  }
  const RX_SALVA = /^(salvar|registrar|registrar tentativa|confirmar|marcar como feit)/i;
  doc.addEventListener("click", e => {
    const bt = e.target.closest("button, [role=button]");
    if (!bt || bt.closest(".vam-tela") || bt.disabled || bt.matches("[data-wa], [data-agenda], [aria-haspopup], [data-fecha]") || bt.closest(".wa-pop, .ag-menu")) return;
    const rot = (bt.dataset.dica || bt.getAttribute("aria-label") || bt.textContent || "").trim();
    const linha = bt.closest(".linha, tr, .fn-card");
    const nome = linha && (linha.querySelector(".linha__nome, .fn-card__nome, .fn-pac b") || {}).textContent;
    let msg = null;
    if (bt.matches("[data-salvar], [data-registrar], .vam-salvar") || RX_SALVA.test(rot)) {
      const o = rot.replace(/:.*$/, "");
      msg = /^registrar /i.test(o) ? `${o.replace(/^registrar /i, "").replace(/^\w/, c => c.toUpperCase())} registrado` : /^salvar/i.test(o) ? "Salvo" : `${o.replace(/^\w/, c => c.toUpperCase())} · feito`;
    } else if (bt.classList.contains("linha__acao") && /^(ligar|mandar mensagem)/i.test(rot)) {
      msg = `Tentativa registrada <b>· ${/^ligar/i.test(rot) ? "ligação" : "mensagem"}</b>`;
    }
    if (!msg) return;
    tique(bt);
    aviso(nome ? `${msg} · <b>${nome}</b>` : msg);
  });

  /* =====================================================================
     4d. CAMADAS FLUTUANTES de comum.js (pré-visualização do WhatsApp,
     menu "adicionar à agenda"): entram da direita em 380ms e saem em
     260ms. No celular a do WhatsApp é gaveta inferior: entra de baixo.
     ===================================================================== */
  const SEL_CAMADA = ".wa-pop, .ag-menu";
  const deBaixo = el => el.classList.contains("wa-pop") && mm("(max-width: 720px)");
  function entraCamada(el) {
    const kf = REDUZ ? [{ opacity: 0 }, { opacity: 1 }]
      : deBaixo(el) ? [{ opacity: 0, transform: "translateY(32px)" }, { opacity: 1, transform: "none" }]
      : [{ opacity: 0, transform: "translateX(10px) scale(.985)" }, { opacity: 1, transform: "none" }];
    anima(el, kf, { duration: REDUZ ? 200 : 380, easing: EASE });
  }
  function saiCamada(el, r) {
    if (!r || !r.width) return;
    const c = el.cloneNode(true); c.hidden = false; c.removeAttribute("id");
    c.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));
    c.setAttribute("aria-hidden", "true"); c.setAttribute("inert", "");
    c.classList.add("vam-fantasma");
    Object.assign(c.style, { left: r.left + "px", top: r.top + "px", right: "auto", bottom: "auto", width: r.width + "px", height: r.height + "px", zIndex: 41 });
    body.appendChild(c);
    const kf = REDUZ ? [{ opacity: 1 }, { opacity: 0 }]
      : deBaixo(el) ? [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(32px)" }]
      : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(8px) scale(.985)" }];
    const a = anima(c, kf, { duration: REDUZ ? 160 : 260, easing: EASE_IN, fill: "forwards" });
    if (a) a.finished.then(() => c.remove(), () => c.remove()); else c.remove();
  }
  const ultimaPos = new WeakMap();
  new MutationObserver(ms => ms.forEach(m => {
    const el = m.target;
    if (m.type !== "attributes" || !(el instanceof Element)) return;
    if (el.matches(SEL_CAMADA)) {
      if (!el.hidden) { requestAnimationFrame(() => ultimaPos.set(el, el.getBoundingClientRect())); entraCamada(el); }
      else saiCamada(el, ultimaPos.get(el));
    } else if (el.id === "camada-veu" && !el.hidden) {
      anima(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: EASE });
    } else if (el.matches(".wa-reg") && !el.hidden && m.oldValue !== null) {
      // tentativa registrada: o selo se desenha da esquerda para a direita
      anima(el, REDUZ ? [{ opacity: 0 }, { opacity: 1 }] : [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 480, easing: EASE });
    }
  })).observe(body, { attributes: true, attributeFilter: ["hidden"], attributeOldValue: true, subtree: true });
  // posição atualizada ao rolar/redimensionar (comum.js reposiciona a camada)
  addEventListener("scroll", () => doc.querySelectorAll(SEL_CAMADA).forEach(el => { if (!el.hidden) ultimaPos.set(el, el.getBoundingClientRect()); }), { passive: true, capture: true });
  // "Abrir no WhatsApp" registra a tentativa (comum.js): tique desenhado + aviso pela base
  doc.addEventListener("click", e => {
    const a = e.target.closest("#wa-abrir"); if (!a) return;
    const pop = a.closest(".wa-pop"); if (pop) ultimaPos.set(pop, pop.getBoundingClientRect());
    const id = pop && pop.dataset.id, p = id && VA.P && VA.P[id];
    setTimeout(() => {
      const reg = id && doc.querySelector(`[data-reg="${id}"] span`);
      aviso(`Tentativa registrada · <b>${p ? p.nome : ""}</b>${reg && reg.textContent ? ` · ${reg.textContent}` : ""}`);
    }, 40);
  }, true);

  /* =====================================================================
     1. ABERTURA ("Bom dia" / "Boa tarde" / "Boa noite" + placar)
     ===================================================================== */
  // Símbolo Munin (Munin_marca/svg/munin_simbolo.svg) para a abertura e o encerramento.
  // .vam-forma é o contorno externo da mesma forma (cápsula + gota + ponte) num só traço, para
  // o desenho do contorno ser contínuo; preenchida, coincide com o símbolo do kit. O ponto
  // azul pena (.vam-ponto) entra por último.
  const MONO = '<path class="vam-forma" pathLength="1" d="M23.39,51.51 C42.49,50.88 50.14,42.71 49.51,23.61 L49.5,23 A18.5,18.5 0 0 1 86.5,23 L86.5,70 A18.5,18.5 0 0 1 49.5,70 L49.49,47.23 C44.30,51.69 42.14,58.89 42.49,69.39 A18.5,18.5 0 1 1 23.39,51.51 Z"/><circle class="vam-ponto" cx="24" cy="23" r="18.5"/>';
  const mono = () => `<svg class="vam-mono" viewBox="0 0 94 94" aria-hidden="true">${MONO}</svg>`;
  const palavras = s => s.split(/(\s+)/).filter(Boolean).map(w => /^\s+$/.test(w) ? w : `<span>${w}</span>`).join("");

  /* Números do dia: MESMA fonte do painel (dados.js / window.VA), na visão "todos" (o filtro com que o painel abre).
     Abertura: meta do mês, pacientes de hoje, pendências atrasadas e leads parados (as mesmas contas dos cartões do painel).
     Encerramento: o que foi feito hoje. O registro congela o dia às 09:40 (VA.AGORA); para a noite simulada (?hora=19)
     algumas coisas são DERIVADAS da hora, e cada derivação está explicada abaixo. */
  const ETAPA_HOJE = p => p.etapa === "fechou" && p.total > p.v && /para hoje/i.test(p.nota || "");
  function dadosDoDia() {
    const AG = (VA.AGENDA || []).filter(a => !a.evento);
    const AT = VA.ATENCAO || [];
    const agora = hhmm(HORA);
    // atendido até a hora (simulada): já feito, em atendimento ou horário que passou (menos quem não confirmou)
    const passou = a => a.st === "feito" || a.st === "atend" || (a.h < agora && a.st !== "semresp");
    // % da meta do mês = faturamento realizado ÷ meta (a mesma conta do anel do painel, VA.metaVal("fat"))
    const fat = VA.metaVal ? VA.metaVal("fat", "todos") : [0, 0];
    // Planos fechados HOJE (derivado): fechamentos com dt = hoje (o registro não tem nenhum) + 2ª etapas de
    // parciais que a nota do registro diz "combinada para hoje" (Gabriela, R$ 2.050), contadas como fechadas
    // a partir das 17h, quando o dia é encerrado.
    const PS = Object.values(VA.P || {});
    const fechHoje = PS.filter(p => p.etapa === "fechou" && p.dt === VA.HOJE).map(p => p.v || 0);
    if (HORA >= 17) PS.filter(ETAPA_HOJE).forEach(p => fechHoje.push(p.total - p.v));
    // Pendências resolvidas hoje (derivado): itens de "Atenção hoje" cujo paciente já passou pela agenda até a
    // hora simulada (recall e confirmação se resolvem na visita) + as 2ª etapas fechadas acima.
    const resolvida = a => {
      const ag = AG.find(x => x.id === a.id);
      if (ag && ag.h < agora && passou(ag)) return true;
      const p = VA.P && VA.P[a.id];
      return HORA >= 17 && !!p && ETAPA_HOJE(p);
    };
    const res = AT.filter(resolvida);
    return {
      pacientes: AG.length,
      atrasadas: AT.filter(a => a.sev === "atrasado").length,
      pendencias: AT.length,
      metaPct: fat[1] ? Math.round(fat[0] / fat[1] * 100) : 0,
      parados: VA.parados ? VA.parados("todos").length : 0,   // mesma regra do aviso do painel e do Funil
      atendidos: AG.filter(passou).length,
      planosHoje: fechHoje.length,
      valorHoje: fechHoje.reduce((s, v) => s + v, 0),
      resolvidas: res.length,
      abertas: AT.length - res.length,
      atrasadasAbertas: AT.filter(a => a.sev === "atrasado" && !resolvida(a)).length,
    };
  }

  /* ---------- Placar: blocos lado a lado; o número conta de 0 até o valor -------------------
     A largura de cada número fica travada no valor final (texto fantasma invisível) e o número que
     corre é desenhado por cima, então nada pula enquanto conta. Leitor de tela lê só o .sr. */
  const fmtN = v => Math.round(v).toLocaleString("pt-BR");
  function placar(itens) {
    return `<ul class="vam-pl">${itens.map(it => {
      const fim = fmtN(it.n);
      return `<li class="vam-pl__item${it.alerta ? " vam-pl__item--alerta" : ""}">
        <span class="vam-pl__v" aria-hidden="true">${it.pre ? `<small>${it.pre}</small>` : ""}<span class="vam-pl__n" data-fim="${it.n}"><span class="vam-pl__fant">${fim}</span><span class="vam-pl__vivo">${fim}</span></span>${it.suf ? `<small>${it.suf}</small>` : ""}</span>
        <span class="vam-pl__rot" aria-hidden="true">${it.rot}</span>${it.sub ? `<span class="vam-pl__sub" aria-hidden="true">${it.sub}</span>` : ""}
        <span class="sr">${[it.pre, fim + (it.suf || ""), it.rot, it.sub].filter(Boolean).join(" ")}</span>
      </li>`; }).join("")}</ul>`;
  }
  // Contagem com relógio em Web Animations (opacidade 1→1, curva easeOut forte): pausa, adianta e cancela junto com as outras.
  function contaPlacar(raiz, atrasoDe, A, dur = 1100) {
    raiz.querySelectorAll(".vam-pl__n").forEach((n, i) => {
      const vivo = n.querySelector(".vam-pl__vivo"), fim = +n.dataset.fim;
      if (REDUZ || !fim) return;   // movimento reduzido: número final direto
      vivo.textContent = fmtN(0);
      const rel = A(n, [{ opacity: 1 }, { opacity: 1 }], { duration: dur, delay: atrasoDe(i), easing: CONTA });
      if (!rel) { vivo.textContent = fmtN(fim); return; }
      const passo = () => {
        if (!n.isConnected) return;
        const st = rel.playState;
        if (st === "finished" || st === "idle") { vivo.textContent = fmtN(fim); return; }
        vivo.textContent = fmtN(fim * (rel.effect.getComputedTiming().progress || 0));
        requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }
  // aria-live discreto: só a frase da saudação (e o resumo), anunciada uma vez
  const anuncia = (tela, txt) => setTimeout(() => { const s = tela.querySelector(".vam-tela__voz"); if (s) s.textContent = txt; }, 80);
  // Símbolo do menu (destino do voo da abertura): o do trilho; no celular, o do topo
  const alvoSimbolo = () => [...doc.querySelectorAll(".trilho__logo svg, .marca-cel")].find(el => { const r = el.getBoundingClientRect(); return r.width > 0 && naTela(r); });

  function inerte(sim) {
    doc.querySelectorAll("main, .trilho").forEach(el => { if (sim) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
    // classe no <html> enquanto a camada está na tela (a versão pública esconde o botão "Demonstração")
    html.classList.toggle("vam-camada", sim);
  }

  function abertura(forcada) {
    const dd = dadosDoDia();
    const frase = `${saudacao(HORA)}, ${NOME}.`;
    const pl = (n, um, varios) => n === 1 ? um : varios;
    const tela = doc.createElement("div");
    tela.className = "vam-tela vam-intro";
    tela.setAttribute("role", "dialog"); tela.setAttribute("aria-modal", "true"); tela.setAttribute("aria-label", "Abertura do dia");
    // Perfis (perfis.js): o seletor lista "Nome · Perfil" e o placar muda conforme o perfil
    const CT = window.MUNIN_CONTAS, PF = window.MUNIN_PERFIL;
    const opts = CT ? CT.map(c => `<option value="${c.nome}|${c.perfil}"${c.nome === NOME && c.perfil === PF ? " selected" : ""}>${c.nome} · ${c.rot}</option>`).join("") + (CT.some(c => c.nome === NOME && c.perfil === PF) ? "" : `<option selected>${NOME}</option>`)
      : PESSOAS.map(p => `<option${p === NOME ? " selected" : ""}>${p}</option>`).join("") + (PESSOAS.includes(NOME) ? "" : `<option selected>${NOME}</option>`);
    const itensPl = (window.MUNIN_PLACAR && window.MUNIN_PLACAR("abertura", dd, HORA)) || [
      { n: dd.metaPct, suf: "%", rot: "da meta do mês" },
      { n: dd.pacientes, rot: pl(dd.pacientes, "paciente hoje", "pacientes hoje") },
      { n: dd.atrasadas, rot: pl(dd.atrasadas, "pendência atrasada", "pendências atrasadas") },
      { n: dd.parados, rot: pl(dd.parados, "lead parado", "leads parados"), alerta: dd.parados > 0 },
    ];
    tela.innerHTML = `<div class="vam-tela__fundo" aria-hidden="true"></div>
      <div class="vam-tela__centro">
        ${mono()}
        <h2 class="vam-tela__ola">${palavras(frase)}</h2>
        ${placar(itensPl)}
      </div>
      <p class="sr vam-tela__voz" role="status" aria-live="polite"></p>
      <label class="vam-demo" title="Seletor de demonstração">Entrar como <select aria-label="Pessoa (demonstração)">${opts}</select></label>
      <span class="vam-tela__pular" aria-hidden="true">Clique ou tecle para pular</span>`;
    body.appendChild(tela);
    inerte(true);
    anuncia(tela, `${frase} ${itensPl.map(it => [it.pre, fmtN(it.n) + (it.suf || ""), it.rot].filter(Boolean).join(" ")).join(", ")}.`);

    const anims = [];
    const A = (el, kf, o) => { const a = anima(el, kf, Object.assign({ fill: "both" }, o)); if (a) anims.push(a); return a; };
    const fundo = tela.querySelector(".vam-tela__fundo"), svg = tela.querySelector(".vam-mono");
    const forma = svg.querySelector(".vam-forma"), ponto = svg.querySelector(".vam-ponto");
    const ola = tela.querySelector(".vam-tela__ola"), ws = ola.querySelectorAll("span");
    const itens = tela.querySelectorAll(".vam-pl__item");
    const extras = tela.querySelectorAll(".vam-demo, .vam-tela__pular");
    const alvo = alvoSimbolo();
    let alvoAnim = null, T_SAI, T_ENTRADA, ultima;

    /* Linha do tempo (~5s; movimento reduzido: ~3s, só opacidade, números finais direto):
       0,00–1,50s  símbolo Munin: o contorno se desenha (0,1–1,0), o corpo enche (0,8–1,2), o ponto azul chega (1,05–1,5)
       1,15–2,15s  saudação pela hora + nome, palavra por palavra (650ms cada, 130ms entre elas, desfoque saindo)
       1,95–3,50s  placar: 4 blocos entram em sequência (700ms cada, 120ms entre eles) e contam de 0 ao valor (1,1s, easeOut)
       3,50–3,95s  pausa de leitura
       3,95–5,05s  saída ligada ao painel: saudação e placar sobem desfocando (3,95–4,6); o símbolo encolhe e voa até
                   o símbolo do menu (FLIP, 4,03–4,93); o fundo porcelana se dissolve (4,33–5,05) enquanto os cartões
                   do painel entram por baixo */
    const sobe = (y, blur) => [{ opacity: 0, transform: `translateY(${y}px)`, filter: `blur(${blur}px)` }, { opacity: 1, transform: "none", filter: "none" }];
    // saídas usam fill "forwards": o preenchimento para trás de uma saída esconderia a entrada do mesmo elemento
    const saiCima = (y, blur) => [{ opacity: 1, transform: "none", filter: "blur(0)" }, { opacity: 0, transform: `translateY(${-y}px)`, filter: `blur(${blur}px)` }];
    if (REDUZ) {
      const fade = (el, d, dur = 300) => A(el, [{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay: d });
      forma.style.strokeDashoffset = 0;
      A(forma, [{ fillOpacity: 1, opacity: 0 }, { fillOpacity: 1, opacity: 1 }], { duration: 300 });
      fade(ponto, 150);
      fade(ola, 350);
      itens.forEach(it => fade(it, 650));
      extras.forEach(x => fade(x, 300));
      T_SAI = 2700; T_ENTRADA = T_SAI + 100;
      ultima = A(tela, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: T_SAI });
    } else {
      A(forma, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: 100, easing: "cubic-bezier(.45,0,.2,1)" });
      A(forma, [{ fillOpacity: 0 }, { fillOpacity: 1 }], { duration: 420, delay: 800, easing: EASE_IO });
      A(ponto, [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1.06)", offset: .7 }, { opacity: 1, transform: "scale(1)" }], { duration: 450, delay: 1050, easing: EASE });
      const T_OLA = 1150, PASSO_W = 130, DUR_W = 650;
      ws.forEach((w, i) => A(w, sobe(10, 6), { duration: DUR_W, delay: T_OLA + i * PASSO_W, easing: EASE }));
      const fimOla = T_OLA + Math.max(0, ws.length - 1) * PASSO_W + DUR_W;
      const T_PL = Math.max(1950, fimOla - 200), PASSO_PL = 120, DUR_PL = 700, DUR_CONTA = 1100;
      itens.forEach((it, i) => A(it, sobe(16, 6), { duration: DUR_PL, delay: T_PL + i * PASSO_PL, easing: EASE }));
      contaPlacar(tela, i => T_PL + i * PASSO_PL + 80, A, DUR_CONTA);
      extras.forEach(x => A(x, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 700, easing: EASE }));
      const fimPl = T_PL + (itens.length - 1) * PASSO_PL + 80 + DUR_CONTA;
      T_SAI = fimPl + 450;
      // saída: a saudação e o placar sobem um pouco e desfocam (em sequência) e somem ANTES de o fundo se abrir,
      // para não se misturarem aos cartões do painel que entram por baixo
      A(ola, saiCima(12, 6), { duration: 480, delay: T_SAI, easing: EASE_IO, fill: "forwards" });
      itens.forEach((it, i) => A(it, saiCima(14, 6), { duration: 480, delay: T_SAI + 40 + i * 50, easing: EASE_IO, fill: "forwards" }));
      extras.forEach(x => A(x, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: T_SAI, easing: EASE_IO, fill: "forwards" }));
      // FLIP do símbolo: da posição atual até o símbolo do menu (ponto continua azul; o corpo vira a cor do destino)
      const T_VOO = T_SAI + 80, DUR_VOO = 900;
      if (alvo) {
        const s = svg.getBoundingClientRect(), r = alvo.getBoundingClientRect();
        const dx = (r.left + r.width / 2) - (s.left + s.width / 2), dy = (r.top + r.height / 2) - (s.top + s.height / 2), k = r.height / s.height;
        const cor = getComputedStyle(alvo).color;
        A(svg, [{ transform: "none", color: getComputedStyle(svg).color }, { transform: `translate(${dx}px, ${dy}px) scale(${k})`, color: cor }], { duration: DUR_VOO, delay: T_VOO, easing: EASE_IO });
        // o símbolo de verdade fica escondido até o voo pousar e então troca com o que voou (160ms)
        alvoAnim = A(alvo, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: T_VOO + DUR_VOO - 120, easing: EASE });
        A(svg, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, delay: T_VOO + DUR_VOO - 120, easing: EASE, fill: "forwards" });
      } else {
        A(svg, saiCima(10, 6), { duration: 600, delay: T_SAI, easing: EASE_IO, fill: "forwards" });
      }
      A(fundo, [{ opacity: 1 }, { opacity: 0 }], { duration: 720, delay: T_SAI + 380, easing: EASE_IO, fill: "forwards" });
      T_ENTRADA = T_SAI + 380;
      // a camada termina quando o voo pousa e o fundo some
      const fimTudo = Math.max(T_VOO + DUR_VOO + 60, T_SAI + 1100);
      ultima = A(tela, [{ opacity: 1 }, { opacity: 1 }], { duration: fimTudo });
    }
    // o painel entra por baixo da camada que se dissolve
    const inicio = performance.now();
    entrada(T_ENTRADA);

    let acabou = false;
    const termina = () => {
      if (acabou) return; acabou = true;
      doc.removeEventListener("keydown", tecla, true);
      if (alvoAnim) try { alvoAnim.cancel(); } catch (e) { /* ok */ }
      const dentro = tela.contains(doc.activeElement) || doc.activeElement === body;
      tela.remove(); inerte(false);
      ls.set(chaveDia(), new Date().toISOString());
      // foco devolvido ao painel: o título da saudação do topo
      const h1 = doc.querySelector(".topo__ola h1");
      if (dentro && h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
    };
    if (ultima) ultima.finished.then(termina, termina); else termina();
    // segurança: nada fica travado mesmo se uma animação não terminar
    setTimeout(termina, T_SAI + 3500);

    const pular = () => {
      if (acabou) return;
      anims.forEach(a => { try { a.cancel(); } catch (e) { /* ok */ } });
      // a entrada do painel não espera a linha do tempo: adianta para começar agora
      adiantaEntrada(Math.max(0, T_ENTRADA - (performance.now() - inicio)));
      // pular continua imediato: só um esmaecer curto
      const s = anima(tela, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: EASE, fill: "forwards" });
      if (s) s.finished.then(termina, termina); else termina();
    };
    function tecla(e) { if (e.target.closest && e.target.closest(".vam-demo")) return; e.preventDefault(); pular(); }
    tela.addEventListener("click", e => { if (!e.target.closest(".vam-demo")) pular(); });
    doc.addEventListener("keydown", tecla, true);
    const sel = tela.querySelector(".vam-demo select");
    // o seletor de demonstração pausa a abertura enquanto está em uso
    sel.addEventListener("focus", () => anims.forEach(a => a.pause()));
    sel.addEventListener("blur", () => { if (!acabou) anims.forEach(a => a.play()); });
    sel.addEventListener("change", () => {
      const [nm, pf] = sel.value.split("|");
      ls.set("vam:nome", nm);
      const u = new URL(location.href); u.searchParams.delete("nome"); u.searchParams.set("intro", "1");
      if (pf) { ls.set("munin:perfil", pf); ls.set("munin:nome", nm); u.searchParams.set("nome", nm); u.searchParams.set("perfil", pf); }
      location.replace(u.href);
    });
    VAM.intro = { tela, anims, pular, saida: T_SAI, entrada: T_ENTRADA };
    return tela;
  }
  const chaveDia = () => `vam:abertura:${NOME}:${hojeISO}`;

  /* Saudação do topo acompanha a pessoa e a hora */
  function ajustaSaudacao() {
    const h1 = doc.querySelector(".topo__ola h1");
    if (!h1) return;
    const t = [...h1.childNodes].find(n => n.nodeType === 3 && /^(\s*)(Bom dia|Boa tarde|Boa noite),/.test(n.nodeValue));
    if (t) t.nodeValue = t.nodeValue.replace(/(Bom dia|Boa tarde|Boa noite),\s*[^\n]*/, `${saudacao(HORA)}, ${NOME}`);
  }

  /* =====================================================================
     2. ENCERRAR O DIA
     ===================================================================== */
  const ICO_LUA = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>';
  const chaveFim = () => `vam:encerrado:${NOME}:${hojeISO}`;
  function botaoEncerrar() {
    if (HORA < 17 || !trilho) return;
    const feito = ls.get(chaveFim());
    const b = doc.createElement("button");
    b.type = "button"; b.className = "trilho__item trilho__item--desk vam-encerrar" + (feito ? " vam-feito" : "");
    b.setAttribute("aria-label", "Encerrar o dia");
    // no computador o rótulo vira tooltip (data-rotulo), como os outros itens da peça
    b.dataset.rotulo = feito ? "Dia encerrado · rever o resumo" : "Encerrar o dia";
    b.innerHTML = `${ICO_LUA}<span class="trilho__rot">${feito ? "Encerrado" : "Encerrar"}</span>`;
    const sep = trilho.querySelector(".trilho__sep");
    if (sep) sep.after(b); else trilho.appendChild(b);
    b.addEventListener("click", encerrar);
    const ola = doc.querySelector(".topo__ola");
    if (ola) {
      const c = doc.createElement("button"); c.type = "button"; c.className = "vam-encerrar-cel";
      c.innerHTML = `${ICO_LUA}Encerrar o dia`; c.addEventListener("click", encerrar); ola.appendChild(c);
    }
    VAM.botaoEncerrar = b;
  }
  function encerrar() {
    if (doc.querySelector(".vam-tela")) return;
    const dd = dadosDoDia();
    const quem = doc.activeElement;
    const pl = n => n === 1 ? "" : "s";
    // Despedida: encerrar o dia nunca diz "Bom dia". A partir das 18h "Boa noite";
    // à tarde "Boa tarde… Até amanhã."; de manhã (encerramento antecipado) só "Até amanhã".
    const frase = HORA >= 18 ? `Boa noite, ${NOME}.` : HORA >= 12 ? `Boa tarde, ${NOME}. Até amanhã.` : `Até amanhã, ${NOME}.`;
    const final = HORA >= 18 ? "Bom descanso." : "Até amanhã.";
    const tela = doc.createElement("div");
    tela.className = "vam-tela vam-fim";
    tela.setAttribute("role", "dialog"); tela.setAttribute("aria-modal", "true"); tela.setAttribute("aria-label", "Encerrar o dia");
    tela.innerHTML = `<div class="vam-tela__fundo" aria-hidden="true"></div>
      <div class="vam-tela__centro">
        ${mono()}
        <h2 class="vam-tela__ola">${palavras(frase)}</h2>
        ${placar((window.MUNIN_PLACAR && window.MUNIN_PLACAR("encerramento", dd, HORA)) || [
          { n: dd.atendidos, rot: `atendimento${pl(dd.atendidos)} realizado${pl(dd.atendidos)}`, sub: `de ${dd.pacientes} na agenda` },
          { n: dd.valorHoje, pre: "R$", rot: "em planos fechados hoje", sub: dd.planosHoje ? `${dd.planosHoje} plano${pl(dd.planosHoje)}` : "nenhum plano hoje" },
          { n: dd.resolvidas, rot: `pendência${pl(dd.resolvidas)} resolvida${pl(dd.resolvidas)}`, sub: `de ${dd.pendencias} na lista` },
          { n: dd.abertas, rot: "ficam para amanhã", sub: `${dd.atrasadasAbertas} atrasada${pl(dd.atrasadasAbertas)}` },
        ])}
        <p class="vam-fim__ate">${final}</p>
        <button type="button" class="vam-fim__fechar">Fechar</button>
      </div>
      <p class="sr vam-tela__voz" role="status" aria-live="polite"></p>`;
    body.appendChild(tela);
    inerte(true);
    ls.set(chaveFim(), new Date().toISOString());
    anuncia(tela, `${frase} ${[...tela.querySelectorAll(".vam-pl .sr")].map(s => s.textContent).join(", ")}.`);

    /* Linha do tempo (~5,6s até o botão Fechar; movimento reduzido: ~2,5s, só opacidade, números finais direto):
       0,00–1,00s  a tela escurece suave para o grafite (gradiente radial sutil): modo noite
       0,35–1,15s  o símbolo aparece inteiro (claro sobre o grafite, ponto azul)
       0,70–1,74s  despedida pela hora + nome, palavra por palavra (650ms cada, 130ms entre elas)
       1,55–3,10s  placar do dia: 4 blocos em sequência (700ms, 120ms entre eles), contando de 0 ao valor (1,1s)
       3,50–5,10s  o símbolo se desfaz no sentido inverso da abertura: o corpo esvazia (3,5–4,0), o contorno
                   se recolhe (3,85–4,65) e o ponto azul sai por último (4,55–5,10)
       4,90–5,60s  a frase final pequena e o botão Fechar */
    const anims = [];
    const A = (el, kf, o) => { const a = anima(el, kf, Object.assign({ fill: "both" }, o)); if (a) anims.push(a); return a; };
    const fundo = tela.querySelector(".vam-tela__fundo"), svg = tela.querySelector(".vam-mono");
    const forma = svg.querySelector(".vam-forma"), ponto = svg.querySelector(".vam-ponto");
    const ws = tela.querySelectorAll(".vam-tela__ola span"), itens = tela.querySelectorAll(".vam-pl__item");
    const ate = tela.querySelector(".vam-fim__ate"), btFechar = tela.querySelector(".vam-fim__fechar");
    forma.style.fillOpacity = 1; forma.style.strokeDashoffset = 0; ponto.style.opacity = 1;
    if (REDUZ) {
      const fade = (el, d, de = 0, ate_ = 1) => A(el, [{ opacity: de }, { opacity: ate_ }], { duration: 300, delay: d });
      fade(fundo, 0); fade(svg, 150); ws.forEach(w => fade(w, 350)); itens.forEach(it => fade(it, 650));
      fade(ponto, 1700, 1, 0); fade(forma, 1500, 1, 0);   // o ponto sai por último
      fade(ate, 2000); fade(btFechar, 2200);
    } else {
      const sobe = (el, d, dur, y, blur) => A(el, [{ opacity: 0, transform: `translateY(${y}px)`, filter: `blur(${blur}px)` }, { opacity: 1, transform: "none", filter: "none" }], { duration: dur, delay: d, easing: EASE });
      A(fundo, [{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: EASE_IO });
      sobe(svg, 350, 800, 6, 6);
      ws.forEach((w, i) => sobe(w, 700 + i * 130, 650, 10, 6));
      const fimOla = 700 + Math.max(0, ws.length - 1) * 130 + 650;
      const T_PL = Math.max(1550, fimOla - 200);
      itens.forEach((it, i) => sobe(it, T_PL + i * 120, 700, 16, 6));
      contaPlacar(tela, i => T_PL + i * 120 + 80, A, 1100);
      const T_DESFAZ = T_PL + 3 * 120 + 80 + 1100 + 400;
      A(forma, [{ fillOpacity: 1 }, { fillOpacity: 0 }], { duration: 500, delay: T_DESFAZ, easing: EASE_IO });
      A(forma, [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], { duration: 800, delay: T_DESFAZ + 350, easing: EASE_IO });
      A(ponto, [{ opacity: 1, transform: "scale(1)" }, { opacity: 1, transform: "scale(1.12)", offset: .3 }, { opacity: 0, transform: "scale(0)" }], { duration: 550, delay: T_DESFAZ + 1050, easing: EASE_IO });
      sobe(ate, T_DESFAZ + 1400, 700, 6, 4);
      sobe(btFechar, T_DESFAZ + 1650, 500, 0, 0);
    }

    let fechado = false;
    const fechar = () => {
      if (fechado) return; fechado = true;
      doc.removeEventListener("keydown", tecla, true);
      const s = anima(tela, [{ opacity: 1 }, { opacity: 0 }], { duration: REDUZ ? 160 : 420, easing: EASE_IO, fill: "forwards" });
      const fim = () => {
        anims.forEach(a => { try { a.cancel(); } catch (e) { /* ok */ } });
        tela.remove(); inerte(false);
        if (VAM.botaoEncerrar) { VAM.botaoEncerrar.classList.add("vam-feito"); VAM.botaoEncerrar.querySelector(".trilho__rot").textContent = "Encerrado"; VAM.botaoEncerrar.dataset.rotulo = "Dia encerrado · rever o resumo"; }
        if (quem && quem.focus && quem !== body) quem.focus();
        else { const h1 = doc.querySelector(".topo__ola h1"); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); } }
      };
      if (s) s.finished.then(fim, fim); else fim();
    };
    function tecla(e) { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); fechar(); } }
    doc.addEventListener("keydown", tecla, true);
    btFechar.addEventListener("click", fechar);
    btFechar.focus({ preventScroll: true });
    VAM.fim = { tela, fechar, anims };
  }

  /* =====================================================================
     Início
     ===================================================================== */
  const VAM = window.VAM = { aviso, tique, entrada, encerrar, abertura, nome: NOME, hora: HORA };
  ajustaSaudacao();
  botaoEncerrar();          // antes da pílula: o botão muda a altura (e a posição) da peça
  if (trilho) poePilula();

  const forca = q.get("intro") === "1";
  const jaViu = !!ls.get(chaveDia());
  if (pagina === "painel" && (forca || !jaViu) && q.get("intro") !== "0") abertura(forca);
  else entrada(0);
})();
