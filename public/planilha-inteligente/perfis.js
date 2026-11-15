/* =====================================================================
   perfis.js · tela inicial e foco por perfil (window.MUNIN_PERFIL)
   Carregar DEPOIS de comum.js, do script da página e de telas.js, e
   ANTES de motion.js (a abertura lê window.MUNIN_PLACAR).
   - Perfil: ?perfil= (gestao | medico | sdr | recepcao | closer), lembrado
     em localStorage "munin:perfil" (a mesma chave da tela de entrada).
   - Painel: Gestão mantém o painel e ganha a "Passagem de bastão"; os
     outros perfis veem a própria fila de trabalho. Foco, não bloqueio:
     menu e demais telas continuam abertos.
   - "Com quem está agora": chip do responsável da etapa em cada lead.
   - Visibilidade: faturamento e valores conforme a matriz de Ajustes
     (VA2.VISAO, com o que Ajustes salvar por cima).
   ===================================================================== */
(function () {
  "use strict";
  const VA = window.VA, UI = window.UI, VA2 = window.VA2 || {}, VAP = window.VAP;
  if (!VA || !UI || !VAP) return;
  const doc = document, body = doc.body, pagina = body.dataset.pagina || "";
  const q = new URLSearchParams(location.search);
  const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.22,1,.36,1)";
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ico = (id, cls = "ico") => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const anima = (el, kf, o) => { try { return el.animate(kf, o); } catch (e) { return null; } };
  const { P, AGENDA, ST_AGENDA } = VA;
  const { br, mil, real, av, escala, nomeMed, btWa, btAgenda, regTent } = UI;
  const pl = (n, um, varios) => n === 1 ? um : varios;

  /* =====================================================================
     1. PERFIL ATUAL
     ===================================================================== */
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } },
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* idem */ } },
  };
  const ROT = { gestao: "Gestão", medico: "Médico", sdr: "SDR", recepcao: "Recepção", closer: "Closer" };
  const valido = k => Object.prototype.hasOwnProperty.call(ROT, k);
  const PERFIL = (() => {
    const p = (q.get("perfil") || "").toLowerCase();
    if (valido(p)) { ls.set("munin:perfil", p); ss.set("munin:perfil", p); return p; }
    const s = ls.get("munin:perfil") || ss.get("munin:perfil");
    return valido(s) ? s : "gestao";
  })();
  window.MUNIN_PERFIL = PERFIL;
  const TL = window.TL || {};
  if (TL.quem) { TL.quem.perfilK = PERFIL; TL.quem.perfil = ROT[PERFIL]; }
  const NOME = (q.get("nome") || (TL.quem && TL.quem.nome) || "Dra. Lúcia").trim();
  // Médico: qual dos dois (pelo nome de quem entrou)
  const MED_EU = /Rafael/.test(NOME) ? "g" : "d";
  // Contas da demonstração (uma por perfil), as mesmas da tela de entrada
  const CONTAS = (VA2.CONTAS && VA2.CONTAS.length ? VA2.CONTAS : [
    { nome: "Marina", perfil: "gestao" }, { nome: "Dra. Lúcia", perfil: "medico" }, { nome: "Júlia", perfil: "sdr" },
    { nome: "Carla", perfil: "recepcao" }, { nome: "Tatiana", perfil: "closer" },
  ]).map(c => ({ nome: c.nome, perfil: c.perfil, rot: ROT[c.perfil] }));
  window.MUNIN_CONTAS = CONTAS;

  /* ---------- Visibilidade: a matriz "O que cada perfil vê" ------------- */
  const VISAO_PADRAO = {
    gestao: { fat: true, plano: true }, medico: { fat: true, plano: true }, closer: { fat: false, plano: true },
    sdr: { fat: false, plano: false }, recepcao: { fat: false, plano: false },
  };
  function visao(k) {
    const base = Object.assign({}, VISAO_PADRAO[k], (VA2.VISAO || {})[k]);
    // Ajustes pode salvar a matriz alterada (navegador); ela vale por cima do padrão
    ["munin:visao", "munin:matriz"].forEach(chave => {
      try { const m = JSON.parse(ls.get(chave) || ss.get(chave) || "null"); if (m && m[k]) Object.assign(base, m[k]); } catch (e) { /* ignora */ }
    });
    if (k === "gestao") { base.fat = true; base.plano = true; }   // a gestão sempre vê tudo
    return base;
  }
  const VIS = visao(PERFIL);
  window.MUNIN_VISAO = VIS;
  body.dataset.perfil = PERFIL;
  body.classList.toggle("pf-sem-fat", !VIS.fat);
  body.classList.toggle("pf-sem-valor", !VIS.plano);

  /* ---------- Responsável da etapa (o "bastão") ------------------------- */
  const NOMES = {}; Object.values(P).forEach(p => { if (!NOMES[p.nome]) NOMES[p.nome] = p.id; });
  const QUEM = {   // quem é cada papel na clínica (Ajustes · equipe)
    sdr: (VA2.EQUIPE || []).find(e => e.perfil === "sdr"), recepcao: (VA2.EQUIPE || []).find(e => e.perfil === "recepcao"),
    closer: (VA2.EQUIPE || []).find(e => e.perfil === "closer"),
  };
  const primeiro = e => e ? e.nome.split(" ")[0] : "";
  // Na tela do próprio perfil, quem está com a pessoa que olha não ganha chip (a fila inteira é dela);
  // o chip aparece quando o lead está com outra função. Na Gestão e no Funil, aparece sempre.
  function chipCom(id, opc = {}) {
    const r = opc.r || VAP.responsavel(P[id]); if (!r) return "";
    const eu = r === PERFIL && PERFIL !== "gestao";
    if (eu && opc.omiteEu) return "";
    const rot = eu ? "Com você" : VAP.PAPEL[r];
    const tit = `Com quem está agora: ${VAP.PAPEL[r]} (${VAP.MOTIVO[r]})`;
    return `<span class="pf-com pf-com--${r}${eu ? " pf-com--eu" : ""}${opc.cls ? " " + opc.cls : ""}" title="${tit}"><span class="sr">Com quem está agora: </span><i aria-hidden="true"></i>${rot}</span>`;
  }

  /* =====================================================================
     2. CHIP DO PERFIL NO TOPO
     ===================================================================== */
  const h1 = $(".topo__ola h1");
  if (h1 && !$(".pf-perfil", h1)) h1.insertAdjacentHTML("beforeend", ` <span class="pf-perfil" title="Perfil de acesso: ${ROT[PERFIL]}"><span class="sr">Perfil: </span>${ROT[PERFIL]}</span>`);

  /* =====================================================================
     3. NÚMEROS POR PERFIL (tela inicial, abertura e encerramento)
     ===================================================================== */
  const AGORA = VAP.min(VA.AGORA);
  const medAtual = () => { const b = $('.pilulas .pilula[aria-pressed="true"]'); return b ? b.dataset.med : "todos"; };
  const deMed = m => p => m === "todos" || !m || p.med === m;
  const esperaTxt = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
  const SEV = { atrasado: "status--atrasado", atencao: "status--atencao", ok: "status--ok", neutro: "status--neutro" };
  const hoje = () => AGENDA.filter(a => !a.evento);
  const semana0 = () => (VA2.semana ? VA2.semana(0) : []);
  const HOJE_D = VA2.HOJE_D || new Date(2026, 10, 13);
  const proxDia = (() => {   // próximo dia com agenda (sexta → segunda)
    if (!VA2.dia) return null;
    for (let i = 1; i < 6; i++) { const d = new Date(HOJE_D); d.setDate(d.getDate() + i); const dd = VA2.dia(d); if (dd.itens.length) return dd; }
    return null;
  })();
  const DIAS_SEM = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const nomeDia = dd => dd ? `${DIAS_SEM[dd.d.getDay()]}, ${dd.data}` : "";

  // Passagem de bastão: quantos com cada um (volumes de VA.ATIVOS, os mesmos do Funil) e parados (VA.parados)
  const ETAPAS_DE = { sdr: ["contato"], recepcao: ["agendado", "confirmado"], medico: ["compareceu"], closer: ["plano"] };
  function bastao(m) {
    const par = VA.parados(m);
    const linhas = ["sdr", "recepcao", "medico", "closer"].map(k => {
      const n = ETAPAS_DE[k].reduce((a, e) => a + VA.ativosEtapa(e, m).n, 0);
      const pr = par.filter(p => VAP.responsavel(p) === k);
      return { k, n, parados: pr, risco: pr.reduce((a, p) => a + VA.valorLead(p), 0) };
    });
    const garg = linhas.slice().sort((a, b) => (b.parados.length - a.parados.length) || (b.risco - a.risco))[0];
    return { linhas, garg: garg && garg.parados.length ? garg : null };
  }
  const dadosSDR = m => {
    const novos = VAP.NOVOS.filter(deMed(m));
    const aguarda = novos.filter(n => n.st === "aguarda").sort((a, b) => b.espera - a.espera);
    const retornos = Object.values(P).filter(p => p.etapa === "contato" && (p.sev === "atrasado" || p.sev === "atencao") && deMed(m)(p))
      .sort((a, b) => ((b.sev === "atrasado") - (a.sev === "atrasado")) || ((b.venc || 0) - (a.venc || 0)));
    const agHoje = novos.filter(n => n.st === "agendado");
    return { novos, aguarda, retornos, agHoje, agendar: VAP.AGENDAR.filter(a => deMed(m)(P[a.id])) };
  };
  const dadosRecepcao = m => {
    const ag = hoje().filter(a => deMed(m)(P[a.id]));
    const hojeConf = ag.filter(a => a.st === "aconf" || a.st === "semresp");
    const prox = proxDia ? proxDia.itens.filter(i => !i.evento && i.st === "aconf" && deMed(m)(P[i.id])) : [];
    const faltas = [];
    semana0().forEach(dd => { if (dd.d < HOJE_D) dd.itens.forEach(i => { if ((i.st === "falta" || i.st === "semreg") && deMed(m)(P[i.id])) faltas.push(Object.assign({ data: dd.data }, i)); }); });
    faltas.sort((a, b) => (b.st === "falta") - (a.st === "falta") || a.data.localeCompare(b.data));
    return { ag, hojeConf, prox, faltas, nFaltas: faltas.filter(f => f.st === "falta").length };
  };
  const dadosMedico = med => {
    const ag = hoje().filter(a => P[a.id].med === med);
    const planos = Object.values(P).filter(p => p.etapa === "plano" && p.med === med)
      .sort((a, b) => ((b.sev === "atrasado") - (a.sev === "atrasado")) || b.d - a.d);
    const fat = VA.metaVal("fat", med), plm = VA.metaVal("pl", med), co = VA.metaVal("co", med);
    return { ag, planos, nPlanos: VA.ativosEtapa("plano", med).n, fat, plm, co, pct: Math.round(fat[0] / fat[1] * 100) };
  };
  const dadosCloser = m => {
    const planos = Object.values(P).filter(p => p.etapa === "plano" && deMed(m)(p))
      .sort((a, b) => ((b.sev === "atrasado") - (a.sev === "atrasado")) || ((b.venc || 0) - (a.venc || 0)) || ((b.sev === "atencao") - (a.sev === "atencao")) || b.v - a.v);
    const aberto = VA.ativosEtapa("plano", m);
    const recall = (VA2.recall ? VA2.recall() : []).filter(r => r.grupo === "vencido" && deMed(m)(r.p));
    const saldos = VAP.SALDOS.filter(s => deMed(m)(P[s.id]));
    const riscoPar = VA.parados(m).filter(p => p.etapa === "plano").reduce((a, p) => a + p.v, 0);
    return { planos, aberto, recall, saldos, fech: VA.fechMes(m), riscoPar };
  };

  /* ---------- Placar da abertura e do encerramento por perfil ---------- */
  // motion.js chama MUNIN_PLACAR(tipo, dd, hora); sem resposta (null) ele usa o placar padrão.
  window.MUNIN_PLACAR = function (tipo, dd, hora) {
    const m = PERFIL === "medico" ? MED_EU : "todos";
    if (tipo === "abertura") {
      if (PERFIL === "sdr") {
        const s = dadosSDR(m);
        return [
          { n: s.novos.length, rot: pl(s.novos.length, "lead novo hoje", "leads novos hoje") },
          { n: s.aguarda.length, rot: "sem resposta", sub: s.aguarda.length ? `o mais antigo há ${esperaTxt(s.aguarda[0].espera)}` : "", alerta: s.aguarda.length > 0 },
          { n: s.agHoje.length, rot: pl(s.agHoje.length, "agendado hoje", "agendados hoje") },
        ];
      }
      if (PERFIL === "recepcao") {
        const r = dadosRecepcao(m), nConf = r.hojeConf.length + r.prox.length;
        return [
          { n: r.ag.length, rot: pl(r.ag.length, "consulta hoje", "consultas hoje") },
          { n: nConf, rot: "a confirmar", sub: `${r.hojeConf.length} hoje · ${r.prox.length} ${proxDia ? DIAS_SEM[proxDia.d.getDay()] : ""}`, alerta: r.hojeConf.length > 0 },
          { n: r.nFaltas, rot: pl(r.nFaltas, "falta para remarcar", "faltas para remarcar") },
        ];
      }
      if (PERFIL === "medico") {
        const d = dadosMedico(MED_EU);
        const it = [
          { n: d.ag.length, rot: pl(d.ag.length, "paciente hoje", "pacientes hoje") },
          { n: d.nPlanos, rot: pl(d.nPlanos, "plano em aberto", "planos em aberto") },
        ];
        it.push(VIS.fat ? { n: d.pct, suf: "%", rot: "da sua meta" } : { n: d.plm[0], rot: `de ${d.plm[1]} planos da meta` });
        return it;
      }
      if (PERFIL === "closer") {
        const c = dadosCloser(m);
        return [
          { n: Math.round(c.aberto.v / 1000), pre: "R$", suf: "mil", rot: "em planos abertos", sub: `${c.aberto.n} planos` },
          { n: c.recall.length, rot: pl(c.recall.length, "recall vencido", "recalls vencidos"), alerta: c.recall.length > 0 },
          { n: c.fech.n, rot: "fechados no mês", sub: VIS.plano ? `R$ ${mil(c.fech.v)} mil` : "" },
        ];
      }
      // Gestão: % da meta · leads parados · gargalo
      const b = bastao("todos");
      return [
        { n: dd.metaPct, suf: "%", rot: "da meta do mês" },
        { n: dd.parados, rot: pl(dd.parados, "lead parado", "leads parados"), alerta: dd.parados > 0 },
        b.garg ? { n: b.garg.parados.length, rot: `parados com ${ARTIGO[b.garg.k]}`, sub: "gargalo da semana" }
          : { n: dd.pacientes, rot: "pacientes hoje" },
      ];
    }
    if (tipo === "encerramento") {
      const tarde = hora >= 17;   // o dia simulado: à noite a fila do dia foi trabalhada
      if (PERFIL === "sdr") {
        const s = dadosSDR(m);
        // respondidos: os leads novos de hoje + os retornos da fila; agendados: Luíza (08:24) e, à tarde, o Henrique (pediu horário à tarde)
        const resp = s.novos.length + s.retornos.length, ag = s.agHoje.length + (tarde ? s.agendar.filter(a => a.sev === "atencao").length : 0);
        return [
          { n: resp, rot: pl(resp, "lead respondido", "leads respondidos"), sub: `${s.novos.length} novos · ${s.retornos.length} retornos` },
          { n: ag, rot: pl(ag, "agendado hoje", "agendados hoje") },
          { n: Math.max(0, s.agendar.length - (tarde ? 1 : 0)), rot: "ficam para agendar", sub: "com data combinada" },
        ];
      }
      if (PERFIL === "recepcao") {
        const r = dadosRecepcao(m), cheg = dd.atendidos + chegadasMarcadas();
        return [
          { n: r.prox.length + r.hojeConf.filter(a => a.st === "aconf").length, rot: "confirmados", sub: `inclui ${nomeDia(proxDia)}` },
          { n: Math.min(cheg, r.ag.length), rot: "chegadas", sub: `de ${r.ag.length} na agenda` },
          { n: r.nFaltas, rot: pl(r.nFaltas, "falta remarcada", "faltas remarcadas") },
        ];
      }
      if (PERFIL === "medico") {
        const d = dadosMedico(MED_EU), h = `${String(Math.floor(hora)).padStart(2, "0")}:${String(Math.round((hora % 1) * 60)).padStart(2, "0")}`;
        const at = d.ag.filter(a => a.st === "feito" || a.st === "atend" || (a.h < h && a.st !== "semresp"));
        const ind = at.filter(a => a.tipo === "1ª consulta").length;
        return [
          { n: at.length, rot: pl(at.length, "paciente atendido", "pacientes atendidos"), sub: `de ${d.ag.length} na agenda` },
          { n: ind, rot: pl(ind, "plano indicado", "planos indicados"), sub: "nas 1ªs consultas" },
          VIS.fat ? { n: d.pct, suf: "%", rot: "da sua meta" } : { n: d.plm[0], rot: "planos fechados no mês" },
        ];
      }
      if (PERFIL === "closer") {
        const c = dadosCloser(m);
        return [
          { n: dd.valorHoje, pre: "R$", rot: "fechados hoje", sub: dd.planosHoje ? `${dd.planosHoje} plano${dd.planosHoje > 1 ? "s" : ""}` : "nenhum plano hoje" },
          { n: tarde ? c.recall.length : 0, rot: "recalls feitos", sub: `de ${c.recall.length} vencidos` },
          { n: c.planos.filter(p => p.sev === "atrasado").length, rot: "planos para retomar", sub: "retorno vencido" },
        ];
      }
      return null;   // Gestão: o placar padrão (como está hoje)
    }
    return null;
  };
  let nChegadas = 0;
  const chegadasMarcadas = () => nChegadas;

  /* =====================================================================
     4. PEÇAS DE TELA
     ===================================================================== */
  const cartaoFoco = ({ rot, valor, nota, extra = [], anel = "", seta }) => `
    <article class="cartao cartao--foco kpi pf-foco recorte">
      <span class="recorte__filete recorte__filete--a"></span><span class="recorte__filete recorte__filete--b"></span>
      ${seta ? `<a class="recorte__seta" href="${seta[0]}" aria-label="${seta[1]}">${ico("i-seta")}</a>` : ""}
      <span class="kpi__rot">${rot}</span>
      <div class="pf-foco__corpo">
        ${anel ? `<div class="anel pf-foco__anel">${anel}</div>` : ""}
        <div class="pf-foco__num"><div class="kpi__valor kpi__valor--lg">${valor}</div><div class="kpi__nota">${nota}</div></div>
        ${extra.length ? `<dl class="pf-foco__extra">${extra.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>` : ""}
      </div>
    </article>`;
  const cartaoLista = ({ id, tit, sub = "", acao = "", itens, vazio, pe = "", cls = "" }) => `
    <section class="cartao pf-lista ${cls}" aria-labelledby="${id}">
      <div class="cartao__cab"><h2 id="${id}">${tit}${sub ? ` <span class="cartao__sub">${sub}</span>` : ""}</h2>${acao}</div>
      <ul class="pf-ul">${itens || `<li class="vazio">${vazio}</li>`}</ul>
      ${pe ? `<div class="rodape-cartao">${pe}</div>` : ""}
    </section>`;
  // Linha: [lado] [nome + chips / texto] [prazo] [ações]
  const linha = ({ id, lado, pre = "", chips = "", com, txt = "", prazo = "", acoes = "", cls = "", attrs = "" }) => {
    const p = P[id], compacta = /pf-l--compacta/.test(cls);
    const chipC = com === false ? "" : chipCom(id, Object.assign({ omiteEu: true }, com || {}));
    if (compacta) prazo += chipC; else chips += chipC;
    return `<li class="pf-l ${cls}" data-id="${id}" data-med="${p.med}" ${attrs}>
      <div class="pf-l__lado">${lado || av(p.med, p.nome)}</div>
      <div class="pf-l__corpo"><div class="pf-l__l1">${pre}<span class="pf-l__nome">${esc(p.nome)}</span>${chips}</div>${txt ? `<div class="pf-l__l2">${txt}</div>` : ""}</div>
      <div class="pf-l__prazo">${prazo}</div>
      <div class="pf-l__acoes">${acoes}</div>
    </li>`;
  };
  const tipoRot = t => `<span class="pf-tipo">${t}</span>`;
  const st = (sev, t) => `<span class="status ${SEV[sev] || sev}">${t}</span>`;
  const btIco = (icone, rot, attrs = "") => `<button type="button" class="bt-ico bt-ico--sm bt-ico--plano pf-bt" aria-label="${esc(rot)}" title="${esc(rot)}" ${attrs}>${ico(icone, "ico ico-sm")}</button>`;
  const vgestao = (rot, sub) => `<div class="pf-veu" role="note"><span class="pf-veu__ico" aria-hidden="true">${ico("i-info", "ico ico-sm")}</span><b>${rot}</b><span>${sub || "Visível para a gestão"}</span></div>`;

  /* ---------- SDR ------------------------------------------------------- */
  function telaSDR(m) {
    const s = dadosSDR(m), velho = s.aguarda[0];
    const sevEspera = e => e > 60 ? "atrasado" : e > VAP.PRAZO_RESPOSTA ? "atencao" : "ok";
    const novosHtml = s.aguarda.map(n => linha({ id: n.id,
      chips: `${tipoRot("Lead novo")}<span class="chip">${n.origem}</span>`,
      txt: `${esc(n.pediu)} · ${n.canal} · chegou ${n.chegou}`,
      prazo: `${st(sevEspera(n.espera), `esperando há ${esperaTxt(n.espera)}`)}${regTent(n.id)}`,
      acoes: `${btWa(n.id, "followup")}${btIco("i-check", `Marcar como respondido: ${n.nome}`, 'data-pf="respondido"')}` })).join("");
    const retHtml = s.retornos.map(p => linha({ id: p.id,
      chips: `${tipoRot("Retorno")}<span class="chip">${p.origem}</span>`,
      txt: `${esc(p.nota)} · ${p.proc}`,
      prazo: `${st(p.sev, p.venc ? `${p.venc} dias de atraso` : "Hoje")}${regTent(p.id)}`,
      acoes: `${btWa(p.id, "followup")}${btIco("i-check", `Marcar como respondido: ${p.nome}`, 'data-pf="respondido"')}` })).join("");
    const agendarHtml = s.agendar.map(a => { const p = P[a.id]; return linha({ id: a.id, cls: "pf-l--compacta",
      txt: `${a.motivo}`, prazo: st(a.sev, a.prazo),
      acoes: `${btWa(a.id, "followup")}<a class="bt-ico bt-ico--sm bt-ico--plano pf-bt" href="agenda.html" aria-label="Ver horários livres para ${esc(p.nome)}" title="Ver horários livres">${ico("i-cal-mais", "ico ico-sm")}</a>` }); }).join("");
    const safra = VA.safraNov(m), meta = VAP.META_AG, r = VA.ritmo(safra.n[1], meta.meta), max = meta.sup * 1.15, pc = x => x / max * 100;
    const metaAg = `<section class="cartao pf-meta" aria-labelledby="pf-t-meta">
      <div class="cartao__cab"><h2 id="pf-t-meta">Meta de agendamentos <span class="cartao__sub">novembro</span></h2></div>
      <div class="kpi__valor">${safra.n[1]}<small>de</small>${meta.meta}</div>
      <div class="kpi__nota">${st(r.cls.replace("status--", ""), r.rot)}<span>esperado hoje ${br(r.esp)}</span></div>
      <div class="pf-meta__barra">${UI.barra({ v: pc(safra.n[1]), m1: pc(meta.meta), m2: pc(meta.sup), r: pc(meta.meta * VA.FRAC), estado: UI.estadoDe(r.cls), aria: `${safra.n[1]} agendamentos de meta ${meta.meta}; esperado hoje ${br(r.esp)}` })}</div>
      <p class="pf-meta__nota"><b>${Math.round(safra.n[1] / safra.n[0] * 100)}%</b> dos ${safra.n[0]} leads de novembro agendaram · supermeta ${meta.sup}</p>
    </section>`;
    return {
      resumo: `${s.aguarda.length} ${pl(s.aguarda.length, "lead esperando resposta", "leads esperando resposta")} · ${s.agendar.length} para agendar`,
      coluna: cartaoFoco({ rot: "Responder agora", seta: ["funil.html", "Abrir o funil"],
        valor: `${s.aguarda.length}<small>${pl(s.aguarda.length, "lead", "leads")}</small>`,
        nota: velho ? `<span>sem resposta · o mais antigo espera há <b>${esperaTxt(velho.espera)}</b></span>${st("atrasado", `prazo ${VAP.PRAZO_RESPOSTA} min`)}` : `<span>ninguém esperando · prazo de resposta ${VAP.PRAZO_RESPOSTA} min</span>`,
        extra: [["Chegaram hoje", s.novos.length], ["Retornos vencidos", s.retornos.filter(p => p.sev === "atrasado").length], ["Agendados hoje", s.agHoje.length]] }) +
        cartaoLista({ id: "pf-t-resp", tit: "Responder agora", sub: "o mais antigo primeiro", cls: "pf-fila",
          acao: `<span class="pf-dica">${ico("i-relogio", "ico ico-sm")}responder em até ${VAP.PRAZO_RESPOSTA} min</span>`,
          itens: novosHtml + (retHtml ? `<li class="pf-sep" role="presentation">Retornos combinados</li>${retHtml}` : ""), vazio: "Nenhum lead esperando resposta" }),
      lado: cartaoLista({ id: "pf-t-agendar", tit: "Agendar", sub: "qualificados sem data", itens: agendarHtml, vazio: "Nenhum lead para agendar",
          pe: `<span>${s.agHoje.map(n => `${esc(n.nome)} agendou ${n.consulta[0]} às ${n.consulta[1]}`).join(" · ") || "Nenhum agendamento hoje"}</span><a class="bt-texto" href="agenda.html">Agenda <svg class="ico ico-sm"><use href="#i-dir"/></svg></a>` }) + metaAg,
    };
  }

  /* ---------- Recepção -------------------------------------------------- */
  const chegou = {};   // check-in marcado nesta sessão: id → hora
  function telaRecepcao(m) {
    const r = dadosRecepcao(m), nConf = r.hojeConf.length + r.prox.length;
    const naClinica = r.ag.filter(a => a.st === "atend" || a.st === "recep").length + Object.keys(chegou).filter(id => deMed(m)(P[id])).length;
    const feitas = r.ag.filter(a => a.st === "feito");
    const chegadas = r.ag.filter(a => a.st !== "feito").map(a => {
      const p = P[a.id], marcado = chegou[a.id], dentro = a.st === "atend" || a.st === "recep";
      const [cls, rot] = ST_AGENDA[a.st];
      const prazo = marcado ? st("ok", `Chegou ${marcado}`) : dentro ? `${st(cls.replace("status--", ""), rot)}<span class="pf-mini">${a.nota || ""}</span>` : st(cls.replace("status--", ""), rot);
      const bt = dentro ? "" : `<button type="button" class="bt-sec pf-checkin" data-pf="checkin" aria-pressed="${!!marcado}" aria-label="${marcado ? "Desfazer chegada de" : "Marcar chegada de"} ${esc(p.nome)}">${ico("i-check", "ico ico-sm")}<span>${marcado ? "Chegou" : "Chegou?"}</span></button>`;
      const wa = !marcado && (a.st === "aconf" || a.st === "semresp") ? btWa(a.id, "confirmacao") : "";
      return linha({ id: a.id, cls: marcado || dentro ? "pf-l--dentro" : "",
        lado: `<span class="hora${a.h <= VA.AGORA && !marcado && !dentro ? " hora--passou" : ""}">${a.h}</span>`,
        pre: av(p.med, p.nome, true),
        txt: `${a.tipo} · ${nomeMed(p.med)}`, prazo, acoes: `${wa}${bt}` });
    }).join("");
    const confHoje = r.hojeConf.map(a => linha({ id: a.id, cls: "pf-l--compacta",
      txt: `${a.tipo} hoje às ${a.h} · ${nomeMed(P[a.id].med)}`,
      prazo: `${st(a.st === "semresp" ? "atrasado" : "atencao", a.st === "semresp" ? "Sem resposta" : `Hoje ${a.h}`)}${regTent(a.id)}`, acoes: btWa(a.id, "confirmacao") })).join("");
    const confProx = r.prox.map(i => linha({ id: i.id, cls: "pf-l--compacta",
      txt: `${i.tipo} ${proxDia.data} às ${i.h} · ${nomeMed(P[i.id].med)}`,
      prazo: `${st("neutro", `${DIAS_SEM[proxDia.d.getDay()]} ${i.h}`)}${regTent(i.id)}`, acoes: btWa(i.id, "confirmacao") })).join("");
    const faltas = r.faltas.map(f => linha({ id: f.id, cls: "pf-l--compacta",
      com: { r: "recepcao" }, txt: f.st === "falta" ? `Faltou ${f.data} às ${f.h} · ${f.tipo}` : `Consulta ${f.data} às ${f.h} sem registro de comparecimento`,
      prazo: st(f.st === "falta" ? "atrasado" : "atencao", f.st === "falta" ? "Remarcar" : "Sem registro"),
      acoes: f.st === "falta" ? `${btWa(f.id, "falta")}${btIco("i-tel", `Ligar para remarcar: ${P[f.id].nome}`)}` : btIco("i-check", `Registrar comparecimento: ${P[f.id].nome}`, 'data-pf="registrar"') })).join("");
    return {
      resumo: `${r.ag.length} consultas hoje · ${nConf} a confirmar`,
      coluna: cartaoFoco({ rot: "A confirmar", seta: ["agenda.html", "Abrir a agenda"],
        valor: `${nConf}<small>${pl(nConf, "consulta", "consultas")}</small>`,
        nota: `<span><b>${r.hojeConf.length}</b> ainda hoje · <b>${r.prox.length}</b> para ${nomeDia(proxDia)}</span>${r.hojeConf.some(a => a.st === "semresp") ? st("atrasado", "1 sem resposta") : ""}`,
        extra: [["Consultas hoje", r.ag.length], ["Na clínica agora", `<span id="pf-na-clinica">${naClinica}</span>`], ["Faltas na semana", r.nFaltas]] }) +
        cartaoLista({ id: "pf-t-cheg", tit: "Chegadas de hoje", sub: `${feitas.length} já atendida${feitas.length === 1 ? "" : "s"} antes das ${VA.AGORA}`, cls: "pf-fila pf-fila--chegadas",
          acao: `<a class="bt-texto" href="agenda.html">Agenda do dia <svg class="ico ico-sm"><use href="#i-dir"/></svg></a>`, itens: chegadas, vazio: "Ninguém mais na agenda de hoje" }),
      lado: cartaoLista({ id: "pf-t-conf", tit: "Confirmar", sub: "pelo WhatsApp", itens: (confHoje ? `<li class="pf-sep" role="presentation">Ainda hoje</li>${confHoje}` : "") + (confProx ? `<li class="pf-sep" role="presentation">Véspera · ${nomeDia(proxDia)}</li>${confProx}` : ""), vazio: "Tudo confirmado" }) +
        cartaoLista({ id: "pf-t-faltas", tit: "Faltas para remarcar", sub: "esta semana", itens: faltas, vazio: "Nenhuma falta nesta semana" }),
    };
  }

  /* ---------- Médico ---------------------------------------------------- */
  function telaMedico() {
    const med = MED_EU, d = dadosMedico(med);
    const prox = d.ag.find(a => a.h > VA.AGORA && a.st !== "feito");
    const nOport = d.ag.filter(a => VAP.ESTUDO[a.id] && a.st !== "feito" && /≈ R\$|complementa|consolidar|manutenção|peeling|recall|indique|retorno já/i.test(VAP.ESTUDO[a.id].oport)).length;
    const itens = d.ag.map(a => {
      const p = P[a.id], e = VAP.ESTUDO[a.id] || {}, [cls, rot] = ST_AGENDA[a.st], feito = a.st === "feito";
      const aberto = prox && prox.id === a.id;
      const oport = VIS.plano ? e.oport : String(e.oport || "").replace(/\s*\(?≈ R\$ [\d.,]+ mil\)?/g, "").replace(/;\s*ticket estimado R\$ [\d.,]+ mil/, "");
      return `<li class="pf-est${feito ? " pf-est--feito" : ""}" data-id="${a.id}" data-med="${p.med}">
        <details${aberto ? " open" : ""}>
          <summary class="pf-l">
            <div class="pf-l__lado"><span class="hora${a.st === "atend" ? " hora--agora" : feito ? " hora--passou" : ""}">${a.h}</span></div>
            <div class="pf-l__corpo"><div class="pf-l__l1"><span class="pf-l__nome">${esc(p.nome)}</span>${p.carteira ? `<span class="chip">Carteira ${p.carteira}</span>` : ""}${chipCom(a.id, { omiteEu: true })}</div>
              <div class="pf-l__l2">${a.tipo} · ${p.proc}${a.det ? " · " + a.det : ""}</div><div class="pf-plmini" data-plmini="${a.id}"></div></div>
            <div class="pf-l__prazo">${st(cls.replace("status--", ""), rot)}</div>
            <div class="pf-l__acoes"><span class="pf-est__abre">${feito ? "Ver" : "Estudo"}${ico("i-dir", "ico ico-sm")}</span></div>
          </summary>
          <div class="pf-est__corpo">
            <div><span>Histórico</span><p>${esc(e.hist || "Sem histórico registrado.")}</p></div>
            <div><span>Plano</span><p>${esc(e.plano || "—")}</p></div>
            <div class="pf-est__op"><span>Oportunidade</span><p>${esc(oport || "Nenhuma indicada.")}</p></div>
            <div><span>Como conduzir</span><p>${esc(e.tom || "")}</p></div>
          </div>
        </details>
      </li>`;
    }).join("");
    const linhaMeta = (rot, x, rs) => {
      const [v, meta, sup] = x, max = sup * 1.15, pc = y => y / max * 100, rr = VA.ritmo(v, meta);
      return `<div class="pf-mm"><div class="pf-mm__cab"><span>${rot}</span><b>${rs ? `R$ ${mil(v)} mil` : br(v, 0)}<small> de ${rs ? `${mil(meta)} mil` : br(meta, 0)}</small></b></div>
        ${UI.barra({ v: pc(v), m1: pc(meta), m2: pc(sup), r: pc(meta * VA.FRAC), estado: UI.estadoDe(rr.cls), alt: "sm", aria: `${rot}: ${rs ? "R$ " + mil(v) + " mil" : v} de ${rs ? "R$ " + mil(meta) + " mil" : meta}; ${rr.rot}` })}
        <div class="pf-mm__pe">${st(rr.cls.replace("status--", ""), rr.rot)}<span>esperado hoje ${rs ? "R$ " + mil(meta * VA.FRAC) + " mil" : br(meta * VA.FRAC)}</span></div></div>`;
    };
    const meta = `<section class="cartao pf-meta" aria-labelledby="pf-t-minha">
      <div class="cartao__cab"><h2 id="pf-t-minha">Sua meta <span class="cartao__sub">novembro · ${nomeMed(med)}</span></h2><a class="bt-texto" href="metas.html">Metas <svg class="ico ico-sm"><use href="#i-dir"/></svg></a></div>
      ${VIS.fat ? linhaMeta("Faturamento", d.fat, true) : `<div class="pf-mm">${vgestao("Faturamento")}</div>`}
      ${linhaMeta("Planos fechados", d.plm)}
      ${linhaMeta("Consultas", d.co)}
    </section>`;
    const planos = d.planos.map(p => linha({ id: p.id, cls: "pf-l--compacta",
      txt: `${p.proc}${VIS.plano ? ` · <b class="pf-rs">R$ ${real(p.v)}</b>` : ""}`,
      prazo: st(p.sev, p.sev === "atrasado" ? `${p.venc} dias de atraso` : esc(p.prox || "")) })).join("");
    return {
      resumo: `${d.ag.length} pacientes hoje${prox ? ` · próxima às ${prox.h}` : ""}`,
      coluna: cartaoFoco({ rot: "Sua agenda · hoje", seta: ["agenda.html", "Abrir a agenda"],
        anel: VIS.fat ? UI.anel({ p: d.pct, marca: VA.FRAC * 100, aria: `${d.pct}% da sua meta de faturamento; esperado hoje ${Math.round(VA.FRAC * 100)}%` })
          : UI.anel({ p: d.plm[0] / d.plm[1] * 100, marca: VA.FRAC * 100, aria: `${d.plm[0]} de ${d.plm[1]} planos da meta` }),
        valor: `${d.ag.length}<small>pacientes</small>`,
        nota: (prox ? `<span>próxima: <b>${esc(P[prox.id].nome)}</b> · ${prox.h} · ${prox.tipo}</span>` : "<span>agenda concluída</span>") +
          `<span class="pf-foco__leg">anel: ${VIS.fat ? `<b>${d.pct}%</b> da sua meta de faturamento` : `<b>${d.plm[0]} de ${d.plm[1]}</b> planos da meta`} · esperado hoje ${Math.round(VA.FRAC * 100)}%</span>`,
        extra: [["1ªs consultas", d.ag.filter(a => a.tipo === "1ª consulta").length], ["Com oportunidade", nOport], ["Planos em aberto", d.nPlanos]] }) +
        `<section class="cartao pf-lista pf-fila pf-fila--estudo" aria-labelledby="pf-t-estudo">
          <div class="cartao__cab"><h2 id="pf-t-estudo">Agenda do dia <span class="cartao__sub">com o estudo de cada paciente</span></h2>
            <span class="pf-dica">${ico("i-info", "ico ico-sm")}Coerência clínica, não só objetivo comercial</span></div>
          <ul class="pf-ul">${itens}</ul>
        </section>`,
      lado: meta + cartaoLista({ id: "pf-t-planos", tit: "Seus planos em aberto", sub: `${d.nPlanos} no funil · a Closer acompanha`, itens: planos, vazio: "Nenhum plano em aberto",
        pe: `<span>${d.planos.length} com nome · os mais urgentes primeiro</span><a class="bt-texto" href="funil.html">Funil <svg class="ico ico-sm"><use href="#i-dir"/></svg></a>` }),
    };
  }

  /* ---------- Closer ---------------------------------------------------- */
  function telaCloser(m) {
    const c = dadosCloser(m);
    const planos = c.planos.map(p => linha({ id: p.id,
      chips: `${p.t ? escala(p.t) : ""}<span class="chip">${p.origem}</span>`,
      txt: `${p.proc} · ${esc(p.nota)}`,
      prazo: `<span class="pf-rs pf-rs--lg"><small>R$</small>${real(p.v)}</span><span class="pf-mini">apresentado há ${p.d} dias</span>${st(p.sev, p.sev === "atrasado" ? `${p.venc} dias de atraso` : esc(p.prox || "No prazo"))}${regTent(p.id)}`,
      acoes: `${btWa(p.id, "plano")}${btIco("i-plano", `Montar orçamento para ${p.nome}`, 'data-pf="orcamento"')}` })).join("");
    const saldos = c.saldos.map(s => linha({ id: s.id, cls: "pf-l--compacta",
      txt: `${esc(s.txt)}`,
      prazo: `<span class="pf-rs"><small>R$</small>${real(s.saldo)}</span>${st(s.sev, s.prazo)}`, acoes: btWa(s.id, "plano") })).join("");
    const rec = c.recall.slice(0, 5).map(r => linha({ id: r.id, cls: "pf-l--compacta", com: { r: "closer" },
      chips: `${r.p.carteira ? `<span class="chip">Carteira ${r.p.carteira}</span>` : ""}`,
      txt: `${r.p.proc} · última ${r.ultTxt}`,
      prazo: `${st(-r.dias > 7 ? "atrasado" : "atencao", `venceu há ${-r.dias} ${-r.dias === 1 ? "dia" : "dias"}`)}${regTent(r.id)}`, acoes: btWa(r.id, "recall") })).join("");
    return {
      resumo: `${c.aberto.n} planos em aberto · ${c.recall.length} recalls vencidos`,
      coluna: cartaoFoco({ rot: "Planos em aberto", seta: ["funil.html", "Abrir o funil"],
        valor: `<small>R$</small>${mil(c.aberto.v)}<small>mil</small>`,
        nota: `<span><b>${c.aberto.n}</b> planos apresentados e não fechados</span>${c.riscoPar ? st("atrasado", `R$ ${mil(c.riscoPar)} mil com retorno vencido`) : ""}`,
        extra: [["Fechados no mês", `${c.fech.n}<small> · R$ ${mil(c.fech.v)} mil</small>`], ["Saldos parciais", `<small>R$ </small>${mil(c.saldos.reduce((a, s) => a + s.saldo, 0))}<small> mil</small>`], ["Recall vencido", c.recall.length]] }) +
        cartaoLista({ id: "pf-t-planos", tit: "Planos em aberto", sub: "retorno vencido primeiro", cls: "pf-fila",
          acao: `<button type="button" class="bt-sec" data-pf="orcamento">${ico("i-plano", "ico ico-sm")}Montar orçamento</button>`, itens: planos, vazio: "Nenhum plano em aberto",
          pe: `<span>${c.planos.length} com retorno combinado · ${c.aberto.n - c.planos.length} outros no funil</span><a class="bt-texto" href="funil.html">Ver no funil <svg class="ico ico-sm"><use href="#i-dir"/></svg></a>` }),
      lado: cartaoLista({ id: "pf-t-saldos", tit: "Saldos de fechamento parcial", itens: saldos, vazio: "Nenhum saldo pendente" }) +
        cartaoLista({ id: "pf-t-recall", tit: "Recall vencido", sub: "recompras", itens: rec, vazio: "Nenhum recall vencido",
          pe: `<span>${c.recall.length} vencidos${c.recall.length > 5 ? " · os 5 mais antigos" : ""}</span><a class="bt-texto" href="recall.html">Recall <svg class="ico ico-sm"><use href="#i-dir"/></svg></a>` }),
    };
  }

  /* ---------- Gestão: passagem de bastão -------------------------------- */
  const PESSOA = { sdr: primeiro(QUEM.sdr) || "SDR", recepcao: primeiro(QUEM.recepcao) || "Recepção", medico: "Médicos", closer: primeiro(QUEM.closer) || "Closer" };
  const ARTIGO = { sdr: "a SDR", recepcao: "a Recepção", medico: "o Médico", closer: "a Closer" };
  const NOTA_ET = { sdr: "1º contato · prazo 3 dias", recepcao: "confirmar e registrar", medico: "plano em 1 dia", closer: "retorno em 15 dias" };
  function htmlBastao(m) {
    const b = bastao(m);
    const passos = b.linhas.map((l, i) => {
      const g = b.garg && b.garg.k === l.k;
      return `${i ? `<span class="pf-bt__seta" aria-hidden="true">${ico("i-dir")}</span>` : ""}
      <div class="pf-bt__passo${g ? " pf-bt__passo--garg" : ""}" role="listitem">
        <div class="pf-bt__quem"><span class="pf-com pf-com--${l.k}"><i aria-hidden="true"></i>${VAP.PAPEL[l.k]}</span><span class="pf-bt__pessoa">${PESSOA[l.k]}</span></div>
        <div class="pf-bt__n"><span class="kpi__valor">${l.n}<small>${pl(l.n, "lead", "leads")}</small></span></div>
        <div class="pf-bt__rot">${NOTA_ET[l.k]}</div>
        <div class="pf-bt__st">${l.parados.length ? `<span class="status status--forte">${l.parados.length} parado${l.parados.length > 1 ? "s" : ""}</span>` : `<span class="status status--neutro">nada parado</span>`}${g ? `<span class="pf-bt__garg">gargalo</span>` : ""}</div>
      </div>`;
    }).join("");
    const g = b.garg;
    const motivos = g ? [...new Set(g.parados.map(p => (p.nota || "").split(" · ")[0]))].slice(0, 3) : [];
    return `<div class="cartao__cab"><h2 id="pf-t-bastao">Passagem de bastão <span class="cartao__sub">com quem está cada lead agora</span></h2>
        <a class="bt-texto" href="funil.html#parados">Ver parados no funil <svg class="ico ico-sm"><use href="#i-dir"/></svg></a></div>
      <div class="pf-bt__trilha" role="list">${passos}</div>
      ${g ? `<div class="pf-bt__gargalo">
        <span class="aviso__ico" aria-hidden="true">${ico("i-relogio")}</span>
        <p><b>Gargalo da semana: ${VAP.PAPEL[g.k]}.</b> ${g.parados.length} leads parados com ${ARTIGO[g.k]}${VIS.plano ? ` · R$ ${mil(g.risco)} mil em risco` : ""}. <span class="muted">${motivos.map(esc).join(" · ")}.</span></p>
        <span class="pf-bt__nomes">${g.parados.map(p => av(p.med, p.nome, true)).join("")}</span>
      </div>` : `<p class="pf-bt__ok">Nenhum lead parado acima do prazo. O bastão está passando.</p>`}`;
  }

  /* =====================================================================
     5. MONTAGEM DO PAINEL
     ===================================================================== */
  const aviso = html => { const f = (window.VAM && window.VAM.aviso) || (TL && TL.aviso); if (f) f(html); };
  function entraLinhas(raiz) {
    if (REDUZ) return;
    $$(".pf-l, .pf-bt__passo", raiz).forEach((el, i) => anima(el, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
      { duration: 560, delay: Math.min(i * 40, 360), easing: EASE, fill: "backwards" }));
  }
  const TELAS = { sdr: telaSDR, recepcao: telaRecepcao, medico: telaMedico, closer: telaCloser };
  let raizPerfil = null;
  function renderPerfil(anim) {
    const t = TELAS[PERFIL](medAtual());
    raizPerfil.innerHTML = `<div class="coluna">${t.coluna}</div><aside class="lado" aria-label="Também para hoje">${t.lado}</aside>`;
    if (PERFIL === "medico") plMini(raizPerfil);
    const r = $("#resumo-dia"); if (r) r.textContent = t.resumo;
    UI.medeNumeros && UI.medeNumeros();
    if (anim) entraLinhas(raizPerfil);
  }
  // revisão pacotes: mini-mapa do plano (48px) no estudo da agenda do Médico.
  // Os scripts do plano carregam sob demanda (o Painel não os inclui; os números não mudam).
  function plMini(raiz) {
    if (!$("[data-plmini]", raiz)) return;
    const vai = () => { if (window.PLMINI) window.PLMINI.preenche(raiz, { valores: false }); };
    if (window.PLMINI) { vai(); return; }
    const tem = { "pacotes.js": () => window.PAC, "plano_motor.js": () => window.PL, "planos_dados.js": () => window.PLD,
      "desenhos/desenhos_estetica.js": () => window.DES && window.DES.rosto, "desenhos/desenhos_odonto.js": () => window.DES && window.DES.odontograma, "plano_mini.js": () => window.PLMINI };
    const fila = Object.keys(tem).filter(k => !tem[k]());
    const um = () => { const s = fila.shift(); if (!s) { vai(); return; } const e = doc.createElement("script"); e.src = s; e.onload = um; e.onerror = um; doc.body.appendChild(e); };
    um();
  }
  function montaPainel() {
    const grade = $("main .grade"); if (!grade) return;
    if (PERFIL === "gestao") {
      const sec = doc.createElement("section");
      sec.className = "cartao pf-bastao"; sec.id = "pf-bastao"; sec.setAttribute("aria-labelledby", "pf-t-bastao");
      const ref = $("#aviso-parados");
      if (ref) ref.after(sec); else $(".coluna", grade).prepend(sec);
      const r = () => { sec.innerHTML = htmlBastao(medAtual()); };
      r();
      $$(".pilulas .pilula").forEach(b => b.addEventListener("click", () => setTimeout(() => { r(); entraLinhas(sec); }, 0)));
      return;
    }
    grade.hidden = true; grade.setAttribute("aria-hidden", "true");
    raizPerfil = doc.createElement("div");
    raizPerfil.className = "grade pf-grade"; raizPerfil.id = "pf-tela"; raizPerfil.dataset.perfil = PERFIL;
    grade.after(raizPerfil);
    // Médico: abre na própria agenda (a pílula do outro médico continua disponível)
    if (PERFIL === "medico") { const b = $(`.pilulas .pilula[data-med="${MED_EU}"]`); if (b && b.getAttribute("aria-pressed") !== "true") b.click(); }
    renderPerfil(false);
    $$(".pilulas .pilula").forEach(b => b.addEventListener("click", () => setTimeout(() => renderPerfil(true), 0)));
    // Ações da tela
    raizPerfil.addEventListener("click", e => {
      const bt = e.target.closest("[data-pf]"); if (!bt) return;
      const li = bt.closest("[data-id]"), id = li && li.dataset.id, p = id && P[id], hh = horaAgora();
      const tipo = bt.dataset.pf;
      if (tipo === "orcamento") {
        location.href = p ? `plano.html?p=${encodeURIComponent(id)}` : "plano.html";   // revisão pacotes: a tela do plano
      } else if (tipo === "checkin") {
        const on = !chegou[id];
        if (on) { chegou[id] = hh; nChegadas++; } else { delete chegou[id]; nChegadas--; }
        renderPerfil(false);
        const nova = $(`[data-id="${id}"] .pf-checkin`, raizPerfil); if (nova) nova.focus({ preventScroll: true });
        const lin = $(`[data-id="${id}"]`, raizPerfil); if (lin && !REDUZ) anima(lin, [{ backgroundColor: "var(--ok-fundo)" }, { backgroundColor: "transparent" }], { duration: 900, easing: EASE });
        aviso(on ? `Chegada registrada · <b>${esc(p.nome)}</b> · ${hh}` : `Chegada desfeita · <b>${esc(p.nome)}</b>`);
      } else if (tipo === "respondido" || tipo === "registrar") {
        const feito = li.classList.toggle("pf-l--feita");
        bt.setAttribute("aria-pressed", feito);
        const s = $(".pf-l__prazo .status", li);
        if (feito) { li.dataset.orig = s ? s.outerHTML : ""; if (s) s.outerHTML = st("ok", tipo === "registrar" ? `Registrado ${hh}` : `Respondido ${hh}`); }
        else if (s && li.dataset.orig) s.outerHTML = li.dataset.orig;
        aviso(feito ? `${tipo === "registrar" ? "Comparecimento registrado" : "Marcado como respondido"} · <b>${esc(p.nome)}</b>` : `Desfeito · <b>${esc(p.nome)}</b>`);
      }
    });
    // Estudo do paciente: abre com uma transição suave
    raizPerfil.addEventListener("toggle", e => {
      const d = e.target; if (!d.matches || !d.matches("details") || !d.open || REDUZ) return;
      const c = $(".pf-est__corpo", d); if (c) anima(c, [{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], { duration: 520, easing: EASE });
    }, true);
  }
  // Hora do clique (o protótipo vive às 09:40; cada ação avança 1 minuto)
  let minuto = 0;
  const horaAgora = () => { const t = AGORA + (++minuto); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };

  /* =====================================================================
     6. "COM QUEM ESTÁ AGORA" NAS TELAS EXISTENTES + VISIBILIDADE
     ===================================================================== */
  const idDe = nome => NOMES[String(nome || "").trim()];
  function decora() {
    // Painel (Gestão): linhas de "Atenção hoje"
    $$("#lista-atencao .at-linha").forEach(li => {
      if ($(".pf-com", li)) return;
      const id = idDe(($(".linha__nome", li) || {}).textContent); if (!id) return;
      const l1 = $(".at-l1", li); if (l1) l1.insertAdjacentHTML("beforeend", chipCom(id));
    });
    // Funil: cartões do quadro e linhas da tabela
    $$(".fn-card").forEach(c => {
      if ($(".pf-com", c)) return;
      const id = idDe(($(".fn-card__nome", c) || {}).textContent); if (!id) return;
      const meta = $(".fn-card__meta", c); if (meta) meta.insertAdjacentHTML("beforeend", chipCom(id, { cls: "pf-com--card" }));
    });
    $$("#tabela tr[data-med]").forEach(tr => {
      if ($(".pf-com", tr)) return;
      const id = idDe(($(".fn-pac b", tr) || {}).textContent); if (!id) return;
      const td = tr.children[5]; if (td) td.insertAdjacentHTML("beforeend", chipCom(id, { cls: "pf-com--tab" }));
    });
    mascara();
  }
  // Troca o conteúdo de um bloco por "Visível para a gestão" sem abrir buraco no layout
  // modo: "titulo" (o rótulo do cartão continua à vista; o véu não repete o nome),
  // "todo" (esconde também o rótulo), "curto" (o cartão encolhe: só o véu, sem altura vazia)
  function veu(el, rot, sub, modo = "titulo") {
    if (!el || el.classList.contains("pf-mascarado")) return;
    el.classList.add("pf-mascarado", "pf-mascarado--" + modo);
    el.insertAdjacentHTML("beforeend", modo === "titulo" ? vgestao(sub, " ").replace("<span> </span>", "") : vgestao(rot, sub));
  }
  function mascara() {
    if (pagina === "metas" && !VIS.fat) {
      veu($(".metas-foco"), "Faturamento · novembro", "Visível para a gestão");
      const rit = $("#v-rit"); if (rit) veu(rit.closest(".kpi"), "Ritmo necessário", "Visível para a gestão");
      const ano = $("#t-ano"); if (ano) veu(ano.closest(".cartao"), "Faturamento de 2026", "Visível para a gestão", "curto");
      $$("#lista-metas .metas-linha").forEach(li => {
        const n = ($(".linha__nome", li) || {}).textContent || "";
        if (/^Faturamento/.test(n) || (!VIS.plano && /^Valor em planos/.test(n))) li.classList.add("pf-linha-oculta");
      });
      $$("#por-medico .metas-mini").forEach(x => { if (/Faturamento/.test(($(".metas-mini__rot", x) || {}).textContent || "")) x.classList.add("pf-mini-oculta"); });
      $$("#por-medico .rodape-cartao").forEach(x => x.classList.add("pf-mini-oculta"));
      $$(".pilulas .pilula").forEach(b => { b.removeAttribute("title"); const n = $(".pilula__n", b); if (n) n.hidden = true; });
    }
    if (pagina === "rel") {
      if (!VIS.fat) { const pr = $("#procedimentos"); if (pr) veu(pr, "Faturamento por procedimento", "Visível para a gestão", "todo"); }
      if (!VIS.plano) {
        veu($(".rl-foco"), "Fechado em 2026", "Valores visíveis para a gestão");
        const t = $("#k-ticket"); if (t) veu(t.closest(".kpi"), "Ticket médio", "Visível para a gestão");
        $$("#orig .rl-num").forEach(x => { if (/R\$/.test(x.textContent)) x.classList.add("pf-oculto"); });
        $$("#orig .rl-orig__cab").forEach(x => { if (/valor|R\$/i.test(x.textContent)) x.classList.add("pf-oculto"); });
      }
    }
    if (pagina === "funil" && !VIS.plano) {
      veu($(".fn-foco"), "Fechado em 2026", "Valores visíveis para a gestão");
      const ab = $("#r-aberto"); if (ab) veu(ab.closest(".fn-num"), "Planos em aberto", "Valores visíveis para a gestão", "todo");
      const risco = $("#r-risco");
      if (risco && !risco.dataset.pf) { risco.dataset.pf = "1"; risco.hidden = true; const t = risco.nextSibling; if (t && t.nodeType === 3) t.nodeValue = ""; }
      $$(".fn-col__sel .status--ok").forEach(s => { s.textContent = s.textContent.replace(/\s*·\s*R\$.*$/, ""); });
    }
  }

  /* =====================================================================
     Início
     ===================================================================== */
  if (pagina === "painel") montaPainel();
  decora();
  const main = $("main");
  if (main && ["funil", "painel", "metas", "rel"].includes(pagina)) {
    let pend = 0;
    new MutationObserver(() => { if (!pend) pend = requestAnimationFrame(() => { pend = 0; decora(); }); }).observe(main, { childList: true, subtree: true });
  }
  window.MUNIN_PERFIS = { perfil: PERFIL, visao: VIS, rot: ROT, contas: CONTAS, chipCom, responsavel: VAP.responsavel, bastao };
})();
