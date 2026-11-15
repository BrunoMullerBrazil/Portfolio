/* =====================================================================
   telas.js · camadas e destinos comuns a todas as telas
   Carregar DEPOIS de comum.js e do script da página, ANTES de motion.js.
   - "+ Novo lead": gaveta com formulário curto (entra no Funil desta sessão)
   - Buscar paciente: busca rápida em sobreposição ("/" ou Ctrl+K)
   - Avisos: painel suspenso com os avisos do dia
   - Perfil (avatar no topo): Ajustes, Recall e Relatórios no celular, Sair
   - Ficha do paciente: gaveta aberta pelas setas "Abrir ficha" e pela busca
   - Destinos para os botões que não levavam a lugar nenhum
   Acessibilidade: Esc fecha, foco preso nas camadas modais e devolvido ao botão.
   ===================================================================== */
(function () {
  "use strict";
  const VA = window.VA, UI = window.UI, VA2 = window.VA2 || {};
  const doc = document, body = doc.body, pagina = body.dataset.pagina || "";
  const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.22,1,.36,1)", EASE_IN = "cubic-bezier(.55,0,.75,.3)";
  const celular = () => matchMedia("(max-width: 720px)").matches;
  const $ = (s, r = doc) => r.querySelector(s);
  const anima = (el, kf, o) => { try { return el.animate(kf, o); } catch (e) { return null; } };
  const ico = (id, cls = "ico") => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const semAcento = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = new URLSearchParams(location.search);

  /* ---------- Quem está usando (mesma regra de motion.js) --------------- */
  // nome: ?nome= ou o salvo na entrada; perfil: ?perfil= ou o salvo (gestao | medico | sdr | recepcao | closer)
  // (o perfil também pode estar só na sessão: perfis.js grava nos dois e lê localStorage, depois sessionStorage)
  const lsGet = k => { try { return localStorage.getItem(k) || (k === "munin:perfil" ? sessionStorage.getItem(k) : null); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const quem = (() => {
    const CONTAS = VA2.CONTAS || [], PERFS = VA2.PERFIS || {};
    const valido = k => !!k && Object.prototype.hasOwnProperty.call(PERFS, k);
    const contaDe = n => CONTAS.find(c => c.nome === n) || (n === "Dr. Rafael" ? { nome: n, completo: "Dr. Rafael Sena", email: "rafael@clinica-aurora.com.br", perfil: "medico", ini: "RS", cor: "g" } : null);
    const qn = (q.get("nome") || "").trim().slice(0, 40), qp = (q.get("perfil") || "").toLowerCase();
    const salvo = (lsGet("munin:nome") || lsGet("vam:nome") || "").trim().slice(0, 40);
    // perfil: o do endereço, o salvo, o da pessoa nomeada; sem nada, Gestão (a mesma regra de perfis.js)
    const pk = valido(qp) ? qp : valido(lsGet("munin:perfil")) ? lsGet("munin:perfil")
      : ((contaDe(qn) || contaDe(salvo) || {}).perfil || "gestao");
    // nome: o do endereço; senão o salvo, se combinar com o perfil; senão a conta daquele perfil
    let n = qn;
    if (!n) { const cs = contaDe(salvo); n = salvo && (!cs || cs.perfil === pk) ? salvo : ((CONTAS.find(c => c.perfil === pk) || {}).nome || "Dra. Lúcia"); }
    // quem entrou pelo endereço fica lembrado nas outras telas (como a tela de entrada faz)
    if (qn || valido(qp)) { lsSet("munin:nome", n); lsSet("munin:perfil", pk); }
    const conta = contaDe(n) || { completo: n, email: "", perfil: pk, ini: UI.ini(n.replace(/^Dra?\. /, "") + " x"), cor: "r" };
    const perf = PERFS[pk] || { rot: pk };
    return Object.assign({ nome: n }, conta, { perfilK: pk, perfil: perf.rot });
  })();

  // motion.js e perfis.js leem ?nome=; para a saudação seguir a mesma pessoa em todas as telas,
  // o nome resolvido acima volta para o endereço antes deles.
  if (q.get("nome") !== quem.nome) {
    const u = new URL(location.href); u.searchParams.set("nome", quem.nome); history.replaceState(history.state, "", u.pathname + u.search + u.hash);
  }

  /* ---------- Aviso pela base (usa o de motion.js quando existe) -------- */
  function aviso(html) {
    if (window.VAM && typeof window.VAM.aviso === "function") { window.VAM.aviso(html); return; }
    const t = doc.createElement("div"); t.className = "tl-toast"; t.setAttribute("role", "status"); t.innerHTML = html; body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  /* =====================================================================
     Gerente de camadas: uma aberta por vez, véu, Esc, foco preso
     ===================================================================== */
  const veu = doc.createElement("div"); veu.className = "tl-veu"; veu.hidden = true; body.appendChild(veu);
  let aberta = null;   // { el, bt, modal }
  const focaveis = el => [...el.querySelectorAll("a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex='-1'])")].filter(x => !x.closest("[hidden]") && x.getClientRects().length);
  function entra(el, tipo) {
    if (REDUZ) { anima(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 180 }); return; }
    const kf = tipo === "gaveta" ? (celular() ? [{ transform: "translateY(40px)", opacity: 0 }, { transform: "none", opacity: 1 }] : [{ transform: "translateX(28px)", opacity: 0 }, { transform: "none", opacity: 1 }])
      : tipo === "busca" ? [{ transform: "translate(-50%, -10px) scale(.985)", opacity: 0, filter: "blur(4px)" }, { transform: "translate(-50%, 0) scale(1)", opacity: 1, filter: "blur(0)" }]
      : [{ transform: "translateY(-6px) scale(.985)", opacity: 0 }, { transform: "none", opacity: 1 }];
    anima(el, kf, { duration: tipo === "gaveta" ? 620 : 520, easing: EASE });
    // conteúdo da gaveta entra em cascata
    if (tipo === "gaveta" || tipo === "pop") [...el.querySelectorAll("[data-entra]")].forEach((c, i) =>
      anima(c, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: 90 + Math.min(i * 50, 400), easing: EASE, fill: "backwards" }));
  }
  function abre(el, bt, { modal = true, tipo = "gaveta", foco } = {}) {
    fecha(false);
    veu.classList.toggle("tl-veu--leve", !modal); veu.hidden = false;
    if (modal) anima(veu, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUZ ? 150 : 360, easing: EASE });
    el.hidden = false; aberta = { el, bt, modal, tipo };
    if (bt && bt.hasAttribute("aria-expanded")) bt.setAttribute("aria-expanded", "true");
    if (modal) doc.querySelectorAll("main, .trilho").forEach(x => x.setAttribute("aria-hidden", "true"));
    entra(el, tipo);
    const alvo = foco ? (typeof foco === "string" ? el.querySelector(foco) : foco) : focaveis(el)[0];
    if (alvo) alvo.focus({ preventScroll: true });
  }
  function fecha(devolve = true) {
    if (!aberta) return;
    const { el, bt, modal, tipo } = aberta; aberta = null;
    doc.querySelectorAll("main, .trilho").forEach(x => x.removeAttribute("aria-hidden"));
    if (bt && bt.hasAttribute("aria-expanded")) bt.setAttribute("aria-expanded", "false");
    const some = () => { el.hidden = true; };
    if (REDUZ) { some(); veu.hidden = true; }
    else {
      const kf = tipo === "gaveta" ? (celular() ? [{ transform: "none", opacity: 1 }, { transform: "translateY(30px)", opacity: 0 }] : [{ transform: "none", opacity: 1 }, { transform: "translateX(20px)", opacity: 0 }])
        : tipo === "busca" ? [{ transform: "translate(-50%, 0)", opacity: 1 }, { transform: "translate(-50%, -6px)", opacity: 0 }]
        : [{ opacity: 1 }, { opacity: 0, transform: "translateY(-4px)" }];
      const a = anima(el, kf, { duration: 240, easing: EASE_IN });
      if (a) a.finished.then(some, some); else some();
      if (modal) { const b = anima(veu, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: EASE_IN }); if (b) b.finished.then(() => { if (!aberta) veu.hidden = true; }); else veu.hidden = true; }
      else veu.hidden = true;
    }
    if (devolve && bt && doc.contains(bt)) bt.focus({ preventScroll: true });
  }
  veu.addEventListener("click", () => {
    // pré-visualização do WhatsApp aberta por cima da gaveta: o clique fora fecha só ela (véu de comum.js)
    const cv = doc.getElementById("camada-veu");
    if (cv && !cv.hidden) { cv.click(); return; }
    fecha();
  });
  doc.addEventListener("keydown", e => {
    // atalhos da busca: "/" (fora de campos de texto) e Ctrl/⌘+K
    const campo = e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); abreBusca(); return; }
    if (e.key === "/" && !campo && !aberta && !doc.querySelector(".vam-tela")) { e.preventDefault(); abreBusca(); return; }
    if (!aberta || e.defaultPrevented) return;   // comum.js já tratou (pré-visualização do WhatsApp aberta)
    if (doc.querySelector(".wa-pop:not([hidden]), .ag-menu:not([hidden])")) return;
    if (e.key === "Escape") { e.preventDefault(); fecha(); return; }
    if (e.key === "Tab" && aberta.modal) {
      const f = focaveis(aberta.el); if (!f.length) return;
      const pri = f[0], ult = f[f.length - 1];
      if (!aberta.el.contains(doc.activeElement)) { e.preventDefault(); pri.focus(); }
      else if (e.shiftKey && doc.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && doc.activeElement === ult) { e.preventDefault(); pri.focus(); }
    }
  });
  // painéis suspensos (não modais) fecham ao clicar fora e ao rolar a página
  addEventListener("resize", () => { if (aberta && aberta.tipo === "pop") posiciona(aberta.el, aberta.bt); });

  function posiciona(el, bt) {
    if (!bt) return;
    const r = bt.getBoundingClientRect(), w = el.offsetWidth, m = 12;
    const x = Math.min(Math.max(m, r.right - w), innerWidth - w - m);
    el.style.left = x + "px"; el.style.top = Math.min(r.bottom + 10, innerHeight - el.offsetHeight - m) + "px";
  }

  /* =====================================================================
     Gaveta (novo lead e ficha usam a mesma)
     ===================================================================== */
  const gav = doc.createElement("aside");
  gav.className = "tl-gaveta"; gav.hidden = true; gav.setAttribute("role", "dialog"); gav.setAttribute("aria-modal", "true"); gav.setAttribute("aria-labelledby", "tl-gav-tit");
  body.appendChild(gav);
  const cabGaveta = (tit, sub, lado) => `<div class="tl-gaveta__cab">${lado || ""}<div style="min-width:0"><h2 id="tl-gav-tit">${tit}</h2>${sub ? `<p>${sub}</p>` : ""}</div>
    <button type="button" class="bt-ico bt-ico--sm bt-ico--plano" data-tl-fecha aria-label="Fechar">${ico("i-fechar", "ico ico-sm")}</button></div>`;
  gav.addEventListener("click", e => { if (e.target.closest("[data-tl-fecha]")) fecha(); });

  /* ---------- + Novo lead ---------------------------------------------- */
  const ORIGENS = ["Instagram", "Google", "Indicação", "Site", "Campanha", "Parceria", "Outro"];
  const INTERESSES = ["Toxina botulínica", "Bioestimulador", "Preenchimento labial", "Laser · rejuvenescimento", "Skinbooster", "Peeling químico", "Ultrassom microfocado", "Protocolo Natural Lift", "Liftera papada", "Tratamento de pele", "Consulta de pele", "Consulta dermatológica"];
  const POT = { toxina: 2400, bioestim: 4200, preench: 3200, laser: 3600, skin: 2200, peeling: 1200, ultrassom: 6500, protocolo: 6500, liftera: 4200, acne: 1800, mapeamento: 900, consulta: 600 };
  const mascara = v => { const d = v.replace(/\D/g, "").slice(0, 11); if (d.length <= 2) return d ? `(${d}` : ""; if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; };
  function formNovoLead(bt) {
    const medPadrao = quem.nome === "Dr. Rafael" ? "g" : "d";  // médica logada (ou padrão) fica pré-marcada
    gav.innerHTML = cabGaveta("Novo lead", "Entra no Funil como “Lead em contato”, com o 1º contato para hoje.", `<span class="tl-ico-cab">${ico("i-leads")}</span>`) + `
      <form class="tl-gaveta__corpo" id="tl-form-lead" novalidate>
        <div class="tl-campo" data-entra><label for="tl-nome">Nome</label><input class="tl-input" id="tl-nome" name="nome" autocomplete="off" placeholder="Nome e sobrenome" required aria-describedby="tl-nome-erro"><span class="tl-erro" id="tl-nome-erro"></span></div>
        <div class="tl-campo" data-entra><label for="tl-fone">WhatsApp</label><input class="tl-input" id="tl-fone" name="fone" inputmode="tel" autocomplete="off" placeholder="(11) 98765-4321" required aria-describedby="tl-fone-erro tl-fone-dica"><span class="tl-dica" id="tl-fone-dica">Celular com DDD. A primeira mensagem sai pronta, sem valores.</span><span class="tl-erro" id="tl-fone-erro"></span></div>
        <div class="tl-duas" data-entra>
          <div class="tl-campo"><label for="tl-origem">Origem</label><select class="tl-select" id="tl-origem" name="origem">${ORIGENS.map(o => `<option>${o}</option>`).join("")}</select></div>
          <div class="tl-campo"><label for="tl-int">Interesse</label><input class="tl-input" id="tl-int" name="proc" list="tl-int-lista" placeholder="Ex.: toxina" autocomplete="off"><datalist id="tl-int-lista">${INTERESSES.map(i => `<option value="${i}">`).join("")}</datalist></div>
        </div>
        <fieldset class="tl-escolha" data-entra><legend>Médico</legend>
          <label><input type="radio" name="med" value="g"${medPadrao === "g" ? " checked" : ""}><span class="av av--g av--sm" aria-hidden="true">RS</span>Dr. Rafael</label>
          <label><input type="radio" name="med" value="d"${medPadrao === "d" ? " checked" : ""}><span class="av av--d av--sm" aria-hidden="true">LS</span>Dra. Lúcia</label>
        </fieldset>
        <p class="tl-dica" data-entra>${ico("i-info", "ico ico-sm")} Não anote diagnóstico nem valores aqui; isso fica para a consulta.</p>
      </form>
      <div class="tl-gaveta__pe"><button type="button" class="tl-bt tl-bt--sec" data-tl-fecha>Cancelar</button><button type="submit" form="tl-form-lead" class="tl-bt">${ico("i-mais")}Adicionar ao funil</button></div>`;
    const f = $("#tl-form-lead", gav), fone = $("#tl-fone", gav);
    fone.addEventListener("input", () => { fone.value = mascara(fone.value); });
    f.addEventListener("submit", e => {
      e.preventDefault();
      const nome = f.nome.value.trim().replace(/\s+/g, " "), dig = fone.value.replace(/\D/g, "");
      const okNome = nome.split(" ").length >= 2 && nome.length >= 5, okFone = dig.length === 11 && dig[2] === "9";
      f.nome.setAttribute("aria-invalid", !okNome); $("#tl-nome-erro", gav).textContent = okNome ? "" : "Escreva nome e sobrenome.";
      fone.setAttribute("aria-invalid", !okFone); $("#tl-fone-erro", gav).textContent = okFone ? "" : "Use um celular com DDD: (11) 9XXXX-XXXX.";
      if (!okNome) { f.nome.focus(); return; } if (!okFone) { fone.focus(); return; }
      const proc = f.proc.value.trim() || "Consulta dermatológica", chave = Object.keys(POT).find(k => semAcento(proc).includes(k));
      const p = VA2.novoLead({ nome, fone: dig, origem: f.origem.value, proc, med: f.med.value, pot: POT[chave] || 1500 });
      if (pagina === "funil" && typeof LEADS !== "undefined" && typeof render === "function") { LEADS.push(p); render(); }   // eslint-disable-line no-undef
      confirmaLead(p, bt);
    });
    abre(gav, bt, { foco: "#tl-nome" });
  }
  function confirmaLead(p, bt) {
    const prim = p.nome.split(" ")[0];
    gav.innerHTML = cabGaveta("Novo lead", "") + `<div class="tl-gaveta__corpo"><div class="tl-ok" role="status">
      <span class="tl-ok__selo"><svg viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>
      <h3>${esc(prim)} entrou no funil</h3>
      <p>Lead em contato com ${UI.nomeMed(p.med)} · origem ${esc(p.origem)}. Próximo passo: 1º contato hoje.</p>
      <div class="tl-ficha__acoes" style="justify-content:center">${UI.btWa(p.id, "followup")}${UI.regTent(p.id)}<span class="tl-dica">Mandar a 1ª mensagem agora</span></div>
      <div class="tl-ok__acoes">
        ${pagina === "funil" ? `<button type="button" class="tl-bt tl-bt--sec" data-tl-ver="${p.id}">Ver no quadro</button>` : `<a class="tl-bt tl-bt--sec" href="funil.html?ficha=${p.id}">Ver no funil</a>`}
        <button type="button" class="tl-bt" data-tl-outro>${ico("i-mais")}Adicionar outro</button>
      </div></div></div>`;
    $("[data-tl-outro]", gav).addEventListener("click", () => formNovoLead(bt));
    const ver = $("[data-tl-ver]", gav); if (ver) ver.addEventListener("click", () => { fecha(false); destaca(p.id); });
    $("h3", gav).setAttribute("tabindex", "-1"); $("h3", gav).focus({ preventScroll: true });
    aviso(`Lead adicionado · <b>${esc(p.nome)}</b>`);
  }

  /* ---------- Ficha do paciente --------------------------------------- */
  const ETAPA = id => (VA.ETAPAS.find(e => e.k === id) || {}).nome;
  const recallDe = id => VA2.recall ? VA2.recall().find(r => r.id === id) : null;
  function destino(p) {
    const r = recallDe(p.id), c = VA.consulta(p.id), hoje = VA.AGENDA.find(a => a.id === p.id);
    if (p.etapa) return { pg: "funil", href: `funil.html?ficha=${p.id}`, rot: p.etapa === "fechou" ? `Funil · fechou ${p.dt}` : `Funil · ${VA.ETAPAS.find(e => e.k === p.etapa).curto}` };
    if (r) return { pg: "recall", href: `recall.html?ficha=${p.id}`, rot: r.dias < 0 ? `Recall · venceu há ${-r.dias} ${r.dias === -1 ? "dia" : "dias"}` : `Recall · vence ${r.venc}` };
    if (hoje) return { pg: "agenda", href: `agenda.html?ficha=${p.id}`, rot: `Agenda · hoje ${hoje.h}` };
    if (c) return { pg: "agenda", href: `agenda.html?ficha=${p.id}`, rot: `Agenda · ${c.data} ${c.hora}` };
    return { pg: pagina, href: null, rot: "Ficha" };
  }
  const modeloWa = p => {
    const r = recallDe(p.id), c = VA.consulta(p.id);
    if (p.etapa === "contato") return "followup";
    if (p.falta) return "falta";
    if (c) return "confirmacao";
    if (p.etapa === "plano") return "plano";
    if (r && !r.naClinica) return "recall";
    return p.etapa === "fechou" || p.etapa === "compareceu" ? "plano" : (p.ult ? "recall" : "confirmacao");
  };
  function abreFicha(id, bt) {
    const p = VA.P[id]; if (!p) return;
    const c = VA.consulta(id), r = recallDe(id), d = destino(p), hoje = VA.AGENDA.find(a => a.id === id);
    const fone = VA.fone(id), foneTxt = `(${fone.slice(0, 2)}) ${fone.slice(2, 7)}-${fone.slice(7)}`;
    let wa = modeloWa(p); if (wa === "confirmacao" && !c) wa = p.ult ? "recall" : "followup";
    // §4e: SDR e Recepção não abrem o plano nem veem valores de plano (matriz de Ajustes, via perfis.js)
    const pf = window.MUNIN_PERFIL || quem.perfilK;
    const verValor = window.MUNIN_VISAO ? window.MUNIN_VISAO.plano !== false : (pf !== "sdr" && pf !== "recepcao");
    const linhas = [
      ["Médico", UI.nomeMed(p.med)],
      ["WhatsApp", `<span class="num">${foneTxt}</span>`],
      ["Origem", `<span class="chip">${esc(p.origem)}</span>${p.carteira ? ` <span class="chip chip--borda">Carteira ${p.carteira}</span>` : ""}`],
      [p.etapa ? "Interesse" : "Procedimento", esc(p.proc)],
      p.etapa ? ["Etapa", `${ETAPA(p.etapa)}${p.sev && p.etapa !== "fechou" ? ` <span class="status ${p.sev === "atrasado" ? "status--atrasado" : p.sev === "atencao" ? "status--atencao" : p.sev === "ok" ? "status--ok" : "status--neutro"}">${p.sev === "atrasado" && p.venc ? `${p.venc} ${p.venc === 1 ? "dia" : "dias"} de atraso` : p.d === 0 ? "hoje" : p.d + (p.d === 1 ? " dia" : " dias")}</span>` : ""}`] : null,
      !verValor ? null : p.v ? ["Valor do plano", `R$ ${UI.real(p.v)}${p.total && p.total !== p.v ? ` <span class="muted">de R$ ${UI.real(p.total)}</span>` : ""}`] : p.pot ? ["Ticket estimado", `≈ R$ ${UI.real(p.pot)}`] : null,
      hoje ? ["Hoje", `${hoje.h} · ${hoje.tipo} <span class="status ${VA.ST_AGENDA[hoje.st][0]}">${VA.ST_AGENDA[hoje.st][1]}</span>`] : c ? ["Próxima consulta", `${c.data} às ${c.hora} · ${c.tipo}`] : null,
      p.ult ? ["Última sessão", `${p.ult.slice(0, 5)}${r ? ` · ${r.dias < 0 ? `recall venceu há ${-r.dias} ${r.dias === -1 ? "dia" : "dias"}` : `recall vence ${r.venc}`}` : ""}`] : null,
    ].filter(Boolean);
    const hist = [];
    if (p.lead) hist.push([`Lead criado`, `${p.lead.slice(0, 5)} · ${p.origem}`]);
    if (p.dh) hist.push([p.falta ? "Faltou à 1ª consulta" : p.semReg ? "1ª consulta sem registro" : "1ª consulta", `${p.dh[0]} às ${p.dh[1]}`]);
    if (p.etapa === "plano" || p.etapa === "fechou") hist.push([p.etapa === "fechou" ? `Fechou plano` : "Plano apresentado", p.etapa === "fechou" ? (verValor ? `${p.dt} · R$ ${UI.real(p.v)}` : p.dt) : (verValor ? `R$ ${UI.real(p.v)}` : UI.nomeMed(p.med))]);
    if (p.ult) hist.push(["Última sessão", p.ult]);
    if (p.nota) hist.push([p.nota, p.prox || "Próximo passo", true]);
    // revisão pacotes: selo do plano fechado nesta sessão (a etapa em VA.P não muda)
    try { if (sessionStorage.getItem("munin:fechado:" + id)) hist.push(["Plano fechado nesta sessão", "pela tela do plano", true]); } catch (e) { /* sem armazenamento */ }
    // plano só depois da 1ª consulta (como o cartão do quadro) ou para paciente fora do funil (recall, agenda)
    const podePlano = pf !== "sdr" && pf !== "recepcao" && (!p.etapa || ["compareceu", "plano", "fechou"].includes(p.etapa));
    const links = [["plano", "Montar plano", `plano.html?p=${id}`, podePlano], ["funil", "Ver no funil", `funil.html?ficha=${id}`, !!p.etapa], ["agenda", "Ver na agenda", `agenda.html?ficha=${id}`, !!(c || hoje)], ["recall", "Ver no recall", `recall.html?ficha=${id}`, !!r]]
      .filter(l => l[3] && l[0] !== pagina).map(l => `<a class="bt-sec" href="${l[2]}">${l[0] === "plano" ? ico("i-plano", "ico ico-sm") : ""}${l[1]} ${ico("i-dir", "ico ico-sm")}</a>`).join("");
    gav.innerHTML = cabGaveta(esc(p.nome), `${d.rot}`, UI.av(p.med, p.nome)) + `<div class="tl-gaveta__corpo">
      <div class="tl-ficha__acoes" data-entra>${UI.btWa(id, wa)}${UI.btAgenda(id)}<a class="bt-ico bt-ico--sm bt-ico--plano" href="tel:+55${fone}" aria-label="Ligar para ${esc(p.nome)}" title="Ligar">${ico("i-tel", "ico ico-sm")}</a>${UI.regTent(id)}</div>
      <dl class="tl-dl" data-entra>${linhas.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl>
      ${hist.length ? `<p class="tl-sec-tit" data-entra>Histórico</p><ol class="tl-hist" data-entra>${hist.map(h => `<li${h[2] ? ' class="agora"' : ""}><b>${esc(h[0])}</b><span>${esc(h[1])}</span></li>`).join("")}</ol>` : ""}
      ${links ? `<div class="tl-links" data-entra>${links}</div>` : ""}
    </div>`;
    gav.querySelector(".tl-gaveta__cab .av").classList.remove("av--sm");
    abre(gav, bt, { foco: "[data-tl-fecha]" });
  }
  const idPorNome = nome => (Object.values(VA.P).find(p => p.nome === nome) || {}).id;

  /* =====================================================================
     Busca rápida
     ===================================================================== */
  const busca = doc.createElement("div");
  busca.className = "tl-busca"; busca.hidden = true; busca.setAttribute("role", "dialog"); busca.setAttribute("aria-modal", "true"); busca.setAttribute("aria-label", "Buscar paciente");
  busca.innerHTML = `<div class="tl-busca__campo">${ico("i-busca")}
      <input id="tl-busca-in" type="text" role="combobox" aria-expanded="true" aria-controls="tl-busca-lista" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Buscar paciente, telefone ou tela…">
      <span class="tl-tecla" aria-hidden="true">Esc</span></div>
    <ul class="tl-busca__lista" id="tl-busca-lista" role="listbox" aria-label="Resultados"></ul>
    <div class="tl-busca__pe" aria-hidden="true"><span><span class="tl-tecla">↑</span><span class="tl-tecla">↓</span> escolher</span><span><span class="tl-tecla">Enter</span> abrir</span><span><span class="tl-tecla">/</span> ou <span class="tl-tecla">Ctrl K</span> buscar de qualquer tela</span></div>`;
  body.appendChild(busca);
  const bIn = $("#tl-busca-in", busca), bLista = $("#tl-busca-lista", busca);
  const TELAS = [
    { rot: "Agenda da semana", href: "agenda.html", ico: "i-agenda", chaves: "agenda semana consultas horarios" },
    { rot: "Recall · retornos vencidos", href: "recall.html", ico: "i-recall", chaves: "recall retorno manutencao vencido" },
    { rot: "Relatórios", href: "relatorios.html", ico: "i-rel", chaves: "relatorios origem conversao faturamento comparecimento" },
    { rot: "Funil de leads", href: "funil.html", ico: "i-funil", chaves: "funil leads parados quadro" },
    { rot: "Metas do mês", href: "metas.html", ico: "i-metas", chaves: "metas supermeta faturamento ritmo" },
    { rot: "Ajustes · usuários e acessos", href: "ajustes.html#acessos", ico: "i-ajustes", chaves: "ajustes usuarios acessos convite email modelos mensagem clinica sair" },
    { rot: "Novo lead", acao: "novo", ico: "i-mais", chaves: "novo lead cadastrar adicionar" },
  ];
  let bRes = [], bSel = 0;
  function marca(nome, termo) {
    if (!termo) return esc(nome);
    const i = semAcento(nome).indexOf(semAcento(termo)); if (i < 0) return esc(nome);
    return esc(nome.slice(0, i)) + "<mark>" + esc(nome.slice(i, i + termo.length)) + "</mark>" + esc(nome.slice(i + termo.length));
  }
  function bRender() {
    const t = bIn.value.trim(), ts = semAcento(t), dig = t.replace(/\D/g, "");
    const pacs = Object.values(VA.P).filter(p => p.nome);
    let grupos = [];
    if (!t) {
      const hoje = VA.AGENDA.filter(a => !a.evento && a.h >= "09:00" && a.st !== "feito").slice(0, 5).map(a => VA.P[a.id]);
      grupos = [["Na agenda de hoje", hoje.map(p => ({ p }))], ["Telas", TELAS.slice(0, 4).map(s => ({ s }))]];
    } else {
      const ps = pacs.filter(p => semAcento(p.nome).split(/\s+/).some(w => w.startsWith(ts)) || semAcento(p.nome).startsWith(ts) || (ts.length >= 4 && semAcento(p.proc || "").includes(ts)) || (dig.length >= 4 && VA.fone(p.id).includes(dig)))
        .sort((a, b) => (semAcento(a.nome).startsWith(ts) ? 0 : 1) - (semAcento(b.nome).startsWith(ts) ? 0 : 1) || a.nome.localeCompare(b.nome)).slice(0, 7);
      const ss = TELAS.filter(s => semAcento(s.rot + " " + s.chaves).includes(ts)).slice(0, 3);
      grupos = [["Pacientes", ps.map(p => ({ p }))], ["Telas e ações", ss.map(s => ({ s }))]];
    }
    bRes = []; let html = "";
    grupos.forEach(([g, itens]) => {
      if (!itens.length) return;
      html += `<li class="tl-busca__grupo" role="presentation">${g}</li>`;
      itens.forEach(it => {
        const i = bRes.length; bRes.push(it);
        if (it.p) { const d = destino(it.p);
          html += `<li class="tl-busca__item" role="option" id="tl-op-${i}" data-i="${i}" aria-selected="false">${UI.av(it.p.med, it.p.nome)}<div style="min-width:0"><b>${marca(it.p.nome, t)}</b><span class="sub">${esc(it.p.proc || "")} · ${UI.nomeMed(it.p.med)}</span></div><span class="tl-busca__ir">${d.rot} ${ico("i-dir", "ico ico-sm")}</span></li>`; }
        else html += `<li class="tl-busca__item" role="option" id="tl-op-${i}" data-i="${i}" aria-selected="false"><span class="bt-ico bt-ico--sm bt-ico--plano" aria-hidden="true">${ico(it.s.ico, "ico ico-sm")}</span><div><b>${marca(it.s.rot, t)}</b></div><span class="tl-busca__ir">${it.s.acao ? "abrir" : "ir"} ${ico("i-dir", "ico ico-sm")}</span></li>`;
      });
    });
    bLista.innerHTML = html || `<li class="tl-busca__vazio" role="presentation">Nenhum paciente com “${esc(t)}”. Tente parte do nome ou os 4 últimos dígitos do telefone.</li>`;
    bSel = 0; bMarca();
  }
  function bMarca() {
    bLista.querySelectorAll(".tl-busca__item").forEach(li => li.setAttribute("aria-selected", +li.dataset.i === bSel));
    const atual = bLista.querySelector(`[data-i="${bSel}"]`);
    if (atual) { bIn.setAttribute("aria-activedescendant", atual.id); atual.scrollIntoView({ block: "nearest" }); } else bIn.removeAttribute("aria-activedescendant");
  }
  function bEscolhe(i) {
    const it = bRes[i]; if (!it) return;
    if (it.s) { if (it.s.acao === "novo") { fecha(false); formNovoLead($(".trilho__novo")); } else location.href = it.s.href; return; }
    const d = destino(it.p);
    if (!d.href || d.pg === pagina) { fecha(false); destaca(it.p.id); abreFicha(it.p.id, botaoBusca()); }
    else location.href = d.href;
  }
  bIn.addEventListener("input", bRender);
  bIn.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (bRes.length) { bSel = (bSel + (e.key === "ArrowDown" ? 1 : -1) + bRes.length) % bRes.length; bMarca(); } }
    else if (e.key === "Enter") { e.preventDefault(); bEscolhe(bSel); }
  });
  bLista.addEventListener("click", e => { const li = e.target.closest(".tl-busca__item"); if (li) bEscolhe(+li.dataset.i); });
  bLista.addEventListener("mousemove", e => { const li = e.target.closest(".tl-busca__item"); if (li && +li.dataset.i !== bSel) { bSel = +li.dataset.i; bMarca(); } });
  const botaoBusca = () => $('#acoes-topo [data-tl="busca"]');
  function abreBusca() {
    if (aberta && aberta.el === busca) return;
    bIn.value = ""; bRender(); abre(busca, botaoBusca(), { tipo: "busca", foco: bIn });
  }

  /* =====================================================================
     Avisos e perfil (painéis suspensos)
     ===================================================================== */
  const ler = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const grava = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const popAv = doc.createElement("div");
  popAv.className = "tl-pop"; popAv.hidden = true; popAv.id = "tl-avisos"; popAv.setAttribute("role", "dialog"); popAv.setAttribute("aria-labelledby", "tl-av-tit");
  body.appendChild(popAv);
  function renderAvisos() {
    const lidos = ler("munin:avisos-lidos") === "1";
    popAv.innerHTML = `<div class="tl-pop__cab"><h2 id="tl-av-tit">Avisos</h2><span class="tl-dica">${lidos ? "tudo lido" : `${(VA2.AVISOS || []).length} novos`}</span></div>
      ${(VA2.AVISOS || []).map(a => `<a class="tl-aviso tl-aviso--${a.tipo}${lidos ? "" : " novo"}" href="${a.href}" data-entra><span class="tl-aviso__ico" aria-hidden="true">${ico(a.ico)}</span><div><b>${esc(a.tit)}</b><span>${esc(a.txt)}</span><em>${a.quando}</em></div></a>`).join("")}
      <div class="tl-pop__pe"><button type="button" class="bt-texto" id="tl-av-lidos"${lidos ? " disabled" : ""}>Marcar todos como lidos</button><a class="bt-texto" href="ajustes.html#avisos">Preferências ${ico("i-dir", "ico ico-sm")}</a></div>`;
    const b = $("#tl-av-lidos", popAv);
    if (b) b.addEventListener("click", () => { grava("munin:avisos-lidos", "1"); badge(); renderAvisos(); $("#tl-av-lidos", popAv).focus(); aviso("Avisos marcados como lidos"); });
  }
  function badge() {
    const bt = $('#acoes-topo [data-tl="avisos"]'); if (!bt) return;
    const lidos = ler("munin:avisos-lidos") === "1", b = bt.querySelector(".bt-ico__badge");
    if (b) b.hidden = lidos;
    bt.setAttribute("aria-label", lidos ? "Avisos" : `Avisos (${(VA2.AVISOS || []).length} novos)`);
  }
  const popPf = doc.createElement("div");
  popPf.className = "tl-pop"; popPf.hidden = true; popPf.id = "tl-perfil"; popPf.setAttribute("role", "dialog"); popPf.setAttribute("aria-label", "Perfil e conta");
  popPf.style.width = "min(300px, calc(100vw - 24px))";
  body.appendChild(popPf);
  function renderPerfil() {
    popPf.innerHTML = `<div class="tl-perfil__quem" data-entra><span class="av av--${quem.cor}" aria-hidden="true">${quem.ini}</span><div style="min-width:0"><b>${esc(quem.completo)}</b><span>${esc(quem.email)}</span><span>Perfil: ${quem.perfil}</span></div></div>
      <nav class="tl-menu" aria-label="Conta" data-entra>
        <a class="so-cel" href="recall.html">${ico("i-recall")}Recall</a>
        <a class="so-cel" href="relatorios.html">${ico("i-rel")}Relatórios</a>
        <a href="ajustes.html">${ico("i-ajustes")}Ajustes</a>
        <a href="ajustes.html#acessos">${ico("i-leads")}Usuários e acessos</a>
        <button type="button" class="tl-sair" data-tl-sair>${ico("i-seta")}Sair</button>
      </nav>`;
  }
  function sair() {
    try { sessionStorage.removeItem("munin:sessao"); sessionStorage.removeItem("munin:perfil"); ["vam:nome", "munin:nome", "munin:perfil"].forEach(k => localStorage.removeItem(k)); } catch (e) { /* ok */ }
    location.href = "entrar.html?saiu=1";
  }
  doc.addEventListener("click", e => { if (e.target.closest("[data-tl-sair]")) { e.preventDefault(); sair(); } });
  function abrePop(pop, bt, render) {
    if (aberta && aberta.el === pop) { fecha(); return; }
    render(); pop.hidden = false; posiciona(pop, bt); abre(pop, bt, { modal: false, tipo: "pop" });
  }

  /* ---------- Botões do topo ------------------------------------------- */
  const acoes = $("#acoes-topo");
  if (acoes) {
    const bBusca = acoes.querySelector('[aria-label="Buscar paciente"]'), bAv = acoes.querySelector('[aria-label^="Avisos"]');
    if (bBusca) { bBusca.dataset.tl = "busca"; bBusca.setAttribute("aria-haspopup", "dialog"); bBusca.title = "Buscar paciente ( / )"; bBusca.addEventListener("click", abreBusca); }
    if (bAv) { bAv.dataset.tl = "avisos"; bAv.setAttribute("aria-haspopup", "dialog"); bAv.setAttribute("aria-expanded", "false"); bAv.setAttribute("aria-controls", "tl-avisos"); bAv.addEventListener("click", () => abrePop(popAv, bAv, renderAvisos)); }
    acoes.insertAdjacentHTML("beforeend", `<button class="bt-ico tl-bt-perfil" data-tl="perfil" aria-haspopup="dialog" aria-expanded="false" aria-controls="tl-perfil" aria-label="Perfil: ${esc(quem.completo)} · Ajustes e Sair" title="${esc(quem.completo)}"><span class="av av--${quem.cor}" aria-hidden="true">${quem.ini}</span></button>`);
    const bPf = acoes.querySelector('[data-tl="perfil"]');
    bPf.addEventListener("click", () => abrePop(popPf, bPf, renderPerfil));
    badge();
    // "Agenda de hoje" (o Funil abre a gaveta própria): leva à Agenda
    const bAg = $("#bt-agenda");
    if (bAg && pagina !== "funil") bAg.addEventListener("click", () => { if (pagina === "agenda") { const h = $("#sem-hoje"); if (h && !h.hidden) h.click(); rola($(".ag-dia--hoje") || $("#ag-hoje")); } else location.href = "agenda.html"; });
  }
  const novo = $(".trilho__novo");
  if (novo) { novo.setAttribute("aria-haspopup", "dialog"); novo.addEventListener("click", () => formNovoLead(novo)); }

  /* =====================================================================
     Destinos para o que não levava a lugar nenhum (delegação)
     ===================================================================== */
  const vai = href => () => { location.href = href; };
  const rola = el => { if (!el) return; el.scrollIntoView({ behavior: REDUZ ? "auto" : "smooth", block: "center" }); el.classList.remove("tl-destaque"); void el.offsetWidth; el.classList.add("tl-destaque"); };
  const DETALHE_META = [[/faturamento|valor em planos/i, "relatorios.html#procedimentos"], [/planos fechados/i, "funil.html"], [/consultas|atendimentos|ocupa/i, "agenda.html"], [/recall/i, "recall.html"]];
  doc.addEventListener("click", e => {
    const bt = e.target.closest("button, a"); if (!bt || bt.closest(".tl-gaveta, .tl-busca, .tl-pop, .wa-pop, .ag-menu, .demo-fab")) return;
    const rot = (bt.getAttribute("aria-label") || bt.textContent || "").trim().replace(/\s+/g, " ");
    let m;
    // Fichas (cartões e tabela do Funil, linhas das telas novas)
    if (bt.dataset.ficha) { e.preventDefault(); abreFicha(bt.dataset.ficha, bt); return; }
    if ((m = rot.match(/^Abrir ficha de (.+)$/)) && bt.tagName === "BUTTON") { const id = idPorNome(m[1]); if (id) { e.preventDefault(); abreFicha(id, bt); } return; }
    if (pagina === "funil") {
      // "Fechado em 2026" e "Ver os N fechamentos do ano": o mesmo número está no topo de Relatórios
      if (bt.matches(".fn-foco .recorte__seta")) return vai("relatorios.html")();
      if (bt.matches(".fn-col__mais")) {
        if (/fechamentos/.test(rot)) return vai("relatorios.html")();
        const et = bt.closest(".fn-col") && bt.closest(".fn-col").dataset.etapa, aba = $('.fn-vista .aba[data-vista="lista"]');
        if (aba) { aba.click(); const nome = (VA.ETAPAS.find(x => x.k === et) || {}).nome; const g = [...doc.querySelectorAll("#tabela .fn-grupo")].find(tr => nome && tr.textContent.includes(nome)); setTimeout(() => rola(g), 60); }
        return;
      }
      if (bt.closest(".fn-fora") && /^Ver motivos/.test(rot)) return vai("relatorios.html#motivos")();
    }
    if (pagina === "painel") {
      if (bt.id === "tempo-mais") return vai("agenda.html")();
      if (bt.matches("#mcal .mcal__dia")) return vai(`agenda.html?dia=${bt.textContent.trim()}`)();
      if (rot === "Semana anterior") return vai("agenda.html?semana=-1")();
      if (rot === "Próxima semana") return vai("agenda.html?semana=1")();
    }
    if (pagina === "metas") {
      if (rot === "Abrir detalhe do faturamento") return vai("relatorios.html#procedimentos")();
      if (rot === "Abrir planos fechados") return vai("funil.html")();
      if (rot === "Abrir consultas") return vai("agenda.html")();
      if (rot === "Abrir ritmo do faturamento") return rola($(".metas-cal"));
      if (/^Editar metas do mês/.test(rot)) return vai("ajustes.html#metas")();
      if ((m = rot.match(/^Abrir metas de (Dr\.|Dra\.)/))) { const p = $(`.pilula[data-med="${m[1] === "Dr." ? "g" : "d"}"]`); if (p) { p.click(); scrollTo({ top: 0, behavior: REDUZ ? "auto" : "smooth" }); p.focus({ preventScroll: true }); } return; }
      if ((m = rot.match(/^Abrir detalhe: (.+)$/))) { const d = DETALHE_META.find(([r]) => r.test(m[1])); if (d) vai(d[1])(); return; }
    }
  });

  if (pagina === "funil") { const st = $(".fn-foco .recorte__seta"); if (st) st.setAttribute("aria-label", "Ver relatório de fechamentos"); }

  /* ---------- Destaque e ficha vindos da busca (?ficha=id) ------------- */
  function destaca(id) {
    const p = VA.P[id]; if (!p) return;
    const sel = `[data-id="${id}"], [data-ficha="${id}"]`;
    let el = $(`main ${sel}`);
    if (!el) el = [...doc.querySelectorAll("main .linha__nome, main .fn-card__nome, main .fn-pac b, main .ag-ev b, main .rc-nome")].find(x => x.textContent.trim() === p.nome);
    if (el) rola(el.closest(".linha, .fn-card, tr, .ag-ev, li") || el);
  }
  const fichaUrl = q.get("ficha");
  if (fichaUrl && VA.P[fichaUrl]) setTimeout(() => { destaca(fichaUrl); abreFicha(fichaUrl, null); }, REDUZ ? 100 : 750);

  window.TL = { abreFicha, abreBusca, formNovoLead, aviso, destaca, quem, fecha };
})();
