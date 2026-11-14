/* =====================================================================
   Peças comuns às 3 telas: ícones, trilho, ações do topo, formatação,
   avatar, escala de temperatura, linha do tempo e mini calendário.
   Carregar DEPOIS de dados.js e ANTES do script da página.
   <body data-pagina="painel|funil|metas">
   ===================================================================== */
(function () {
  const ICONES = {
    "i-painel": '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    "i-leads": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
    "i-funil": '<path d="M3.5 5h17l-6.5 7.5V19l-4 1.5v-8z"/>',
    "i-agenda": '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    "i-recall": '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4.5H8"/><path d="M12 8v4.2l3 1.8"/>',
    "i-metas": '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
    "i-rel": '<path d="M4 20h16"/><rect x="5.5" y="11" width="3" height="6" rx="1"/><rect x="10.5" y="6" width="3" height="11" rx="1"/><rect x="15.5" y="13" width="3" height="4" rx="1"/>',
    "i-ajustes": '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    "i-mais": '<path d="M12 5v14M5 12h14"/>',
    "i-busca": '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    "i-sino": '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    "i-seta": '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    "i-esq": '<path d="m14.5 6-6 6 6 6"/>',
    "i-dir": '<path d="m9.5 6 6 6-6 6"/>',
    "i-fechar": '<path d="M6 6l12 12M18 6 6 18"/>',
    "i-msg": '<path d="M4.5 19.5 5.6 16A7.5 7.5 0 1 1 8.4 18.6z"/>',
    "i-tel": '<path d="M5 4h3.2l1.6 4-2 1.3a10.5 10.5 0 0 0 5 5l1.3-2 4 1.6V17a2 2 0 0 1-2 2A14.5 14.5 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    "i-plano": '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5M9 13h6M9 16.5h4"/>',
    "i-check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "i-relogio": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    "i-cafe": '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M12 3.5v2.5"/>',
    "i-quadro": '<rect x="3.5" y="4" width="4.5" height="16" rx="1.5"/><rect x="9.75" y="4" width="4.5" height="11" rx="1.5"/><rect x="16" y="4" width="4.5" height="7" rx="1.5"/>',
    "i-lista": '<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12"/><circle cx="4.5" cy="6.5" r=".9"/><circle cx="4.5" cy="12" r=".9"/><circle cx="4.5" cy="17.5" r=".9"/>',
    "i-moeda": '<rect x="3" y="6" width="18" height="12" rx="3"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
    "i-assina": '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5"/><path d="m9 14.5 2 2 4-4.5"/>',
    "i-coracao": '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"/>',
    "i-info": '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    // WhatsApp: desenho simples e monocromático (balão + fone), não o logo colorido
    "i-whats": '<path d="M4.3 19.7 5.4 16a8.2 8.2 0 1 1 3 2.8z"/><path fill="currentColor" stroke="none" d="M9.3 7.9c.25-.3.5-.35.8-.35h.45c.17 0 .33.1.4.27l.72 1.66c.08.19.04.4-.1.55l-.6.66c.62 1.22 1.6 2.2 2.84 2.83l.66-.6c.15-.14.37-.18.56-.1l1.66.72c.17.07.27.23.27.4v.45c0 .3-.06.56-.35.8-.7.6-1.67.73-2.5.4-2.36-.92-4.18-2.74-5.1-5.1-.32-.83-.2-1.8.4-2.5z"/>',
    "i-cal-mais": '<path d="M20.5 11.5V8a3 3 0 0 0-3-3h-11a3 3 0 0 0-3 3v9.5a3 3 0 0 0 3 3h5.5"/><path d="M3.5 10h17M8 3v4M16 3v4M18 14.5v6M15 17.5h6"/>',
    "i-baixar": '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  };
  const sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
    Object.entries(ICONES).map(([id, d]) => `<symbol id="${id}" viewBox="0 0 24 24">${d}</symbol>`).join("") + "</svg>";
  document.body.insertAdjacentHTML("afterbegin", sprite);

  /* ---------- Trilho lateral (no celular, barra inferior) ---------------- */
  const pagina = document.body.dataset.pagina;
  const ITENS = [
    { k: "painel",  rot: "Painel",     ico: "i-painel",  href: "painel.html", cel: "o1" },
    { k: "funil",   rot: "Funil",      ico: "i-funil",   href: "funil.html",  cel: "o2" },
    { k: "agenda",  rot: "Agenda",     ico: "i-agenda",  href: "#",           cel: "o4" },
    { k: "recall",  rot: "Recall",     ico: "i-recall",  href: "#" },
    { k: "metas",   rot: "Metas",      ico: "i-metas",   href: "metas.html",  cel: "o5" },
    { k: "rel",     rot: "Relatórios", ico: "i-rel",     href: "#" },
  ];
  // data-rotulo: no computador (>= 1024px) a peça mostra só ícones e o rótulo vira tooltip
  const item = i => `<a class="trilho__item ${i.cel || "trilho__item--desk"}" href="${i.href}" data-rotulo="${i.rot}"${i.k === pagina ? ' aria-current="page"' : ""}>
      <svg class="ico" aria-hidden="true"><use href="#${i.ico}"/></svg><span class="trilho__rot">${i.rot}</span></a>`;
  // Monograma da clínica: cópia fiel de brand/va_monograma.svg, inline, fill = currentColor
  // (sem círculo e sem fundo; a cor vem do CSS: porcelana no trilho, floresta-noite no topo do celular)
  const MONO = `<polygon points="61,16 70,16 101,112 91,112 65.5,30 40,112 30,112"/><polygon points="47,80 84,80 81,89 50,89"/>`;
  const monograma = cls => `<svg class="${cls}" viewBox="21 11 90 106" fill="currentColor" aria-hidden="true">${MONO}</svg>`;
  const logo = `<a class="trilho__logo" href="painel.html" aria-label="Clínica Aurora · Painel">${monograma("")}</a>`;
  const nav = `<nav class="trilho" aria-label="Navegação principal">${logo}
    <div class="trilho__aba"><i></i><button class="trilho__novo" data-rotulo="Novo lead" aria-label="Novo lead"><svg class="ico"><use href="#i-mais"/></svg></button><i></i></div>
    <div class="trilho__peca">
    ${ITENS.map(item).join("")}
    <span class="trilho__sep"></span>
    ${item({ k: "ajustes", rot: "Ajustes", ico: "i-ajustes", href: "#" })}
    </div>
  </nav>`;
  // .trilho__peca: no computador é a peça escura flutuante (só a altura dos itens);
  // no tablet e no celular é display: contents (os itens seguem filhos diretos do trilho).
  document.querySelector("main").insertAdjacentHTML("beforebegin", nav);
  const ola = document.querySelector(".topo__ola");
  if (ola) ola.insertAdjacentHTML("afterbegin", monograma("marca-cel"));

  /* ---------- Ações do topo: iguais nas 3 telas -------------------------- */
  const acoes = document.getElementById("acoes-topo");
  if (acoes) acoes.innerHTML = `
    <button class="bt-ico" aria-label="Buscar paciente" title="Buscar paciente"><svg class="ico"><use href="#i-busca"/></svg></button>
    <button class="bt-ico" aria-label="Avisos (3 novos)" title="Avisos"><svg class="ico"><use href="#i-sino"/></svg><span class="bt-ico__badge"></span></button>
    <button class="bt-ico" id="bt-agenda" aria-label="Agenda de hoje" title="Agenda de hoje"><svg class="ico"><use href="#i-agenda"/></svg></button>`;

  /* ---------- Formatação e peças ----------------------------------------- */
  const br = (n, d = 1) => n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: d });
  const mil = v => (v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  const real = v => v.toLocaleString("pt-BR");
  const rsMil = v => `<small>R$</small>${mil(v)}<small>mil</small>`;
  const ini = n => { const p = n.split(" ").filter(x => x.length > 2); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); };
  const nomeMed = m => m === "g" ? "Dr. Rafael" : "Dra. Lúcia";
  const av = (m, n, sm) => `<span class="av av--${m}${sm ? " av--sm" : ""}" title="Paciente de ${nomeMed(m)}" aria-label="Paciente de ${nomeMed(m)}">${ini(n)}</span>`;
  const TEMP = ["", "Frio", "Frio", "Morno", "Quente", "Muito quente"];
  const escala = n => `<span class="escala-grupo"><span class="escala" data-n="${n}" aria-hidden="true">${"<i></i>".repeat(5)}</span><span class="escala__rot">${TEMP[n]}</span><span class="sr">Temperatura ${n} de 5</span></span>`;

  /* Linha do tempo de hoje (painel e gaveta do funil) */
  function linhaDoTempo(el, med) {
    const { AGENDA, P, ST_AGENDA, AGORA } = window.VA;
    let html = "", marcou = false, prox = 0;
    AGENDA.forEach(a => {
      const p = a.evento ? a : P[a.id];
      if (!a.evento && med && med !== "todos" && p.med !== med) return;
      if (!marcou && a.h > AGORA) { html += `<li class="tempo__agora" aria-label="Agora ${AGORA}"><span>${AGORA}</span><i></i></li>`; marcou = true; }
      let cls = a.st === "feito" ? " tempo__item--feito" : a.st === "atend" ? " tempo__item--agora" : "";
      if (a.st !== "feito" && prox++ >= 5) cls += " tempo__item--extra";  // além dos 5 próximos (o celular recolhe)
      const lado = a.evento ? `<span class="tempo__ev" aria-hidden="true"><svg class="ico ico-sm"><use href="#i-cafe"/></svg></span>` : av(p.med, p.nome, true);
      const desc = a.evento ? a.det : `${a.tipo} · ${p.proc}${a.det ? " · " + a.det : ""}`;
      const st = a.evento ? "" : (() => { const [c, r] = ST_AGENDA[a.st]; return `<span class="status ${c}">${r}</span>`; })();
      // Próximas consultas (ainda não chegou): WhatsApp de confirmação + adicionar à agenda
      const futura = !a.evento && ["conf", "aconf", "semresp"].includes(a.st);
      const acoes = futura ? `<span class="tempo__acoes">${regTent(a.id)}${btWa(a.id, "confirmacao")}${btAgenda(a.id)}</span>` : "";
      html += `<li class="tempo__item${cls}"><span class="tempo__h">${a.h}</span><span class="tempo__no"></span>
        <div class="tempo__corpo">${lado}<div><b>${p.nome}</b><span class="tempo__desc">${desc}</span>${st || a.nota ? `<span class="tempo__st">${st}${a.nota ? `<em>${a.nota}</em>` : ""}${acoes}</span>` : ""}</div></div></li>`;
    });
    el.innerHTML = html;
  }

  /* Mini calendário de novembro/2026 (começa num domingo) */
  function miniCal(el, opc = {}) {
    const { DIAS_COM_CONSULTA, FERIADOS } = window.VA;
    let h = ["D", "S", "T", "Q", "Q", "S", "S"].map(s => `<span class="mcal__sem">${s}</span>`).join("");
    for (let d = 1; d <= 30; d++) {
      const dow = (d - 1) % 7, c = ["mcal__dia"], util = dow > 0 && dow < 6 && !FERIADOS.includes(d);
      if (!util && !FERIADOS.includes(d)) c.push("mcal__dia--fds");
      if (FERIADOS.includes(d)) c.push("mcal__dia--feriado");
      if (opc.pontos && DIAS_COM_CONSULTA.includes(d)) c.push("mcal__dia--tem");
      if (opc.conta && util && d < 13) c.push("mcal__dia--conta");
      if (d === 13) c.push("mcal__dia--hoje");
      const tag = opc.estatico ? "span" : "button";
      h += `<${tag} class="${c.join(" ")}"${d === 13 ? ' aria-current="date"' : ""} aria-label="${d} de novembro">${d}</${tag}>`;
    }
    for (let d = 1; d <= 5; d++) h += `<span class="mcal__dia mcal__dia--fora">${d}</span>`;
    el.innerHTML = h;
  }

  /* Pílulas de médico: contagens e clique */
  function pilulasMedico(contagem, aoMudar) {
    document.querySelectorAll(".pilula[data-med]").forEach(b => {
      const n = b.querySelector(".pilula__n"); if (n) n.textContent = contagem(b.dataset.med);
      b.addEventListener("click", () => {
        document.querySelectorAll(".pilula[data-med]").forEach(x => x.setAttribute("aria-pressed", x === b));
        aoMudar(b.dataset.med);
      });
    });
  }

  /* ---------- Gráficos (SVG) ---------------------------------------------
     Desenho único para as 3 telas; as cores vêm do CSS (proto.css, seções 17 e 18),
     então o mesmo gráfico clareia sozinho dentro do cartão escuro. */
  let nGrad = 0;
  /* Anel: p = % realizado; marca = % esperado hoje (opcional); rotulo = HTML do centro.
     esp = espessura em unidades do viewBox (0–100). */
  function anel({ p, marca, rotulo, aria, esp = 11 }) {
    const id = "ag" + (++nGrad), r = 50 - esp / 2 - 1, vis = Math.max(0, Math.min(p, 100));
    const arco = vis >= 99.9 ? `stroke-dasharray="100 0"` : `stroke-dasharray="${vis.toFixed(2)} 100"`;
    let m = "";
    if (marca != null && marca > 0 && marca < 100) {
      const a = marca * 3.6, y1 = 50 - r - esp / 2 - 2.5, y2 = 50 - r + esp / 2 + 2.5;
      m = `<g transform="rotate(${a.toFixed(1)} 50 50)"><line class="anel__halo" x1="50" x2="50" y1="${y1}" y2="${y2}" stroke-width="6.5"/><line class="anel__marca" x1="50" x2="50" y1="${y1}" y2="${y2}" stroke-width="2.4"/></g>`;
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" class="anel__c1"/><stop offset="1" class="anel__c2"/></linearGradient></defs>
      <circle class="anel__trilho" cx="50" cy="50" r="${r}" stroke-width="${esp}"/>
      ${vis > 0 ? `<circle class="anel__arco" cx="50" cy="50" r="${r}" stroke-width="${esp}" pathLength="100" ${arco} stroke="url(#${id})" transform="rotate(-90 50 50)"/>` : ""}
      ${m}</svg><span class="anel__v">${rotulo != null ? rotulo : `${Math.round(p)}<small>%</small>`}</span>`;
  }
  /* Preenche um .anel existente (mantém tamanho e atributos do HTML) */
  function poeAnel(el, o) { el.innerHTML = anel(o); if (o.aria) { el.setAttribute("role", "img"); el.setAttribute("aria-label", o.aria); } }

  /* Barra com faixa de meta: v, m1 (meta), m2 (supermeta), r (esperado hoje) em % da escala.
     estado: ok | atencao | atrasado (cor só na ponta). rotulo: texto curto sobre o marcador. */
  function barra({ v, m1, m2, r, estado = "", rotulo, aria, alt = "md" }) {
    const id = "bg" + (++nGrad), t = alt === "sm" ? 6 : 10, H = t + 10, y = (H - t) / 2, c = H / 2;
    const pc = x => Math.max(0, Math.min(100, x)).toFixed(2) + "%";
    const vv = Math.max(0, Math.min(100, v));
    const faixa = m2 > m1 ? `<rect class="bm__faixa" x="${pc(m1)}" y="${y - 3}" width="${pc(m2 - m1)}" height="${t + 6}" rx="4"/>
      <line class="bm__meta" x1="${pc(m1)}" x2="${pc(m1)}" y1="${y - 3}" y2="${y + t + 3}"/><line class="bm__sup" x1="${pc(m2)}" x2="${pc(m2)}" y1="${y - 3}" y2="${y + t + 3}"/>` : "";
    const ritmo = r != null ? `<line class="bm__ritmo" x1="${pc(r)}" x2="${pc(r)}" y1="0" y2="${H}"/>` : "";
    const ponta = vv > 0 ? `<circle class="bm__ponta" cx="${pc(vv)}" cy="${c}" r="${t / 2 + 2}"/>` : "";
    let rot = "";
    if (rotulo && r != null) {
      const pos = r < 18 ? `left:${pc(r)};transform:translateX(-2px)` : r > 82 ? `right:${pc(100 - r)};transform:translateX(2px)` : `left:${pc(r)};transform:translateX(-50%)`;
      rot = `<span class="bm__rot" style="${pos}" aria-hidden="true">${rotulo}</span>`;
    }
    return `<div class="bm${estado ? " bm--" + estado : ""}${rot ? " bm--rot" : ""}"${aria ? ` role="img" aria-label="${aria}"` : ""}>${rot}
      <svg class="bm__svg" height="${H}" aria-hidden="true" focusable="false">
        <defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="bm__c1"/><stop offset="1" class="bm__c2"/></linearGradient></defs>
        <rect class="bm__trilho" x="0" y="${y}" width="100%" height="${t}" rx="${t / 2}"/>
        ${faixa}
        ${vv > 0 ? `<rect x="0" y="${y}" width="${pc(vv)}" height="${t}" rx="${t / 2}" fill="url(#${id})"/>` : ""}
        ${ritmo}${ponta}
      </svg></div>`;
  }
  const estadoDe = cls => (cls || "").replace("status--", "");

  /* ---------- Números que cabem no cartão -------------------------------
     O CSS dimensiona .kpi__valor com clamp(mín, largura disponível ÷ --ch, máx).
     Aqui só medimos a largura do texto em "em" (--ch) depois de cada render. */
  function medeNumeros() {
    document.querySelectorAll(".kpi__valor").forEach(el => {
      const s = el.style;
      s.setProperty("font-size", "100px", "important"); s.width = "max-content"; s.maxWidth = "none";
      const w = el.getBoundingClientRect().width;
      s.removeProperty("font-size"); s.width = ""; s.maxWidth = "";
      if (w) s.setProperty("--ch", (w / 100 + .06).toFixed(3));
    });
    // Títulos de KPI cortados com reticências mostram o texto inteiro ao passar o mouse
    document.querySelectorAll(".kpi__rot").forEach(el => { if (!el.title) el.title = el.textContent.trim(); });
  }
  let pendente = 0;
  const agenda = () => { if (!pendente) pendente = requestAnimationFrame(() => { pendente = 0; medeNumeros(); }); };
  const raiz = document.querySelector("main");
  if (raiz) new MutationObserver(agenda).observe(raiz, { childList: true, subtree: true, characterData: true });
  if (document.fonts) document.fonts.ready.then(agenda);
  agenda();


  /* ---------- Contato: WhatsApp e "Adicionar à agenda" -------------------
     Sem API: o WhatsApp abre por link (wa.me) com a mensagem pronta e editável; a agenda
     abre o Google Agenda por link ou baixa um convite .ics gerado aqui (Blob).
     Nada de diagnóstico, valor ou detalhe clínico nas mensagens e nos convites. */
  const CLINICA = "Clínica Aurora";
  const MED_NOME = { g: "Dr. Rafael Sena", d: "Dra. Lúcia Sena" };
  const MED_ART = { g: "o Dr. Rafael Sena", d: "a Dra. Lúcia Sena" };
  const SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const ANO_ATUAL = 2026;
  const quando = dm => {
    if (dm === window.VA.HOJE) return `hoje (${dm})`;
    const [d, m] = dm.split("/").map(Number);
    return `${SEMANA[new Date(ANO_ATUAL, m - 1, d).getDay()]}, ${dm}`;
  };
  // Procedimento genérico (só a família). Não entra nas mensagens de WhatsApp: elas não citam procedimento, queixa ou valor.
  const FAMILIA = [[/toxina|botox/i, "aplicação de toxina"], [/laser/i, "sessão de laser"], [/peeling/i, "sessão de peeling"],
    [/bioestimulador/i, "aplicação de bioestimulador"], [/skinbooster/i, "sessão de skinbooster"]];
  const procGen = p => (FAMILIA.find(([r]) => r.test(p.proc)) || [0, "sessão"])[1];
  const COMPROMISSO = { "1ª consulta": "sua consulta", "Retorno": "seu retorno", "Procedimento": "seu horário", "Recall": "seu horário de manutenção" };
  function desde(ult) {
    const [d, m, a] = ult.split("/").map(Number), [hd, hm] = window.VA.HOJE.split("/").map(Number);
    const meses = Math.round((new Date(ANO_ATUAL, hm - 1, hd) - new Date(a, m - 1, d)) / 864e5 / 30.4);
    return meses <= 1 ? "cerca de 1 mês" : `cerca de ${meses} meses`;
  }
  const MODELOS = {
    confirmacao: { rot: "Confirmação de consulta", txt: c => `Olá, ${c.nome}! Tudo bem?\n\nPassando para confirmar ${c.compromisso} com ${c.medArt} ${c.quando}, às ${c.hora}.\n\nPodemos confirmar? Se precisar de outro horário, é só responder por aqui.` },
    followup:    { rot: "Follow-up · ainda não agendou", txt: c => `Olá, ${c.nome}! Tudo bem?\n\nAgradecemos seu contato. Gostaria de agendar sua consulta de avaliação com ${c.medArt}? Temos horários nos próximos dias; me conte o melhor dia e período para você.` },
    plano:       { rot: "Retomada de plano", txt: c => `Olá, ${c.nome}! Tudo bem?\n\n${c.medCap} pediu para saber como você está e se ficou alguma dúvida sobre o plano que vocês conversaram. Se quiser, posso reservar um horário para começar ou para conversar com calma.` },
    recall:      { rot: "Recall · manutenção", txt: c => `Olá, ${c.nome}! Tudo bem?\n\nJá faz ${c.desde} desde o seu último atendimento com ${c.medArt}. É um bom momento para agendar a manutenção. Quer que eu veja um horário para você?` },
    falta:       { rot: "Remarcação de falta", txt: c => `Olá, ${c.nome}! Tudo bem?\n\nSentimos sua falta na consulta de ${c.data} com ${c.medArt}. Imprevistos acontecem! Vamos remarcar? Me conte o melhor dia e período e eu reservo um horário para você.` },
  };
  function mensagem(id, modelo) {
    const p = window.VA.P[id], cons = window.VA.consulta(id) || {};
    const c = {
      nome: p.nome.split(" ")[0], medArt: MED_ART[p.med], medCap: MED_ART[p.med].replace(/^./, s => s.toUpperCase()),
      quando: cons.data ? quando(cons.data) : "", hora: cons.hora || "", compromisso: COMPROMISSO[cons.tipo] || "sua consulta",
      desde: p.ult ? desde(p.ult) : "algum tempo", proc: procGen(p), data: p.dh ? p.dh[0] : "",
    };
    return MODELOS[modelo].txt(c) + `\n\n${CLINICA}`;
  }
  const foneFmt = n => `+55 (${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  const linkWa = (id, txt) => `https://wa.me/55${window.VA.fone(id)}?text=${encodeURIComponent(txt)}`;

  /* Tentativas registradas nesta sessão (só no front). Relógio simulado a partir de 09:40. */
  const REG = {}; let minutos = 0;
  const ordinal = n => `${n}ª tentativa`;
  const regTexto = id => REG[id] ? `${ordinal(REG[id].n)} · hoje ${REG[id].h}` : "";
  const regTent = id => `<span class="wa-reg" data-reg="${id}"${REG[id] ? "" : " hidden"}><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span>${regTexto(id)}</span></span>`;
  function registra(id) {
    const [h, m] = window.VA.AGORA.split(":").map(Number), t = h * 60 + m + (++minutos);
    REG[id] = { n: (REG[id] ? REG[id].n : (window.VA.P[id].tent || 0)) + 1, h: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}` };
    document.querySelectorAll(`[data-reg="${id}"]`).forEach(el => { el.hidden = false; el.querySelector("span").textContent = regTexto(id); });
    avisa(`WhatsApp aberto para ${window.VA.P[id].nome}: ${regTexto(id)}`);
  }
  let vivo;
  function avisa(t) {
    if (!vivo) { vivo = document.createElement("div"); vivo.className = "sr"; vivo.setAttribute("aria-live", "polite"); document.body.appendChild(vivo); }
    vivo.textContent = ""; setTimeout(() => { vivo.textContent = t; }, 30);
  }

  /* Botões (HTML). Use em qualquer tela; os cliques são tratados por delegação abaixo. */
  const btWa = (id, modelo) => modelo ? `<button type="button" class="bt-ico bt-ico--sm bt-ico--plano bt-wa" data-wa="${modelo}" data-id="${id}" aria-haspopup="dialog" aria-label="WhatsApp para ${window.VA.P[id].nome} · ${MODELOS[modelo].rot}" title="WhatsApp · ${MODELOS[modelo].rot}"><svg class="ico" aria-hidden="true"><use href="#i-whats"/></svg></button>` : "";
  const btAgenda = id => {
    const c = window.VA.consulta(id); if (!c) return "";
    return `<button type="button" class="bt-ico bt-ico--sm bt-ico--plano bt-agenda" data-agenda data-id="${id}" aria-haspopup="menu" aria-expanded="false" aria-label="Adicionar à agenda: ${window.VA.P[id].nome}, ${c.data} às ${c.hora}" title="Adicionar à agenda"><svg class="ico" aria-hidden="true"><use href="#i-cal-mais"/></svg></button>`;
  };

  /* Camadas flutuantes: posição junto ao botão (no celular, a do WhatsApp vira gaveta inferior) */
  const celular = () => matchMedia("(max-width: 720px)").matches;
  function posiciona(el, bt) {
    if (el.classList.contains("wa-pop") && celular()) { el.style.left = el.style.top = ""; return; }
    const r = bt.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, m = 12, vw = innerWidth, vh = innerHeight;
    let x = Math.min(Math.max(m, r.right - w), vw - w - m), y = r.bottom + 8;
    if (y + h > vh - m && r.top - 8 - h >= m) y = r.top - 8 - h;
    y = Math.max(m, Math.min(y, vh - h - m));
    el.style.left = x + "px"; el.style.top = y + "px";
  }
  const focaveis = el => [...el.querySelectorAll("a[href],button,select,textarea,[tabindex]:not([tabindex='-1'])")].filter(x => !x.hidden && x.offsetParent !== null);
  let aberto = null;  // { el, bt, fechar }
  function fechaCamada(devolveFoco = true) {
    if (!aberto) return;
    const { el, bt } = aberto; aberto = null;
    el.hidden = true; document.getElementById("camada-veu").hidden = true;
    if (bt.hasAttribute("aria-expanded")) bt.setAttribute("aria-expanded", "false");
    if (devolveFoco && document.contains(bt)) bt.focus();
  }
  function veu() {
    let v = document.getElementById("camada-veu");
    if (!v) { v = document.createElement("div"); v.id = "camada-veu"; v.className = "camada-veu"; v.hidden = true; v.addEventListener("click", () => fechaCamada()); document.body.appendChild(v); }
    return v;
  }

  /* Pré-visualização do WhatsApp */
  function popWa() {
    let el = document.getElementById("wa-pop"); if (el) return el;
    document.body.insertAdjacentHTML("beforeend", `
    <div class="wa-pop" id="wa-pop" role="dialog" aria-modal="true" aria-labelledby="wa-tit" aria-describedby="wa-aviso" hidden>
      <div class="wa-pop__cab">
        <span class="wa-pop__ico" aria-hidden="true"><svg class="ico"><use href="#i-whats"/></svg></span>
        <div class="wa-pop__quem"><h2 id="wa-tit"></h2><span id="wa-quem"></span></div>
        <button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-fecha aria-label="Fechar"><svg class="ico ico-sm"><use href="#i-fechar"/></svg></button>
      </div>
      <label class="wa-pop__rot" for="wa-modelo">Modelo</label>
      <div class="wa-pop__sel"><select id="wa-modelo">${Object.entries(MODELOS).map(([k, m]) => `<option value="${k}">${m.rot}</option>`).join("")}</select></div>
      <label class="wa-pop__rot" for="wa-txt">Mensagem <span>pode editar antes de abrir</span></label>
      <textarea id="wa-txt" rows="8" spellcheck="true"></textarea>
      <p class="wa-pop__aviso" id="wa-aviso"><svg class="ico ico-sm" aria-hidden="true"><use href="#i-info"/></svg>Sem procedimento, diagnóstico ou valores.</p>
      <div class="wa-pop__pe">
        <button type="button" class="bt-texto" data-fecha>Cancelar</button>
        <a class="bt-wa-abrir" id="wa-abrir" href="#" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-whats"/></svg>Abrir no WhatsApp</a>
      </div>
    </div>`);
    el = document.getElementById("wa-pop");
    const txt = el.querySelector("#wa-txt"), abrir = el.querySelector("#wa-abrir"), sel = el.querySelector("#wa-modelo");
    const atualiza = () => { abrir.href = linkWa(el.dataset.id, txt.value); };
    txt.addEventListener("input", atualiza);
    sel.addEventListener("change", () => { txt.value = mensagem(el.dataset.id, sel.value); atualiza(); });
    el.querySelectorAll("[data-fecha]").forEach(b => b.addEventListener("click", () => fechaCamada()));
    abrir.addEventListener("click", () => { atualiza(); const id = el.dataset.id; setTimeout(() => { fechaCamada(); registra(id); }, 0); });
    return el;
  }
  function abreWa(bt) {
    fechaCamada(false);
    const id = bt.dataset.id, p = window.VA.P[id], el = popWa();
    el.dataset.id = id;
    el.querySelector("#wa-tit").textContent = p.nome;
    el.querySelector("#wa-quem").textContent = `${foneFmt(window.VA.fone(id))} · ${nomeMed(p.med)}`;
    el.querySelector("#wa-modelo").value = bt.dataset.wa;
    const txt = el.querySelector("#wa-txt"); txt.value = mensagem(id, bt.dataset.wa);
    el.querySelector("#wa-abrir").href = linkWa(id, txt.value);
    veu().hidden = false; el.hidden = false; posiciona(el, bt);
    aberto = { el, bt };
    txt.focus(); txt.setSelectionRange(0, 0); txt.scrollTop = 0;
  }

  /* Adicionar à agenda: Google Agenda (link) ou convite .ics (download) */
  const DURACAO = { "1ª consulta": 60, "Retorno": 30, "Procedimento": 60, "Recall": 45 };
  const TIPO_TXT = { "1ª consulta": "1ª consulta", "Retorno": "Retorno", "Procedimento": "Atendimento", "Recall": "Retorno de manutenção" };
  function evento(id) {
    const p = window.VA.P[id], c = window.VA.consulta(id);
    const [d, m] = c.data.split("/").map(Number), [h, mi] = c.hora.split(":").map(Number), dur = DURACAO[c.tipo] || 60;
    // São Paulo = UTC−3 o ano todo (sem horário de verão desde 2019)
    const ini = new Date(Date.UTC(ANO_ATUAL, m - 1, d, h + 3, mi)), fim = new Date(ini.getTime() + dur * 6e4);
    return { p, c, ini, fim, dur, titulo: `Consulta · ${p.nome} · ${MED_NOME[p.med]}`,
      detalhes: `${TIPO_TXT[c.tipo] || "Consulta"} na ${CLINICA}, com ${MED_ART[p.med]}. Duração prevista: ${dur} min.` };
  }
  const z2 = n => String(n).padStart(2, "0");
  const local = dt => { const t = new Date(dt.getTime() - 3 * 36e5); return `${t.getUTCFullYear()}${z2(t.getUTCMonth() + 1)}${z2(t.getUTCDate())}T${z2(t.getUTCHours())}${z2(t.getUTCMinutes())}00`; };
  const utc = dt => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linkGoogle = e => "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(e.titulo)}&dates=${local(e.ini)}/${local(e.fim)}&details=${encodeURIComponent(e.detalhes)}` +
    `&location=${encodeURIComponent(CLINICA)}&ctz=America/Sao_Paulo`;
  const escICS = s => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  function dobra(linha) {  // RFC 5545: no máximo 75 octetos por linha
    const enc = new TextEncoder(), out = []; let atual = "", n = 0;
    for (const ch of linha) {
      const b = enc.encode(ch).length;
      if (n + b > (out.length ? 74 : 75)) { out.push(atual); atual = ""; n = 0; }
      atual += ch; n += b;
    }
    out.push(atual); return out.join("\r\n ");
  }
  function ics(e) {
    const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Clinica Clínica Aurora//Planilha Inteligente//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT", `UID:${e.p.id}-${utc(e.ini)}@clinica-aurora.invalid`, `DTSTAMP:${utc(new Date())}`,
      `DTSTART:${utc(e.ini)}`, `DTEND:${utc(e.fim)}`, `SUMMARY:${escICS(e.titulo)}`, `DESCRIPTION:${escICS(e.detalhes)}`, `LOCATION:${escICS(CLINICA)}`,
      "STATUS:CONFIRMED", "TRANSP:OPAQUE", "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escICS(e.titulo)}`, "TRIGGER:-PT1H", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"];
    return linhas.map(dobra).join("\r\n") + "\r\n";
  }
  const semAcento = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function baixaIcs(id) {
    const e = evento(id), blob = new Blob([ics(e)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a"), [d, m] = e.c.data.split("/");
    a.href = URL.createObjectURL(blob); a.download = `consulta-${semAcento(e.p.nome)}-${ANO_ATUAL}-${m}-${d}.ics`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    avisa(`Convite de ${e.p.nome} baixado`);
  }
  function menuAgenda() {
    let el = document.getElementById("ag-menu"); if (el) return el;
    document.body.insertAdjacentHTML("beforeend", `
    <div class="ag-menu" id="ag-menu" hidden>
      <p class="ag-menu__tit" id="ag-tit"></p>
      <div role="menu" aria-labelledby="ag-tit">
        <a role="menuitem" class="ag-menu__item" id="ag-google" href="#" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-agenda"/></svg><span>Google Agenda<small>abre em nova aba</small></span></a>
        <button type="button" role="menuitem" class="ag-menu__item" id="ag-ics"><svg class="ico" aria-hidden="true"><use href="#i-baixar"/></svg><span>Arquivo de convite (.ics)<small>Outlook, Apple, outros</small></span></button>
      </div>
    </div>`);
    el = document.getElementById("ag-menu");
    el.querySelector("#ag-google").addEventListener("click", () => setTimeout(() => fechaCamada(), 0));
    el.querySelector("#ag-ics").addEventListener("click", () => { baixaIcs(el.dataset.id); fechaCamada(); });
    el.addEventListener("keydown", ev => {
      const itens = [...el.querySelectorAll("[role=menuitem]")], i = itens.indexOf(document.activeElement);
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); itens[(i + (ev.key === "ArrowDown" ? 1 : -1) + itens.length) % itens.length].focus(); }
      else if (ev.key === "Home" || ev.key === "End") { ev.preventDefault(); itens[ev.key === "Home" ? 0 : itens.length - 1].focus(); }
      else if (ev.key === "Tab") { fechaCamada(false); }
    });
    return el;
  }
  function abreAgenda(bt) {
    const mesmo = aberto && aberto.bt === bt; fechaCamada(false); if (mesmo) return;
    const id = bt.dataset.id, e = evento(id), el = menuAgenda();
    el.dataset.id = id;
    const [d, m] = e.c.data.split("/").map(Number), dia = SEMANA[new Date(ANO_ATUAL, m - 1, d).getDay()].slice(0, 3);
    const fimTxt = local(e.fim).slice(9, 13).replace(/(\d\d)(\d\d)/, "$1:$2");
    el.querySelector("#ag-tit").innerHTML = `<b>${e.titulo}</b><span>${dia} ${e.c.data} · ${e.c.hora}–${fimTxt}</span>`;
    el.querySelector("#ag-google").href = linkGoogle(e);
    veu().hidden = false; el.hidden = false; posiciona(el, bt); bt.setAttribute("aria-expanded", "true");
    aberto = { el, bt };
    el.querySelector("[role=menuitem]").focus();
  }

  /* Delegação de cliques e teclado (vale para listas re-renderizadas) */
  document.addEventListener("click", ev => {
    const w = ev.target.closest("[data-wa]"); if (w) { ev.preventDefault(); abreWa(w); return; }
    const a = ev.target.closest("[data-agenda]"); if (a) { ev.preventDefault(); abreAgenda(a); }
  });
  document.addEventListener("keydown", ev => {
    if (!aberto) return;
    if (ev.key === "Escape") { ev.preventDefault(); fechaCamada(); return; }
    if (ev.key === "Tab" && aberto.el.id === "wa-pop") {  // foco preso na pré-visualização
      const f = focaveis(aberto.el), pri = f[0], ult = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === pri) { ev.preventDefault(); ult.focus(); }
      else if (!ev.shiftKey && document.activeElement === ult) { ev.preventDefault(); pri.focus(); }
    }
  });
  addEventListener("resize", () => aberto && posiciona(aberto.el, aberto.bt));
  addEventListener("scroll", () => aberto && posiciona(aberto.el, aberto.bt), { passive: true });

  window.UI = { br, mil, real, rsMil, ini, nomeMed, av, escala, TEMP, linhaDoTempo, miniCal, pilulasMedico, anel, poeAnel, barra, estadoDe, medeNumeros,
    btWa, btAgenda, regTent, mensagem, MODELOS, procGen, evento, ics, linkGoogle, linkWa };
})();
