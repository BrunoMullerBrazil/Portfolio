/* =====================================================================
   plano_mini.js · mini-mapa do plano (48px) para o estudo da agenda do Médico
   (window.PLMINI). Revisão "pacotes". Carregado sob demanda por perfis.js.
   - O mesmo desenho do plano, sem rótulos: aceitos em pena cheio, propostos
     em pena claro, em aberto tracejados. Sem valores no modo médico.
   - Os desenhos da estética ainda trazem ids antigos (r-glabela…): a mesma
     conversão de plano.js é aplicada aqui.
   ===================================================================== */
(function () {
  "use strict";
  const W = window, doc = document, PAC = W.PAC, PL = W.PL, PLD = W.PLD, DES = W.DES || {};
  if (!PAC || !PL || !PLD) return;
  const MAPA_ID = { "r-frontal": "frontal", "r-glabela": "glabela", "r-periorbital": "periorbital", "r-olheira": "olheira", "r-nariz": "nariz", "r-malar": "malar",
    "r-sulco-ng": "nasogeniano", "r-labios": "labios", "r-mento": "mento", "r-mandibula": "mandibula", "r-masseter": "masseter", "r-papada": "papada",
    "r-pescoco": "pescoco", "r-colo": "colo", "r-axilas": "axila", "r-bracos": "braco", "r-maos": "maos", "r-abdome-sup": "abdome_sup", "r-abdome-inf": "abdome_inf",
    "r-flancos": "flanco", "r-coxas-ext": "coxa_ext", "r-coxas-int": "coxa_int", "r-joelhos": "joelho", "r-costas-sup": "costas_sup", "r-costas-inf": "costas_inf",
    "r-bracos-post": "braco_post", "r-gluteos": "gluteo", "r-culote": "culote", "r-panturrilhas": "panturrilha" };
  const FORCA = { aceito: 4, realizado: 3, proposto: 2, em_aberto: 1 };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  if (!doc.getElementById("pl-mini-css")) {
    const st = doc.createElement("style"); st.id = "pl-mini-css";
    st.textContent = `.pf-plmini:empty{display:none}.pf-plmini{margin-top:6px}
.pl-mini{display:inline-flex;align-items:center;gap:10px;min-height:48px}
.pl-mini__d{height:48px;color:var(--ardosia,#6B6E7B);line-height:0;flex:none;padding:0 2px}
.pl-mini__d svg{height:48px;width:auto;display:block;overflow:visible}
.pl-mini__d .pl-contorno{fill:none;stroke:currentColor;stroke-width:.9px;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.pl-mini__d .pl-ref,.pl-mini__d .pl-det,.pl-mini__d .pl-guia,.pl-mini__d .pl-num,.pl-mini__d .pl-rot,.pl-mini__d .pl-olhos,.pl-mini__d .pl-sobrancelhas,.pl-mini__d .pl-narinas,.pl-mini__d .pl-labios,.pl-mini__d .pl-nariz,.pl-mini__d .pl-queixo,.pl-mini__d .pl-orelhas{display:none}
.pl-mini__d [data-alvo],.pl-mini__d [data-alvo]>*{fill:transparent;stroke:none}
.pl-mini__d [data-st="aceito"],.pl-mini__d [data-st="realizado"]{fill:var(--pena,#4657C8)}
.pl-mini__d [data-st="proposto"]{fill:rgba(70,87,200,.3)}
.pl-mini__d [data-st="em_aberto"]{fill:rgba(70,87,200,.08);stroke:var(--pena,#4657C8);stroke-width:1px;stroke-dasharray:2 1.6;vector-effect:non-scaling-stroke}
.pl-mini__chip{display:inline-flex;align-items:center;gap:6px;min-height:24px;padding:2px 10px;border-radius:999px;border:1px dashed var(--pena,#4657C8);color:var(--pena-2,#3847AE);font-size:var(--t-xs,11.5px);font-weight:600;line-height:1.3}
.pl-mini__chip--ok{border-style:solid;border-color:var(--linha-forte,#CAC9C2);color:var(--texto-2,#5A5D68)}`;
    doc.head.appendChild(st);
  }

  function normaliza(svg, pac) {
    [...svg.querySelectorAll("[data-alvo]")].forEach(el => {
      const orig = el.dataset.alvo, base = MAPA_ID[orig] || orig;
      el.removeAttribute("id");
      const lados = [...el.children].filter(c => c.dataset && c.dataset.lado);
      if (lados.length && PAC.alvo(pac, base + "_e")) { el.removeAttribute("data-alvo"); lados.forEach(c => { c.dataset.alvo = base + "_" + c.dataset.lado.toLowerCase(); }); }
      else if (PAC.alvo(pac, base)) el.dataset.alvo = base;
      else el.removeAttribute("data-alvo");
    });
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    return svg;
  }
  // HTML do mini-mapa de um plano (null quando não há desenho)
  function mini(plano, opts) {
    opts = opts || {};
    const pac = PAC.get(plano.pacote); if (!pac) return "";
    const vivos = plano.itens.filter(i => i.status !== "recusado");
    const conta = {};
    vivos.forEach(it => { const a = PAC.alvo(pac, it.alvo); if (a && a.vista && DES[a.vista]) conta[a.vista] = (conta[a.vista] || 0) + 1; });
    const vista = Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0];
    let des = "";
    if (vista) {
      const box = doc.createElement("div"); box.innerHTML = DES[vista];
      const svg = box.querySelector("svg");
      if (svg) {
        normaliza(svg, pac);
        const st = {};
        vivos.forEach(it => PAC.alvosDoItem(pac, it).forEach(id => { if (!st[id] || FORCA[it.status] > FORCA[st[id]]) st[id] = it.status; }));
        [...svg.querySelectorAll("[data-alvo]")].forEach(el => { if (st[el.dataset.alvo]) el.dataset.st = st[el.dataset.alvo]; });
        [...svg.querySelectorAll("style")].forEach(s => s.remove());
        des = `<span class="pl-mini__d">${svg.outerHTML}</span>`;
      }
    }
    const tot = PL.totalPlano(plano), vals = {}; tot.itens.forEach(i => (vals[i.uid] = i.valor));
    const ab = vivos.filter(i => i.status === "em_aberto"), sug = vivos.filter(i => i.sugerido);
    const nomes = arr => [...new Set(arr.map(i => PAC.nomeAlvo(pac, i).toLowerCase()))].join(" + ");
    const procs = arr => [...new Set(arr.map(i => (PAC.proc(pac, i.proc) || { nome: "" }).nome.split(" ")[0].toLowerCase()))].join(" + ");
    let chip;
    if (ab.length) chip = `${opts.valores ? `R$ ${ab.reduce((s, i) => s + (vals[i.uid] || 0), 0).toLocaleString("pt-BR")}` : `${ab.length} ${ab.length === 1 ? "item" : "itens"}`} em aberto · ${esc(nomes(ab))} · ${esc(procs(ab))}`;
    else if (sug.length) chip = `${sug.length} ${sug.length === 1 ? "sugestão sua" : "sugestões suas"} · ${esc(nomes(sug))}`;
    const rot = `Plano: ${vivos.length} ${vivos.length === 1 ? "item" : "itens"}${ab.length ? `, ${ab.length} em aberto` : ""}`;
    return `<span class="pl-mini" role="img" aria-label="${esc(rot)}">${des}${chip ? `<span class="pl-mini__chip">${chip}</span>` : `<span class="pl-mini__chip pl-mini__chip--ok">${esc(plano.subStatus || "plano em dia")}</span>`}</span>`;
  }
  function preenche(raiz, opts) {
    [...(raiz || doc).querySelectorAll("[data-plmini]")].forEach(el => {
      const p = PLD.plano(el.dataset.plmini);
      el.innerHTML = p && p.itens && p.itens.length ? mini(p, opts) : "";
    });
  }
  W.PLMINI = { mini, preenche, normaliza, MAPA_ID };
})();
