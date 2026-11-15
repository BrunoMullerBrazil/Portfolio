/* =====================================================================
   DADOS COMPLEMENTARES (fictícios) das telas Agenda, Recall, Relatórios,
   Ajustes e Entrar. Carregar DEPOIS de dados.js e ANTES de comum.js.
   Não muda nenhum número das telas Painel, Funil e Metas: os pacientes
   extras entram em VA.P sem etapa (não contam no funil nem nos parados).
   window.VA2 · hoje = sexta 13/11/2026, 09:40 (mesmo relógio de dados.js)
   ===================================================================== */
(function () {
  const VA = window.VA, P = VA.P, ANO = 2026;
  const add = (id, o) => (P[id] = Object.assign({ id, extra: true }, o));

  /* ---------- Pacientes extras (aparecem na agenda da semana e no recall) */
  const EXTRAS = [
    ["anabeatriz", "Ana Beatriz Lopes", "d", "Instagram", "Toxina botulínica"],
    ["marta", "Marta Guimarães", "g", "Indicação", "Bioestimulador"],
    ["rita", "Rita Fonseca", "d", "Google", "Peeling químico"],
    ["clara", "Clara Nogueira", "g", "Site", "Laser · rejuvenescimento"],
    ["beatriz", "Beatriz Sales", "d", "Indicação", "Skinbooster"],
    ["laura", "Laura Pimentel", "g", "Instagram", "Toxina botulínica"],
    ["eduarda", "Eduarda Reis", "d", "Campanha", "Preenchimento labial"],
    ["tania", "Tânia Moreira", "g", "Indicação", "Ultrassom microfocado"],
    ["silvia", "Silvia Prates", "d", "Google", "Consulta dermatológica"],
    ["vanessa", "Vanessa Dias", "g", "Instagram", "Toxina botulínica"],
    ["carolina", "Carolina Mendes", "d", "Site", "Bioestimulador"],
    ["regina", "Regina Pacheco", "g", "Indicação", "Liftera papada"],
    ["isabela", "Isabela Torres", "d", "Instagram", "Laser · manchas"],
    ["monica", "Mônica Fagundes", "g", "Google", "Consulta de pele"],
    ["lorena", "Lorena Campos", "d", "Indicação", "Toxina botulínica"],
    ["denise", "Denise Arantes", "g", "Site", "Skinbooster"],
    ["paloma", "Paloma Ribeiro", "d", "Campanha", "Peeling químico"],
    ["giovana", "Giovana Castilho", "g", "Instagram", "Preenchimento labial"],
    ["leticia", "Letícia Amaral", "d", "Google", "Tratamento de pele"],
    ["marcelo", "Marcelo Viana", "g", "Indicação", "Toxina botulínica"],
    ["andre", "André Quintela", "d", "Google", "Consulta de pele"],
    ["rodrigo", "Rodrigo Saldanha", "g", "Site", "Consulta dermatológica"],
    ["elisa", "Elisa Barreto", "d", "Indicação", "Bioestimulador"],
    ["nathalia", "Nathália Gouveia", "g", "Instagram", "Laser · rejuvenescimento"],
    ["bruna", "Bruna Esteves", "d", "Campanha", "Toxina botulínica"],
    ["cintia", "Cíntia Lacerda", "g", "Indicação", "Skinbooster"],
    ["irene", "Irene Valente", "d", "Site", "Ultrassom microfocado"],
    ["renan", "Renan Mota", "g", "Google", "Tratamento de pele"],
  ];
  EXTRAS.forEach(([id, nome, med, origem, proc]) => add(id, { nome, med, origem, proc }));
  // Pacientes da casa sem recall pendente: só ocupam os horários gerados da agenda (cada um no máximo
  // uma vez por semana). Nomes fixos, montados de duas listas; não entram no funil nem no recall.
  const CASA_N = ["Alice", "Bárbara", "Cecília", "Daniela", "Estela", "Fabiana", "Gabriela", "Heloísa", "Ivone", "Juliana", "Kátia", "Luíza",
    "Michele", "Natália", "Olívia", "Pietra", "Raíssa", "Sabrina", "Talita", "Úrsula", "Valéria", "Yara", "Zilda", "Adélia", "Bianca", "Celina",
    "Dalva", "Elaine", "Flávia", "Glória", "Helga", "Inês", "Jussara", "Lídia", "Marisa", "Nádia", "Odete", "Priscila", "Rosana", "Selma",
    "Tereza", "Vera", "Wanda", "Aurora", "Beatriz", "Carmem", "Diana", "Eliane", "Fernanda", "Gisele", "Hilda", "Ivana", "Joice", "Lúcia",
    "Fábio", "Rafael", "Henrique", "Leonardo", "Paulo", "Sérgio"];
  const CASA_S = ["Albuquerque", "Bastos", "Cardoso", "Damasceno", "Escobar", "Falcão", "Galvão", "Hortência", "Ibrahim", "Jardim", "Leme",
    "Macedo", "Nogueira", "Oliveira", "Paixão", "Queiroz", "Rezende", "Sampaio", "Teixeira", "Uchôa", "Vasconcelos", "Xavier", "Zanetti",
    "Antunes", "Brandão", "Coutinho", "Dourado", "Esteves", "Figueira", "Godoy", "Holanda", "Lacerda", "Medeiros", "Neves", "Pacheco"];
  const CASA_P = ["Toxina botulínica", "Bioestimulador", "Laser · rejuvenescimento", "Skinbooster", "Peeling químico", "Preenchimento labial",
    "Ultrassom microfocado", "Laser · manchas", "Tratamento de pele", "Consulta dermatológica", "Consulta de pele", "Liftera papada"];
  const CASA_O = ["Indicação", "Instagram", "Google", "Site", "Campanha", "Indicação"];
  const NOMES_JA = new Set(Object.values(P).map(x => x.nome));
  const CASA = [];
  CASA_N.forEach((pn, i) => {
    const nome = `${pn} ${CASA_S[(i * 11 + 5) % CASA_S.length]}`; if (NOMES_JA.has(nome)) return;
    const id = "casa" + String(i + 1).padStart(2, "0"), med = i % 2 ? "d" : "g";
    add(id, { nome, med, origem: CASA_O[i % CASA_O.length], proc: CASA_P[(i * 5 + 2) % CASA_P.length], casa: true });
    CASA.push([id, nome, med]);
  });

  /* ---------- Recall: retorno de manutenção --------------------------------
     ult: última sessão · meses: intervalo de manutenção do procedimento
     (toxina 4 meses, laser 3, peeling 6, bioestimulador 6, skinbooster 4, preenchimento 9)
     Os 5 primeiros já existem em dados.js (mesmas datas). */
  const RECALL = [
    { id: "cristina", meses: 4 },
    { id: "adriana",  meses: 6, obs: "Contatada em 06/11, sem resposta" },
    { id: "sandra",   meses: 3 },
    { id: "teresa",   meses: 4, agendado: true },
    { id: "mariana",  meses: 6, naClinica: true, ult: "13/05/2026" },
    { id: "laura",    meses: 4, ult: "18/06/2026" },
    { id: "vanessa",  meses: 4, ult: "28/06/2026", obs: "Prefere sábado de manhã" },
    { id: "rita",     meses: 6, ult: "05/05/2026" },
    { id: "beatriz",  meses: 4, ult: "09/07/2026" },
    { id: "clara",    meses: 3, ult: "16/08/2026" },
    { id: "lorena",   meses: 4, ult: "17/07/2026" },
    { id: "denise",   meses: 4, ult: "19/07/2026", obs: "Pediu lembrete por WhatsApp" },
    { id: "eduarda",  meses: 9, ult: "24/02/2026" },
    { id: "marcelo",  meses: 4, ult: "28/07/2026" },
    { id: "elisa",    meses: 6, ult: "26/05/2026" },
    { id: "nathalia", meses: 3, ult: "30/08/2026" },
    { id: "bruna",    meses: 4, ult: "06/07/2026", obs: "Duas mensagens sem resposta" },
  ];
  RECALL.forEach(r => { if (r.ult) P[r.id].ult = r.ult; P[r.id].carteira = P[r.id].carteira || ["Prata", "Ouro", "Bronze", "Prata", "Diamante"][r.id.length % 5]; });
  const dataDe = s => { const [d, m, a] = s.split("/").map(Number); return new Date(a || ANO, m - 1, d); };
  const HOJE_D = new Date(ANO, 10, 13);
  const diasEntre = (a, b) => Math.round((b - a) / 864e5);
  const fmt = d => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  function recall() {
    return RECALL.map(r => {
      const p = P[r.id], ult = dataDe(p.ult), venc = new Date(ult); venc.setMonth(venc.getMonth() + r.meses);
      const dias = diasEntre(HOJE_D, venc);                 // < 0 venceu há |dias|
      const grupo = dias < 0 ? "vencido" : dias <= 7 ? "semana" : dias <= 17 ? "mes" : "depois";
      return Object.assign({}, r, { p, venc: fmt(venc), dias, grupo, ultTxt: fmt(ult) + (ult.getFullYear() === ANO ? "" : "/" + String(ult.getFullYear()).slice(2)) });
    }).filter(r => r.grupo !== "depois").sort((a, b) => a.dias - b.dias);
  }

  /* ---------- Agenda da semana ------------------------------------------
     Semana 0 = 09 a 13/11 (hoje, sexta 13). Hoje vem de VA.AGENDA; os outros dias são
     gerados com semente fixa (sempre iguais) e encaixam os compromissos já citados no funil. */
  const DUR = { "1ª consulta": 60, "Retorno": 30, "Procedimento": 60, "Recall": 45 };
  const FIXOS = [  // [dd/mm, hh:mm, id, tipo, st]
    ["09/11", "09:00", "larissa", "1ª consulta", "feito"],
    ["10/11", "10:00", "bianca", "1ª consulta", "semreg"],
    ["10/11", "11:00", "claudia", "Retorno", "feito"],
    ["11/11", "13:00", "renata", "1ª consulta", "falta"],
    ["11/11", "15:00", "yasmin", "1ª consulta", "feito"],
    ["12/11", "16:00", "otavio", "1ª consulta", "feito"],
    ["16/11", "09:30", "vera", "1ª consulta", "conf"],
    ["16/11", "11:00", "otavio", "Retorno", "conf"],
    ["17/11", "10:00", "claudia", "Retorno", "aconf"],
    ["18/11", "16:00", "roberto", "1ª consulta", "aconf"],
    ["19/11", "10:30", "teresa", "Recall", "aconf"],
    // recall que voltou para a agenda em novembro (os 3 da Dra. Lúcia + Teresa = meta "Recall · agendamentos": 4)
    ["04/11", "10:00", "anabeatriz", "Recall", "feito"],
    ["06/11", "14:00", "carolina", "Recall", "feito"],
    ["10/11", "09:00", "isabela", "Recall", "feito"],
  ];
  FIXOS.forEach(f => { if (f[3] === "Recall" && f[4] === "feito") P[f[2]].ult = f[0] + "/" + ANO; });
  const ST = Object.assign({}, VA.ST_AGENDA, {
    falta: ["status--atrasado", "Faltou"], semreg: ["status--atencao", "Sem registro"],
  });
  // Quem está no recall só entra na agenda pelos FIXOS (senão teria horário e "recall vencido" ao mesmo tempo)
  const NO_RECALL = new Set(RECALL.map(r => r.id));
  const CASA_TODOS = EXTRAS.map(e => [e[0], e[2]]).filter(e => !NO_RECALL.has(e[0])).concat(CASA.map(c => [c[0], c[2]]));
  const POOL = { g: CASA_TODOS.filter(e => e[1] === "g").map(e => e[0]), d: CASA_TODOS.filter(e => e[1] === "d").map(e => e[0]) };
  const min = h => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const hh = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  // extras são pacientes da casa (1ª consulta só de leads do funil; recall só pelos FIXOS, o mesmo número das Metas)
  const TIPOS = ["Procedimento", "Retorno", "Procedimento", "Retorno", "Procedimento"];
  const cache = {}, usadosSem = {};
  // cada semana é gerada inteira, de segunda a sexta, para que um paciente apareça no máximo uma vez nela
  function dia(d) {   // d: Date
    const k = fmt(d); if (cache[k]) return cache[k];
    const seg = new Date(d); seg.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const ks = fmt(seg);
    if (!usadosSem[ks]) {
      usadosSem[ks] = new Set();
      const sex = new Date(seg); sex.setDate(seg.getDate() + 4);
      if (fmt(sex) === VA.HOJE) VA.AGENDA.forEach(a => { if (a.id) usadosSem[ks].add(a.id); });
      for (let i = 0; i < 5; i++) { const x = new Date(seg); x.setDate(seg.getDate() + i); FIXOS.filter(f => f[0] === fmt(x)).forEach(f => usadosSem[ks].add(f[2])); }
      for (let i = 0; i < 5; i++) { const x = new Date(seg); x.setDate(seg.getDate() + i); if (fmt(x) !== k) geraDia(x, usadosSem[ks]); }
    }
    return cache[k] || geraDia(d, usadosSem[ks]);
  }
  function geraDia(d, usadosS) {
    const k = fmt(d); if (cache[k]) return cache[k];
    let itens = [];
    const dow = d.getDay(), feriado = d.getMonth() === 10 && VA.FERIADOS.includes(d.getDate());
    if (dow === 0 || dow === 6 || feriado) return (cache[k] = { data: k, d, feriado, fds: !feriado, itens });
    if (k === VA.HOJE) {
      const ag = VA.AGENDA;
      ag.forEach((a, i) => {
        if (a.evento) { itens.push({ h: a.h, fim: hh(min(a.h) + 30), evento: true, nome: a.nome, det: a.det }); return; }
        const p = P[a.id], prox = ag.slice(i + 1).find(x => !x.evento && P[x.id].med === p.med);
        const dur = Math.min(DUR[a.tipo] || 60, prox ? min(prox.h) - min(a.h) : 99);
        itens.push({ h: a.h, fim: hh(min(a.h) + dur), id: a.id, med: p.med, tipo: a.tipo, st: a.st, det: a.det, nota: a.nota });
      });
      return (cache[k] = { data: k, d, hoje: true, itens });
    }
    const passado = d < HOJE_D, r = rng(d.getDate() * 97 + d.getMonth() * 13 + 7);
    const fixos = FIXOS.filter(f => f[0] === k);
    ["g", "d"].forEach(m => {
      const meus = fixos.filter(f => P[f[2]].med === m).map(f => ({ h: f[1], fim: hh(min(f[1]) + DUR[f[3]]), id: f[2], med: m, tipo: f[3], st: f[4] }));
      let t = 8 * 60 + (r() < .5 ? 0 : 30);
      while (t < 17 * 60 + 30) {
        if (t >= 12 * 60 && t < 13 * 60 + 30) { t = 13 * 60 + 30; continue; }        // almoço
        const tipo = TIPOS[Math.floor(r() * TIPOS.length)], dur = DUR[tipo];
        const choca = meus.some(x => t < min(x.fim) && t + dur > min(x.h));
        const livres = POOL[m].filter(x => !usadosS.has(x));
        if (!choca && livres.length && r() < .58) {
          const id = livres[Math.floor(r() * livres.length)];
          usadosS.add(id);
          const st = passado ? (r() < .035 ? "falta" : "feito") : (r() < .7 ? "conf" : "aconf");
          meus.push({ h: hh(t), fim: hh(t + dur), id, med: m, tipo, st });
          t += dur;
        } else t += 30;
      }
      itens = itens.concat(meus);
    });
    if (dow === 2) itens.push({ h: "12:30", fim: "13:00", evento: true, nome: "Reunião comercial", det: "Equipe · 30 min" });
    itens.sort((a, b) => min(a.h) - min(b.h));
    return (cache[k] = { data: k, d, itens });
  }
  function semana(n) {   // n = 0: 09 a 13/11
    const seg = new Date(ANO, 10, 9 + 7 * n);
    return [0, 1, 2, 3, 4, 5].map(i => { const d = new Date(seg); d.setDate(seg.getDate() + i); return dia(d); });
  }
  // Próxima consulta das pessoas extras (para o botão "Adicionar à agenda" e a confirmação por WhatsApp)
  const consultaOrig = VA.consulta;
  VA.consulta = id => {
    const c = consultaOrig(id); if (c || !P[id] || !P[id].extra) return c;
    for (let n = 0; n <= 1; n++) for (const dd of semana(n)) {
      if (dd.d < HOJE_D) continue;
      const it = dd.itens.find(x => x.id === id && (!dd.hoje || x.h > VA.AGORA));
      if (it) return { data: dd.data, hora: it.h, tipo: it.tipo };
    }
    return null;
  };

  /* ---------- Relatórios (ano de 2026, até 13/11) -------------------------
     Leads por origem: somam os 629 leads do Funil (em andamento + fechados + saíram)
     e os 93 fechamentos (R$ 581,3 mil). */
  const ORIGENS = [
    //            leads [g,d]   agendaram    fecharam    valor fechado [g,d]
    { k: "Indicação", n: [62, 71], ag: [44, 52], f: [14, 17], v: [92400, 108600] },
    { k: "Instagram", n: [74, 88], ag: [33, 41], f: [7, 10],  v: [43100, 58800] },
    { k: "Google",    n: [58, 66], ag: [31, 36], f: [8, 9],   v: [50300, 54600] },
    { k: "Parceria", n: [22, 25], ag: [15, 18], f: [5, 6],   v: [36800, 42500] },
    { k: "Site",      n: [27, 31], ag: [13, 15], f: [3, 4],   v: [19700, 26200] },
    { k: "Campanha",  n: [36, 43], ag: [14, 17], f: [3, 4],   v: [16900, 23400] },
    { k: "Outro",     n: [8, 18],  ag: [4, 8],   f: [1, 2],   v: [3200, 4800] },
  ];
  // Faturamento recebido por família de procedimento: novembro (soma R$ 96,4 mil) e 2026 (soma R$ 1.454 mil)
  const PROC = [
    { k: "Toxina botulínica",       nov: [9800, 12600],  ano: [168000, 180000] },
    { k: "Bioestimulador",          nov: [7400, 9800],   ano: [121000, 130000] },
    { k: "Ultrassom microfocado",   nov: [8900, 3600],   ano: [118000, 52000] },
    { k: "Laser",                   nov: [6200, 6900],   ano: [96000, 104000] },
    { k: "Preenchimento",           nov: [3900, 5300],   ano: [61000, 82000] },
    { k: "Skinbooster",             nov: [2600, 4200],   ano: [42000, 63000] },
    { k: "Peeling e tratamentos",   nov: [1800, 3500],   ano: [31000, 44000] },
    { k: "Consultas",               nov: [4600, 5300],   ano: [79000, 83000] },
  ];
  // Comparecimento na 1ª consulta por mês (Nov = COMP_NOV: 19 de 21)
  const COMP_MES = [
    { m: "Jan", foi: [11, 13], reg: [14, 16] }, { m: "Fev", foi: [12, 13], reg: [15, 16] }, { m: "Mar", foi: [15, 17], reg: [18, 20] },
    { m: "Abr", foi: [13, 16], reg: [16, 19] }, { m: "Mai", foi: [16, 18], reg: [19, 21] }, { m: "Jun", foi: [14, 17], reg: [17, 20] },
    { m: "Jul", foi: [17, 19], reg: [20, 22] }, { m: "Ago", foi: [19, 21], reg: [21, 24] }, { m: "Set", foi: [18, 22], reg: [21, 24] },
    { m: "Out", foi: [20, 23], reg: [22, 25] }, { m: "Nov", foi: [9, 10], reg: [10, 11], atual: true },
  ];

  /* ---------- Equipe e acessos (Ajustes) --------------------------------
     Login com Google: só entram os e-mails desta lista. perfil: medico | recepcao | consultora */
  const DOM = "clinica-aurora.com.br";
  const EQUIPE = [
    { nome: "Marina Albuquerque", email: "marina@" + DOM, perfil: "gestao", gestora: true, st: "ativo", visto: "hoje, 08:31" },
    { nome: "Dra. Lúcia Sena", email: "lucia@" + DOM, perfil: "medico", st: "ativo", visto: "hoje, 09:12" },
    { nome: "Dr. Rafael Sena", email: "rafael@" + DOM, perfil: "medico", st: "ativo", visto: "hoje, 08:05" },
    { nome: "Júlia Moraes", email: "julia@" + DOM, perfil: "sdr", st: "ativo", visto: "hoje, 09:02" },
    { nome: "Carla Nunes", email: "recepcao@" + DOM, perfil: "recepcao", st: "ativo", visto: "hoje, 07:48" },
    { nome: "Tatiana Brito", email: "tatiana@" + DOM, perfil: "closer", st: "ativo", visto: "ontem, 18:20" },
    { nome: "Consultoria comercial", email: "consultoria.munin@gmail.com", perfil: "gestao", st: "convite", visto: "convite enviado em 10/11" },
  ];
  // Cinco perfis, conforme o fluxo da clínica (a consultora entra como Gestão)
  const PERFIS = {
    gestao:   { rot: "Gestão",   desc: "Gerente ou dono: vê tudo, define metas e autoriza acessos",
      faz: ["Acompanha faturamento, metas e o funil inteiro", "Convida a equipe e define o que cada perfil vê", "Recebe os avisos de leads parados e de metas"] },
    medico:   { rot: "Médico",   desc: "Agenda própria, pacientes, planos e metas",
      faz: ["Vê a agenda do dia e a ficha de cada paciente", "Registra comparecimento e o plano apresentado", "Acompanha as próprias metas e os planos fechados"] },
    sdr:      { rot: "SDR",      desc: "Qualifica e agenda os leads novos",
      faz: ["Recebe os leads novos e faz o 1º contato pelo WhatsApp", "Qualifica o interesse e marca a 1ª consulta", "Vê os leads parados no início do funil"] },
    recepcao: { rot: "Recepção", desc: "Confirma consultas e recebe os pacientes",
      faz: ["Confirma as consultas na véspera pelo WhatsApp", "Registra a chegada e as faltas, e remarca", "Mantém a agenda da semana em dia"] },
    closer:   { rot: "Closer",   desc: "Apresenta e fecha planos; faz recall e recompras",
      faz: ["Retoma os planos apresentados que não fecharam", "Fecha planos e registra o valor", "Cuida do recall e das recompras dos pacientes da casa"] },
  };
  // O que cada perfil vê (matriz de Ajustes): faturamento e valores da clínica, valores de plano, metas, funil completo
  const VISAO = {
    gestao:   { fat: true,  plano: true,  metas: true,  funil: true },
    medico:   { fat: true,  plano: true,  metas: true,  funil: true },
    closer:   { fat: false, plano: true,  metas: true,  funil: true },
    sdr:      { fat: false, plano: false, metas: false, funil: false },
    recepcao: { fat: false, plano: false, metas: false, funil: false },
  };
  // Contas Google simuladas da tela de entrada: uma por perfil (nome = pessoa da abertura "Bom dia")
  const CONTAS = [
    { nome: "Marina", completo: "Marina Albuquerque", email: "marina@" + DOM, perfil: "gestao", ini: "MA", cor: "r" },
    { nome: "Dra. Lúcia", completo: "Dra. Lúcia Sena", email: "lucia@" + DOM, perfil: "medico", ini: "LS", cor: "d" },
    { nome: "Júlia", completo: "Júlia Moraes", email: "julia@" + DOM, perfil: "sdr", ini: "JM", cor: "r" },
    { nome: "Carla", completo: "Carla Nunes", email: "recepcao@" + DOM, perfil: "recepcao", ini: "CN", cor: "r" },
    { nome: "Tatiana", completo: "Tatiana Brito", email: "tatiana@" + DOM, perfil: "closer", ini: "TB", cor: "r" },
  ];
  const CLINICA_DADOS = {
    nome: "Clínica Aurora", razao: "Clínica Aurora Dermatologia Ltda.", cnpj: "12.345.678/0001-90",
    end: "Rua das Acácias, 410 · sala 32 · Jardim Paulista · São Paulo/SP", fone: "(11) 3045-2210", whats: "(11) 98820-4410",
    horario: "Segunda a sexta, 08:00 às 18:00 · sábado, 08:00 às 12:00", fuso: "America/Sao_Paulo (UTC−3)",
  };

  /* ---------- Avisos do sino ------------------------------------------ */
  // "parado" = dias de atraso sobre o prazo da etapa (p.venc), o mesmo selo de Atenção hoje e do Closer
  const par = VA.parados("todos"), pior = par.slice().sort((a, b) => (b.venc || 0) - (a.venc || 0))[0];
  const etapaDe = k => ((VA.ETAPAS || []).find(e => e.k === k) || {}).nome || "";
  const AVISOS = [
    { tipo: "atrasado", ico: "i-relogio", tit: `${pior.nome} · ${pior.venc} ${pior.venc === 1 ? "dia" : "dias"} de atraso`, txt: `${etapaDe(pior.etapa)} · ${(pior.prox || "").replace(/^Retorno (\d)/, "retorno venceu $1").replace(/^Retorno venceu/, "retorno venceu")} · ${par.length} leads acima do prazo`.replace(/ ·  · /, " · "), href: "funil.html#parados", quando: "há 12 min" },
    { tipo: "atencao", ico: "i-recall", tit: "Recall vencido: Cristina Valadares", txt: "Toxina a cada 4 meses · venceu há 12 dias", href: "recall.html?ficha=cristina", quando: "hoje, 08:00" },
    { tipo: "neutro", ico: "i-metas", tit: "Faturamento em 54% da meta", txt: "Esperado hoje: 42% · faltam 11 dias úteis", href: "metas.html", quando: "ontem, 18:00" },
  ];

  /* ---------- Novos leads desta sessão (botão "+ Novo lead") -------------
     Ficam no sessionStorage e entram no Funil como "Lead em contato". */
  const ss = { get() { try { return JSON.parse(sessionStorage.getItem("munin:novos") || "[]"); } catch (e) { return []; } },
    set(v) { try { sessionStorage.setItem("munin:novos", JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } } };
  function poeLead(o) {
    const p = add(o.id, { nome: o.nome, med: o.med, origem: o.origem, proc: o.proc, t: 3, pot: o.pot || 1500, lead: "13/11/2026", etapa: "contato", d: 0, sev: "ok",
      nota: "Novo · cadastrado hoje", prox: "1º contato hoje", novo: true, fone: o.fone });
    delete p.extra;
    const a = VA.ATIVOS && VA.ATIVOS.contato; if (a) { a[o.med].n++; a[o.med].v += p.pot; }
    return p;
  }
  ss.get().forEach(poeLead);
  const foneOrig = VA.fone;
  VA.fone = id => (P[id] && P[id].fone) || foneOrig(id);
  function novoLead(o) {
    const lst = ss.get(); o.id = "novo" + Date.now().toString(36); lst.push(o); ss.set(lst);
    return poeLead(o);
  }

  window.VA2 = { EXTRAS, RECALL, recall, semana, dia, ST, DUR, min, hh, ORIGENS, PROC, COMP_MES, EQUIPE, PERFIS, VISAO, CONTAS, CLINICA_DADOS, AVISOS, novoLead, fmt, dataDe, HOJE_D };
})();
