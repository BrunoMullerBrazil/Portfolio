/* =====================================================================
   Peças da entrada (entrar.html) e do convite (convite.html): símbolo Munin,
   G do Google, painel grafite com o recorte do produto, seletor de contas
   simulado e a troca suave de etapas. Carregar DEPOIS de dados.js e dados2.js.
   Login real: Google (Firebase Auth) + lista de e-mails autorizados pela clínica.
   ===================================================================== */
(function () {
  "use strict";
  const doc = document, VA = window.VA, VA2 = window.VA2;
  const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.22,1,.36,1)";
  const anima = (el, kf, o) => { try { return el.animate(kf, o); } catch (e) { return null; } };
  const CLIENTE = "Clínica Aurora";
  // Símbolo Munin (cópia de Munin_marca/svg/munin_simbolo.svg, igual ao de comum.js)
  const SIMBOLO = `<path class="munin-corpo" d="M5.50,70.00 a18.5,18.5 0 1,0 37.0,0 a18.5,18.5 0 1,0 -37.0,0 Z M49.50,23.00 a18.5,18.5 0 1,0 37.0,0 a18.5,18.5 0 1,0 -37.0,0 Z M49.50,70.00 a18.5,18.5 0 1,0 37.0,0 a18.5,18.5 0 1,0 -37.0,0 Z M49.50,23.00 L49.50,70.00 L86.50,70.00 L86.50,23.00 Z M42.49,69.39 C41.86,50.29 49.51,42.12 68.61,41.49 A18.5,18.5 0 1 0 49.51,23.61 C50.14,42.71 42.49,50.88 23.39,51.51 Z"/><path class="munin-ponto" d="M5.50,23.00 a18.5,18.5 0 1,0 37.0,0 a18.5,18.5 0 1,0 -37.0,0 Z"/>`;
  const simbolo = cls => `<svg class="munin ${cls || ""}" viewBox="0 0 94 94" aria-hidden="true">${SIMBOLO}</svg>`;
  // "G" oficial do Google em quatro cores
  const G = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
  const ICO = {
    seta: '<path d="m9.5 6 6 6-6 6"/>', esq: '<path d="m14.5 6-6 6 6 6"/>', cadeado: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    escudo: '<path d="M12 3.5 19 6v5.5c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    mais: '<path d="M12 5v14M5 12h14"/>', envio: '<path d="M20.5 3.5 10 14M20.5 3.5l-6.5 17-3.5-6.5-6.5-3.5z"/>', info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    agenda: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', funil: '<path d="M3.5 5h17l-6.5 7.5V19l-4 1.5v-8z"/>', recall: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4.5H8"/><path d="M12 8v4.2l3 1.8"/>',
    google: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M7.5 12h9"/>',
  };
  const ico = (k, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;
  const iniciais = n => { const p = n.replace(/^(Dra?\.)\s+/, "").split(/\s+/).filter(x => x.length > 1); return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); };

  /* Painel grafite: recorte do produto (números reais de dados.js) */
  function palco(el, { topo, titulo, texto }) {
    const [fv, fm] = VA.metaVal("fat", "todos"), pct = Math.round(fv / fm * 100), esp = Math.round(VA.FRAC * 100);
    const mil = v => (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    const at = VA.ATENCAO.slice(0, 3).map(a => { const p = VA.P[a.id]; return `<li><span class="av av--${p.med} av--sm" aria-hidden="true">${iniciais(p.nome)}</span><div style="min-width:0"><b>${p.nome}</b><span class="s">${VA.TIPO_ROT[a.tipo]} · ${a.txt.split(" · ")[0]}</span></div><span class="status ${a.sev === "atrasado" ? "status--atrasado" : "status--atencao"}">${a.prazo || a.dias + " dias"}</span></li>`; }).join("");
    const c = 2 * Math.PI * 42;
    el.innerHTML = `${simbolo("en-palco__simbolo")}
      <div class="en-palco__topo"><span><i></i>${topo}</span><span>${CLIENTE}</span></div>
      <div class="en-previa" aria-hidden="true">
        <div class="en-pc en-pc--escuro"><span class="en-pc__rot">Faturamento · novembro</span>
          <div class="en-pc__lin"><div class="anel"><svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%"><defs><linearGradient id="en-g" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#8591E2"/><stop offset="1" stop-color="#B9C0F2"/></linearGradient></defs><circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.11)" stroke-width="11"/><circle class="en-arco" cx="50" cy="50" r="42" fill="none" stroke="url(#en-g)" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(pct / 100 * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/></svg><span class="anel__v" style="color:#fff">${pct}<small>%</small></span></div>
          <div><div class="en-pc__v"><small>R$</small>${mil(fv)}<small>mil</small></div><div class="en-pc__nota">meta R$ ${mil(fm)} mil · esperado hoje ${esp}%</div></div></div></div>
        <div class="en-pc"><span class="en-pc__rot">Atenção hoje</span><ul>${at}</ul></div>
        <div class="en-pc en-pc--largo"><b>${VA.parados("todos").length} leads parados</b><span class="en-pc__barra"><i></i></span><b style="color:var(--texto-2);font-weight:500">${VA.AGENDA.filter(a => !a.evento).length} pacientes hoje</b></div>
      </div>
      <div><div class="en-palco__frase"><h2>${titulo}</h2><p>${texto}</p></div>
      <div class="en-palco__pe" style="margin-top:26px"><span>${ico("agenda")}Agenda e confirmações</span><span>${ico("funil")}Funil de leads</span><span>${ico("recall")}Recall e metas</span></div></div>`;
    if (!REDUZ) {
      [...el.querySelectorAll(".en-pc")].forEach((p, i) => anima(p, [{ opacity: 0, transform: "translateY(14px)", filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 760, delay: 180 + i * 90, easing: EASE, fill: "backwards" }));
      const a = el.querySelector(".en-arco"); if (a) anima(a, [{ strokeDasharray: `0 ${c}` }, { strokeDasharray: a.getAttribute("stroke-dasharray") }], { duration: 1100, delay: 420, easing: EASE, fill: "backwards" });
    }
  }

  /* Seletor de contas no estilo da janela do Google */
  function seletor({ titulo, sub, contas, outra = true }) {
    return `<div class="en-google" role="group" aria-labelledby="en-g-tit">
      <div class="en-google__cab"><p>${G}Fazer login com o Google</p><h2 id="en-g-tit">${titulo}</h2><p class="sub">${sub}</p></div>
      <ul class="en-contas">${contas.map((c, i) => `<li><button type="button" class="en-conta${c.negada ? " en-conta--outra" : ""}" data-i="${i}">
        <span class="av av--${c.cor || "r"}" aria-hidden="true">${c.ini || iniciais(c.completo)}</span>
        <span style="min-width:0"><b><span class="nm">${c.completo}</span>${c.perfil && VA2.PERFIS[c.perfil] ? `<span class="en-perfil">${VA2.PERFIS[c.perfil].rot}</span>` : ""}</b><small>${c.email}</small></span>
        <span class="en-conta__ir">${ico("seta")}</span></button></li>`).join("")}
        ${outra ? `<li><button type="button" class="en-conta en-conta--outra" data-outra><span class="av" aria-hidden="true">${ico("google", "ico ico-sm")}</span><span><b>Usar outra conta</b></span><span class="en-conta__ir">${ico("seta")}</span></button></li>` : ""}
      </ul>
      <p class="en-google__pe">Para continuar, o Google vai compartilhar seu nome, e-mail e foto do perfil com o Munin.</p></div>`;
  }

  /* Troca de etapa com entrada suave (e foco no título da etapa nova) */
  function mostra(etapas, id) {
    etapas.forEach(e => { e.hidden = e.id !== id; });
    const el = doc.getElementById(id);
    if (!REDUZ) [...el.children].forEach((c, i) => anima(c, [{ opacity: 0, transform: "translateY(10px)", filter: "blur(3px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 620, delay: Math.min(i * 60, 360), easing: EASE, fill: "backwards" }));
    const t = el.querySelector("h1, h2"); if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
    return el;
  }
  // Entrada da página: marca, textos e botão em cascata
  function abertura(raiz) {
    if (REDUZ) return;
    [...raiz.querySelectorAll("[data-entra]")].forEach((c, i) => anima(c, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 80 + i * 70, easing: EASE, fill: "backwards" }));
  }
  // Grava quem entrou e vai para o painel com a abertura "Bom dia"
  function entra(c) {
    try { localStorage.setItem("munin:nome", c.nome); localStorage.setItem("munin:perfil", c.perfil); sessionStorage.setItem("munin:sessao", "1"); } catch (e) { /* sem armazenamento */ }
    const u = new URLSearchParams({ nome: c.nome, perfil: c.perfil, intro: "1" });
    location.href = "painel.html?" + u.toString();
  }

  window.EN = { simbolo, G, ico, palco, seletor, mostra, abertura, entra, iniciais, CLIENTE, REDUZ };
})();
