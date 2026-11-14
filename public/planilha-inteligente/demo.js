/* Painel de demonstração: dá acesso a todas as funções sem precisar mexer no endereço. */
(function () {
  const d = document, q = new URLSearchParams(location.search);
  const css = `
  .demo-fab{position:fixed;right:20px;bottom:20px;z-index:9000;font:600 14px/1 Inter,system-ui,sans-serif;color:#F4F5F2}
  .demo-fab>button{display:flex;align-items:center;gap:10px;height:46px;padding:0 18px 0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);
    background:rgba(30,51,40,.88);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);color:inherit;cursor:pointer;
    box-shadow:0 12px 32px rgba(14,22,17,.28),inset 0 1px 0 rgba(255,255,255,.14);font:inherit}
  .demo-fab>button i{width:8px;height:8px;border-radius:50%;background:#A5C8B3;box-shadow:0 0 0 4px rgba(165,200,179,.18)}
  .demo-menu{position:absolute;right:0;bottom:58px;width:300px;padding:10px;border-radius:20px;background:rgba(22,39,30,.94);
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 60px rgba(14,22,17,.35);
    transform-origin:100% 100%;transition:opacity .2s cubic-bezier(.2,.8,.2,1),transform .2s cubic-bezier(.2,.8,.2,1)}
  .demo-menu[hidden]{display:block;opacity:0;transform:translateY(6px) scale(.98);pointer-events:none;visibility:hidden}
  .demo-menu h4{margin:6px 10px 8px;font:600 11px/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#A5C8B3}
  .demo-menu a,.demo-menu button.it{display:block;width:100%;min-height:44px;padding:10px 12px;border-radius:12px;border:0;background:none;
    color:#F4F5F2;text-decoration:none;font:500 15px/1.2 Inter,sans-serif;cursor:pointer;text-align:left}
  .demo-menu a:hover,.demo-menu button.it:hover,.demo-menu a:focus-visible,.demo-menu button.it:focus-visible{background:rgba(255,255,255,.08);outline:none}
  .demo-menu small{display:block;color:rgba(244,245,242,.6);font-weight:400;font-size:12.5px;margin-top:3px}
  .demo-menu .sep{height:1px;background:rgba(255,255,255,.1);margin:8px 6px}
  .demo-menu label{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 12px 8px;font:500 14px/1 Inter,sans-serif;color:rgba(244,245,242,.8)}
  .demo-menu select{height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#F4F5F2;padding:0 10px;font:500 14px Inter,sans-serif}
  .demo-menu select option{color:#17231B}
  @media (max-width:720px){.demo-fab{right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px))}.demo-fab>button{height:42px}}
  @media (prefers-reduced-motion:reduce){.demo-menu{transition:opacity .15s}}`;
  const st = d.createElement("style"); st.textContent = css; d.head.appendChild(st);

  const nomeAtual = q.get("nome") || (window.VAM && window.VAM.nome) || "Dra. Lúcia";
  const url = (pg, extra) => { const u = new URL(pg, location.href); Object.entries(extra || {}).forEach(([k, v]) => u.searchParams.set(k, v)); if (q.get("nome")) u.searchParams.set("nome", q.get("nome")); return u.pathname.split("/").pop() + u.search + (u.hash || ""); };

  const box = d.createElement("div"); box.className = "demo-fab";
  box.innerHTML = `
    <div class="demo-menu" id="demoMenu" role="menu" hidden>
      <h4>Demonstração</h4>
      <a role="menuitem" href="${url("painel.html", { intro: 1 })}">Abertura "Bom dia"<small>Como a pessoa vê no primeiro acesso do dia</small></a>
      <button role="menuitem" class="it" id="demoNoite" type="button">Encerrar o dia · "Boa noite"<small>Resumo do dia e despedida</small></button>
      <a role="menuitem" href="funil.html#parados">Leads parados<small>Funil filtrado nos que passaram do prazo</small></a>
      <a role="menuitem" href="painel.html?intro=0">WhatsApp e agenda<small>Botões em "Atenção hoje" e na linha do tempo</small></a>
      <a role="menuitem" href="metas.html?intro=0">Metas<small>Anéis, faixa da meta e o ano</small></a>
      <div class="sep"></div>
      <label>Entrar como
        <select id="demoNome" aria-label="Entrar como">
          ${["Dra. Lúcia", "Dr. Rafael", "Recepção"].map(n => `<option${n === nomeAtual ? " selected" : ""}>${n}</option>`).join("")}
        </select></label>
    </div>
    <button type="button" aria-expanded="false" aria-controls="demoMenu"><i></i>Demonstração</button>`;
  d.body.appendChild(box);

  const bt = box.querySelector(":scope>button"), menu = box.querySelector("#demoMenu");
  const abre = v => { menu.hidden = !v; bt.setAttribute("aria-expanded", String(v)); if (v) menu.querySelector("a,button").focus(); };
  bt.addEventListener("click", () => abre(menu.hidden));
  d.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { abre(false); bt.focus(); } });
  d.addEventListener("click", e => { if (!box.contains(e.target)) abre(false); });

  box.querySelector("#demoNoite").addEventListener("click", () => {
    abre(false);
    if (window.VAM && typeof window.VAM.encerrar === "function") window.VAM.encerrar();
    else location.href = url("painel.html", { hora: 18, intro: 0 });
  });
  box.querySelector("#demoNome").addEventListener("change", e => {
    const u = new URL("painel.html", location.href); u.searchParams.set("nome", e.target.value); u.searchParams.set("intro", "1");
    location.href = u.pathname.split("/").pop() + u.search;
  });
})();
