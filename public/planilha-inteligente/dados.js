/* =====================================================================
   FONTE ÚNICA DE DADOS do protótipo (dados FICTÍCIOS).
   Derivado de crm/v2/qa/seed.js · hoje = sexta 13/11/2026, 09:40.
   As 3 telas (painel, funil, metas) leem SÓ deste objeto: nenhum número
   é digitado à mão nas páginas. Cada paciente tem UM procedimento e UM
   estágio, e aparece igual em todas as telas.
   Nomes-marcadores do seed ("Lead Atrasado Um" etc.) viraram nomes fictícios.
   ===================================================================== */
(function () {
  const HOJE = "13/11", AGORA = "09:40";
  const DU = 19, FEITOS = 8, FRAC = FEITOS / DU;   // dias úteis de novembro (feriados 02 e 20)

  /* ---------- Pacientes (registro único) --------------------------------
     med: g = Dr. Rafael, d = Dra. Lúcia · t: temperatura 1–5
     etapa: contato | agendado | confirmado | compareceu | plano | fechou | null (paciente da casa)
     pot: ticket estimado (etapas antes do plano) · v: valor do plano / fechado
     lead: data de criação do lead (dd/mm/aaaa) · dh: [data, hora] da 1ª consulta */
  const P = {};
  const add = (id, o) => (P[id] = Object.assign({ id }, o));

  // Pacientes da casa (já fecharam antes; vêm hoje para sessão/retorno)
  add("heloisa",  { nome: "Heloísa Cardoso",  med: "g", origem: "Indicação", proc: "Liftera papada" });
  add("ingrid",   { nome: "Ingrid Matos",     med: "g", origem: "Campanha",  proc: "Laser · 3 sessões" });
  add("mariana",  { nome: "Mariana Siqueira", med: "d", origem: "Site",      proc: "Bioestimulador · 2 sessões", carteira: "Diamante" });
  add("debora",   { nome: "Débora Brandão",   med: "g", origem: "Instagram", proc: "Toxina botulínica" });
  add("aline",    { nome: "Aline Freitas",    med: "g", origem: "Indicação", proc: "Mapeamento de pintas" });
  add("joana",    { nome: "Joana Bastos",     med: "d", origem: "Indicação", proc: "Skinbooster · 3 sessões" });
  add("kelly",    { nome: "Kelly Araújo",     med: "d", origem: "Google",    proc: "Acne adulta" });
  add("luana",    { nome: "Luana Queiroz",    med: "d", origem: "Instagram", proc: "Peeling químico" });
  // Recall
  add("cristina", { nome: "Cristina Valadares", med: "d", origem: "Indicação", proc: "Toxina botulínica", carteira: "Bronze", ult: "01/07/2026" });
  add("sandra",   { nome: "Sandra Mello",       med: "g", origem: "Site",      proc: "Laser · rejuvenescimento", carteira: "Bronze", ult: "13/08/2026" });
  add("adriana",  { nome: "Adriana Coelho",     med: "d", origem: "Instagram", proc: "Peeling químico", carteira: "Prata", ult: "12/05/2026" });
  // Recall já agendado (volta para a manutenção; confirmar na véspera)
  add("teresa",   { nome: "Teresa Vilela",      med: "g", origem: "Indicação", proc: "Toxina botulínica", carteira: "Ouro", ult: "14/07/2026", ag: ["19/11", "10:30"] });
  // Fechou parcial em julho, 2ª etapa pendente
  add("patricia", { nome: "Patrícia Leme", med: "d", origem: "Indicação", proc: "Protocolo Natural Lift · 2 etapas", pend: 8114 });

  // ---- Funil: 1 · Lead em contato
  add("livia",    { nome: "Lívia Carvalho",   med: "g", origem: "Parceria", proc: "Protocolo Natural Lift", t: 3, pot: 6500, lead: "01/11/2026", etapa: "contato", d: 12, sev: "atrasado", venc: 4, tent: 1, nota: "Pediu valor no WhatsApp · 1 tentativa", prox: "Retorno venceu 09/11" });
  add("priscila", { nome: "Priscila Andrade", med: "d", origem: "Indicação", proc: "Liftera papada",         t: 4, pot: 4200, lead: "02/11/2026", etapa: "contato", d: 11, sev: "atrasado", venc: 2, tent: 3, nota: "Indecisão · 3 tentativas sem resposta", prox: "Retorno venceu 11/11" });
  add("sofia",    { nome: "Sofia Brandt",     med: "d", origem: "Outro",     proc: "Acne adulta",            t: 4, pot: 1800, lead: "09/11/2026", etapa: "contato", d: 4,  sev: "atencao",  nota: "Ligar hoje · prefere manhã", prox: "Ligar hoje" });
  add("lucas",    { nome: "Lucas Ferraz",     med: "g", origem: "Campanha",  proc: "Mapeamento de pintas",   t: 3, pot: 900,  lead: "12/11/2026", etapa: "contato", d: 1,  sev: "neutro",   nota: "Sem próximo contato definido", prox: "Sem data" });
  add("cecilia",  { nome: "Cecília Furtado",  med: "g", origem: "Indicação", proc: "Clareamento de melasma", t: 3, pot: 2600, lead: "12/11/2026", etapa: "contato", d: 1,  sev: "ok",       nota: "Aguardando data · volta a falar 25/11", prox: "Retorno 25/11" });
  // ---- 2 · Agendado
  add("raquel",   { nome: "Raquel Monteiro",  med: "d", origem: "Instagram", proc: "Protocolo Natural Lift", t: 2, pot: 6500, lead: "06/11/2026", etapa: "agendado", d: 7, sev: "atrasado", dh: ["13/11", "11:30"], nota: "Confirmação sem resposta" });
  add("thais",    { nome: "Thaís Cunha",      med: "g", origem: "Google",    proc: "Protocolo Natural Lift", t: 3, pot: 6500, lead: "07/11/2026", etapa: "agendado", d: 6, sev: "atencao",  dh: ["13/11", "15:30"], nota: "Consulta hoje · confirmar agora" });
  add("renata",   { nome: "Renata Okamoto",   med: "d", origem: "Outro",     proc: "Liftera papada",         t: 2, pot: 4200, lead: "28/10/2026", etapa: "agendado", d: 2, sev: "atrasado", dh: ["11/11", "13:00"], falta: true, venc: 2, nota: "Faltou · remarcar" });
  add("vera",     { nome: "Vera Lúcia Santos", med: "g", origem: "Indicação", proc: "Botox testa e glabela", t: 4, pot: 2400, lead: "10/11/2026", etapa: "agendado", d: 3, sev: "ok",       dh: ["16/11", "09:30"], nota: "Taxa de consulta paga" });
  add("roberto",  { nome: "Roberto Alves",    med: "d", origem: "Google",    proc: "Mapeamento de pintas",   t: 3, pot: 900,  lead: "11/11/2026", etapa: "agendado", d: 2, sev: "neutro",   dh: ["18/11", "16:00"], nota: "Confirmar em 17/11" });
  // ---- 3 · Confirmado
  add("bianca",   { nome: "Bianca Lourenço",  med: "g", origem: "Google",    proc: "Protocolo Natural Lift", t: 3, pot: 6500, lead: "02/11/2026", etapa: "confirmado", d: 3, sev: "atrasado", dh: ["10/11", "10:00"], semReg: true, venc: 3, nota: "Consulta passou sem registro de comparecimento" });
  add("paula",    { nome: "Paula Rezende",    med: "d", origem: "Google",    proc: "Biópsia · retirada de sinal", t: 4, pot: 1200, lead: "04/11/2026", etapa: "confirmado", d: 1, sev: "ok", dh: ["13/11", "10:00"], nota: "Hoje, próxima da agenda" });
  add("simone",   { nome: "Simone Castro",    med: "g", origem: "Parceria", proc: "Ultrassom microfocado",  t: 4, pot: 7800, lead: "05/11/2026", etapa: "confirmado", d: 1, sev: "ok",       dh: ["13/11", "14:00"], nota: "Hoje à tarde" });
  // ---- 4 · Compareceu
  add("otavio",   { nome: "Otávio Lins",      med: "g", origem: "Google",    proc: "Ultrassom microfocado",  t: 4, pot: 5200, lead: "06/11/2026", etapa: "compareceu", d: 1, sev: "ok", dh: ["12/11", "16:00"], nota: "Consultou 12/11 · plano sai em 16/11", prox: "Plano 16/11" });
  add("yasmin",   { nome: "Yasmin Coutinho",  med: "d", origem: "Outro",     proc: "Rosácea · tratamento",   t: 3, pot: 1500, lead: "05/11/2026", etapa: "compareceu", d: 2, sev: "atencao", dh: ["11/11", "15:00"], venc: 2, nota: "Consultou e ainda sem plano registrado" });
  // ---- 5 · Plano apresentado
  add("camila",   { nome: "Camila Peixoto",   med: "d", origem: "Indicação", proc: "Botox + skinbooster",    t: 4, v: 10084, lead: "12/06/2026", etapa: "plano", d: 144, sev: "atrasado", venc: 8, nota: "Em negociação · retorno venceu 05/11", prox: "Retorno 05/11" });
  add("flavia",   { nome: "Flávia Assis",     med: "d", origem: "Campanha",  proc: "Laser · 3 sessões",      t: 4, v: 7986,  lead: "13/08/2026", etapa: "plano", d: 83,  sev: "atencao",  nota: "Vai pensar · retorno marcado 20/11", prox: "Retorno 20/11" });
  add("elaine",   { nome: "Elaine Moura",     med: "g", origem: "Site",      proc: "Protocolo Natural Lift", t: 3, v: 5931,  lead: "09/08/2026", etapa: "plano", d: 89,  sev: "atencao",  nota: "Prefere fazer aos poucos · retorno 20/11", prox: "Retorno 20/11" });
  add("helena",   { nome: "Helena Duarte",    med: "d", origem: "Campanha",  proc: "Toxina + bioestimulador", t: 3, v: 5200, lead: "08/10/2026", etapa: "plano", d: 30,  sev: "atrasado", venc: 3, nota: "Preço · retorno venceu 10/11", prox: "Retorno 10/11" });
  add("claudia",  { nome: "Cláudia Bernardes", med: "d", origem: "Parceria", proc: "Toxina + preenchimento labial", t: 5, v: 5200, lead: "04/11/2026", etapa: "plano", d: 3, sev: "ok", dh: ["10/11", "11:00"], nota: "Apresentado 10/11 · gostou, vê agenda", prox: "Retorno 17/11" });
  // ---- 6 · Fechou (os 5 fechamentos mais recentes de novembro; o total do mês está em FECH_NOV)
  add("juliana",  { nome: "Juliana Prado",    med: "d", origem: "Outro",     proc: "Laser 3 sessões + skinbooster", v: 4800, total: 4800, dt: "12/11", d: 1,  etapa: "fechou", nota: "Fechou total" });
  add("gabriela", { nome: "Gabriela Rocha",   med: "g", origem: "Indicação", proc: "Bioestimulador · 2 etapas",     v: 2050, total: 4100, dt: "10/11", d: 3,  etapa: "fechou", nota: "Parcial · 2ª etapa combinada para hoje" });
  add("larissa",  { nome: "Larissa Antunes",  med: "g", origem: "Indicação", proc: "Liftera full face",             v: 8500, total: 8500, dt: "09/11", d: 4,  etapa: "fechou", lead: "03/11/2026", dh: ["09/11", "09:00"], nota: "Fechou total na 1ª consulta" });
  add("fernanda", { nome: "Fernanda Costa",   med: "d", origem: "Parceria", proc: "Toxina full face",              v: 4400, total: 4400, dt: "06/11", d: 7,  etapa: "fechou", nota: "Fechou total" });
  add("natalia",  { nome: "Natália Barros",   med: "g", origem: "Instagram", proc: "Liftera papada + toxina",       v: 4550, total: 4550, dt: "04/11", d: 9,  etapa: "fechou", nota: "Fechou total" });

  /* ---------- Volumes agregados (o registro acima traz só os pacientes que
     aparecem por nome nas telas; os totais vêm daqui) ----------------------
     Novembro, clínica de dermatologia de alto padrão, metade do mês. */
  // Safra de novembro (leads criados de 01 a 13/11): [leads, agendaram, compareceram, receberam plano, fecharam]
  const SAFRA_NOV = {
    g: { n: [17, 13, 9, 6, 3], fv: 19400, futuras: 3 },   // futuras: Thaís, Simone (hoje), Vera (16/11)
    d: { n: [21, 13, 10, 6, 4], fv: 25300, futuras: 3 },  // futuras: Paula, Raquel (hoje), Roberto (18/11)
  };
  // Comparecimento na 1ª consulta de leads (consultas de 01/11 até agora)
  const COMP_NOV = { g: { foi: 9, sem: 1, faltas: 1 }, d: { foi: 10, sem: 0, faltas: 1 } };
  // Planos fechados em novembro (todas as origens: safra + leads de meses anteriores)
  const FECH_NOV = { g: { n: 5, v: 33200 }, d: { n: 6, v: 38900 } };
  // Leads em andamento no funil, por etapa: n e soma dos tickets estimados / valor dos planos
  const ATIVOS = {
    contato:    { g: { n: 5, v: 27000 }, d: { n: 6, v: 24600 } },
    agendado:   { g: { n: 3, v: 15800 }, d: { n: 3, v: 11600 } },
    confirmado: { g: { n: 2, v: 14300 }, d: { n: 2, v: 3800 } },
    compareceu: { g: { n: 1, v: 5200 },  d: { n: 2, v: 3700 } },
    plano:      { g: { n: 6, v: 41800 }, d: { n: 8, v: 58600 } },
  };

  /* ---------- Funil do ano (leads criados de 01/01 a 13/11) ------------- */
  const ETAPAS = [
    { k: "contato",    nome: "Lead em contato",   curto: "Contato",    prazo: "prazo 3 dias" },
    { k: "agendado",   nome: "Agendado",          curto: "Agendado",   prazo: "confirmar na véspera" },
    { k: "confirmado", nome: "Confirmado",        curto: "Confirmado", prazo: "registrar no dia" },
    { k: "compareceu", nome: "Compareceu",        curto: "Compareceu", prazo: "plano em 1 dia" },
    { k: "plano",      nome: "Plano apresentado", curto: "Plano",      prazo: "retorno em 15 dias" },
    { k: "fechou",     nome: "Fechou",            curto: "Fechou",     prazo: "" },
  ];
  // Fechamentos do ano inteiro (inclui os 5 de novembro, que estão no registro acima)
  const FECHOU_ANO = { g: { n: 41, v: 262400 }, d: { n: 52, v: 318900 } };
  // Saíram do funil em 2026
  const FORA = {
    perdido: { rot: "perdidos",                  g: 52, d: 61 },
    recusou: { rot: "recusaram o plano",         g: 38, d: 45 },
    faltou:  { rot: "faltaram e não remarcaram", g: 21, d: 26 },
    esfriou: { rot: "esfriaram sem agendar",     g: 118, d: 137 },
  };

  /* ---------- Agenda de hoje (referencia o registro) --------------------- */
  const AGENDA = [
    { id: "heloisa", h: "08:00", tipo: "Procedimento", st: "feito" },
    { id: "ingrid",  h: "08:30", tipo: "Procedimento", det: "sessão 2 de 3", st: "feito" },
    { id: "mariana", h: "09:00", tipo: "Retorno",      det: "sessão 2 de 2", st: "atend", nota: "chegou 09:12" },
    { id: "debora",  h: "09:30", tipo: "Procedimento", st: "recep", nota: "chegou 09:24" },
    { id: "paula",   h: "10:00", tipo: "1ª consulta",  st: "conf" },
    { id: "aline",   h: "10:30", tipo: "Retorno",      st: "conf" },
    { id: "raquel",  h: "11:30", tipo: "1ª consulta",  st: "semresp" },
    { evento: true,  h: "12:30", nome: "Reunião comercial", det: "Equipe · 30 min" },
    { id: "joana",   h: "13:30", tipo: "Procedimento", det: "sessão 1 de 3", st: "conf" },
    { id: "simone",  h: "14:00", tipo: "1ª consulta",  st: "conf" },
    { id: "kelly",   h: "15:00", tipo: "Retorno",      st: "aconf" },
    { id: "thais",   h: "15:30", tipo: "1ª consulta",  st: "aconf" },
    { id: "luana",   h: "16:30", tipo: "Procedimento", st: "conf" },
  ];
  const ST_AGENDA = {
    feito:   ["status--neutro",   "Atendida"],
    atend:   ["status--ok",       "Em atendimento"],
    recep:   ["status--ok",       "Na recepção"],
    conf:    ["status--ok",       "Confirmada"],
    aconf:   ["status--atencao",  "A confirmar"],
    semresp: ["status--atrasado", "Sem resposta"],
  };
  // Dias de novembro com consultas marcadas (mini calendário)
  const DIAS_COM_CONSULTA = [3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 23, 24, 25, 26, 27, 30];
  const FERIADOS = [2, 20];

  /* ---------- Atenção hoje (painel) --------------------------------------
     tipo: recall | fu | plano | agenda · prazo: texto só de TEMPO · acao: ícone do botão */
  const ATENCAO = [
    { id: "cristina", tipo: "recall", txt: "Toxina botulínica · última aplicação 01/07", sev: "atrasado", dias: 12, acao: "tel", wa: "recall" },
    { id: "camila",   tipo: "plano",  txt: "Plano R$ 10.084 em negociação · retorno venceu 05/11", sev: "atrasado", dias: 8, acao: "msg", wa: "plano" },
    { id: "patricia", tipo: "plano",  txt: "Fechou parcial · 2ª etapa de R$ 8.114 sem data", sev: "atrasado", dias: 8, acao: "msg", wa: "plano" },
    { id: "livia",    tipo: "fu",     txt: "Pediu valor no WhatsApp · 1 tentativa", sev: "atrasado", dias: 4, acao: "msg", wa: "followup" },
    { id: "helena",   tipo: "plano",  txt: "Plano R$ 5.200 · objeção de preço", sev: "atrasado", dias: 3, acao: "msg", wa: "plano" },
    { id: "bianca",   tipo: "agenda", txt: "Consulta 10/11 às 10:00 sem registro de comparecimento", sev: "atrasado", dias: 3, acao: "check", acaoRot: "Registrar comparecimento" },
    { id: "priscila", tipo: "fu",     txt: "Indecisão · 3 tentativas sem resposta", sev: "atrasado", dias: 2, acao: "tel", wa: "followup" },
    { id: "renata",   tipo: "agenda", txt: "Faltou à consulta de 11/11 às 13:00 · remarcar", sev: "atrasado", dias: 2, acao: "tel", acaoRot: "Ligar para remarcar", wa: "falta" },
    { id: "yasmin",   tipo: "plano",  txt: "Consultou em 11/11 · plano ainda não registrado", sev: "atencao", dias: 2, acao: "check", acaoRot: "Registrar plano" },
    { id: "raquel",   tipo: "agenda", txt: "1ª consulta hoje · confirmação sem resposta", sev: "atencao", prazo: "Hoje 11:30", acao: "tel", wa: "confirmacao" },
    { id: "mariana",  tipo: "recall", txt: "Recall do bioestimulador · está na clínica agora", sev: "atencao", prazo: "Hoje 09:00", acao: "check", acaoRot: "Registrar recall" },
    { id: "sandra",   tipo: "recall", txt: "Laser · última sessão 13/08", sev: "atencao", prazo: "Hoje", acao: "tel", wa: "recall" },
    { id: "adriana",  tipo: "recall", txt: "Repescagem · contatada em 06/11, sem resposta", sev: "atencao", prazo: "Hoje", acao: "msg", wa: "recall" },
    { id: "sofia",    tipo: "fu",     txt: "Lead de 09/11 · prefere contato de manhã", sev: "atencao", prazo: "Hoje", acao: "tel", wa: "followup" },
    { id: "gabriela", tipo: "plano",  txt: "Fechou parcial em 10/11 · combinar a 2ª etapa (R$ 2.050)", sev: "atencao", prazo: "Hoje", acao: "msg", wa: "plano" },
    { id: "kelly",    tipo: "agenda", txt: "Retorno hoje · ainda não confirmou", sev: "atencao", prazo: "Hoje 15:00", acao: "msg", wa: "confirmacao" },
    { id: "thais",    tipo: "agenda", txt: "1ª consulta hoje · ainda não confirmou", sev: "atencao", prazo: "Hoje 15:30", acao: "msg", wa: "confirmacao" },
    { id: "teresa",   tipo: "recall", txt: "Recall agendado para 19/11 às 10:30 · confirmar na véspera", sev: "neutro", prazo: "19/11 10:30", wa: "confirmacao", agenda: true },
    { id: "lucas",    tipo: "fu",     txt: "Lead de ontem · sem próximo contato", sev: "neutro", prazo: "Sem data", acao: "msg", wa: "followup" },
  ];
  /* wa: modelo de mensagem do botão de WhatsApp (sem wa = não cabe mensagem, ex.: paciente na clínica)
     agenda: mostra "Adicionar à agenda" (recall já agendado) */
  const TIPO_ROT = { recall: "Recall", fu: "Follow-up", plano: "Plano", agenda: "Agenda" };

  /* ---------- Metas de novembro (seed: metas[0]) ------------------------- */
  const FAT_DIAS = { "03/11": 11800, "04/11": 10400, "05/11": 13600, "06/11": 9200, "09/11": 12900, "10/11": 13100, "11/11": 9800, "12/11": 15600 };
  const fatTotal = Object.values(FAT_DIAS).reduce((a, b) => a + b, 0);       // 96.400
  const FAT_MED = { g: 45200, d: fatTotal - 45200 };                          // divisão por médico

  const fechNov = med => Object.values(P).filter(p => p.etapa === "fechou" && /\/11$/.test(p.dt) && (!med || p.med === med));
  const somaMed = (o, k, m) => (m === "g" || m === "d") ? o[m][k] : o.g[k] + o.d[k];
  const somaV = l => l.reduce((a, p) => a + p.v, 0);
  // [realizado, meta, supermeta] para t (clínica) / g / d
  const tri = (fn, metas) => ({ t: [fn(), ...metas.t], g: [fn("g"), ...metas.g], d: [fn("d"), ...metas.d] });

  const METAS = [
    Object.assign({ id: "fat",   grupo: "com", ico: "i-moeda",   nome: "Faturamento",       sub: "Recebido no mês", rs: true },
      tri(m => m ? FAT_MED[m] : fatTotal, { t: [180000, 200000], g: [90000, 100000], d: [90000, 100000] })),
    Object.assign({ id: "fechv", grupo: "com", ico: "i-assina",  nome: "Valor em planos fechados", sub: "Fechou total ou parcial", rs: true },
      tri(m => somaMed(FECH_NOV, "v", m), { t: [150000, 165000], g: [75000, 82500], d: [75000, 82500] })),
    Object.assign({ id: "pl",    grupo: "com", ico: "i-plano",   nome: "Planos fechados",   sub: "Todas as origens", u: "planos" },
      tri(m => somaMed(FECH_NOV, "n", m), { t: [26, 29], g: [12, 14], d: [14, 15] })),
    { id: "co", grupo: "ag",  ico: "i-agenda",  nome: "Consultas",          sub: "1ª consulta e retorno", u: "consultas", t: [47, 100, 110], g: [22, 48, 53], d: [25, 52, 57] },
    { id: "at", grupo: "ag",  ico: "i-leads",   nome: "Atendimentos",       sub: "Consultas e procedimentos", u: "atend.", t: [168, 320, 350], g: [79, 150, 165], d: [89, 170, 185] },
    { id: "oc", grupo: "ag",  ico: "i-relogio", nome: "Ocupação da agenda", sub: "Agenda vazia até 10%", taxa: true, t: [88.8, 90, 95], g: [83.8, 90, 95], d: [93.3, 90, 95] },
    { id: "rc", grupo: "rec", ico: "i-tel",     nome: "Recall · contatos",       sub: "Pacientes contatados", u: "contatos", t: [13, 30, 33], g: [6, 15, 17], d: [7, 15, 16] },
    { id: "ra", grupo: "rec", ico: "i-recall",  nome: "Recall · agendamentos",   sub: "Voltaram para a agenda", u: "agend.", t: [4, 10, 11], g: [1, 5, 6], d: [3, 5, 5] },
    { id: "rf", grupo: "rec", ico: "i-coracao", nome: "Recall · fidelizados",    sub: "Voltaram e fecharam", u: "pac.", t: [1, 5, 6], g: [0, 2, 3], d: [1, 3, 3] },
  ];
  const ANO = [
    { m: "Jan", v: 98000 }, { m: "Fev", v: 104000 }, { m: "Mar", v: 121000 }, { m: "Abr", v: 117000 }, { m: "Mai", v: 132000 }, { m: "Jun", v: 128000 },
    { m: "Jul", v: 141000, meta: 150000 }, { m: "Ago", v: 168200, meta: 160000 }, { m: "Set", v: 171900, meta: 165000 }, { m: "Out", v: 176500, meta: 170000 },
    { m: "Nov", v: fatTotal, meta: 180000, atual: true }, { m: "Dez", v: 0, meta: 185000, futuro: true },
  ];

  /* ---------- Regras compartilhadas ------------------------------------- */
  const medKey = m => (m === "todos" || !m) ? "t" : m;
  const metaVal = (id, m) => METAS.find(x => x.id === id)[medKey(m)];
  // Projeção do mês: contagens arredondadas (não existe "9,5 agendamentos"), dinheiro não
  function situacao(meta, [v, alvo, sup]) {
    const bruta = meta.taxa ? v : v / FRAC;
    const proj = meta.rs || meta.taxa ? bruta : Math.round(bruta);
    if (proj > sup) return { cls: "status--ok", rot: "Acima da faixa", proj };
    if (proj >= alvo) return { cls: "status--ok", rot: "Dentro da faixa", proj };
    if (proj / alvo >= .9) return { cls: "status--atencao", rot: "Pouco abaixo", proj };
    return { cls: "status--atrasado", rot: "Abaixo da faixa", proj };
  }
  // Ritmo de hoje: realizado contra o esperado até hoje (meta × 8/19)
  function ritmo(v, alvo) {
    const esp = alvo * FRAC, r = v / esp;
    if (r >= 1) return { cls: "status--ok", rot: "no ritmo", esp };
    if (r >= .9) return { cls: "status--atencao", rot: "pouco abaixo do ritmo", esp };
    return { cls: "status--atrasado", rot: "abaixo do ritmo", esp };
  }

  const lista = Object.values(P);
  const deMed = m => p => m === "todos" || !m || p.med === m;

  /* Funil de novembro (safra: leads criados de 01 a 13/11) — volumes agregados */
  function safraNov(m) {
    const ks = (m === "g" || m === "d") ? [m] : ["g", "d"];
    return {
      n: [0, 1, 2, 3, 4].map(i => ks.reduce((a, k) => a + SAFRA_NOV[k].n[i], 0)),
      fv: ks.reduce((a, k) => a + SAFRA_NOV[k].fv, 0),
      futuras: ks.reduce((a, k) => a + SAFRA_NOV[k].futuras, 0),
    };
  }
  /* Comparecimento na 1ª consulta (leads com consulta de 01/11 até agora) */
  function comparecimento(m) {
    const ks = (m === "g" || m === "d") ? [m] : ["g", "d"], s = k => ks.reduce((a, x) => a + COMP_NOV[x][k], 0);
    const foi = s("foi"), sem = s("sem"), faltas = s("faltas"), reg = foi + faltas;
    return { foi, reg, sem, faltas, pct: reg ? Math.round(foi / reg * 100) : 0 };
  }
  /* Leads em andamento numa etapa (agregado) */
  const ativosEtapa = (k, m) => ({ n: somaMed(ATIVOS[k], "n", m), v: somaMed(ATIVOS[k], "v", m) });
  const fechMes = m => ({ n: somaMed(FECH_NOV, "n", m), v: somaMed(FECH_NOV, "v", m) });

  /* ---------- Contato (WhatsApp e agenda) -------------------------------
     Telefones FICTÍCIOS, gerados a partir do id (DDD 11/19/21 + celular de 9 dígitos). */
  function fone(id) {
    let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 99991;
    const ddd = ["11", "11", "11", "19", "21"][h % 5], n = String(10000000 + (h * 7919) % 89999999).padStart(8, "0");
    return ddd + "9" + n;                                    // ex.: 11 9 8765 4321
  }
  const dmNum = dm => { const [d, m] = dm.split("/").map(Number); return m * 100 + d; };
  // Próxima consulta da pessoa (hoje ainda por vir, futura no funil ou recall agendado); null se não houver
  function consulta(id) {
    const a = AGENDA.find(x => x.id === id && x.h > AGORA && x.st !== "feito");
    if (a) return { data: HOJE, hora: a.h, tipo: a.tipo };
    const p = P[id];
    if (p.ag) return { data: p.ag[0], hora: p.ag[1], tipo: "Recall" };
    if (p.dh && (p.etapa === "agendado" || p.etapa === "confirmado") && !p.falta && !p.semReg && dmNum(p.dh[0]) >= dmNum(HOJE)) return { data: p.dh[0], hora: p.dh[1], tipo: "1ª consulta" };
    return null;
  }
  /* Leads parados acima do prazo (status vermelho), do mais parado ao menos parado */
  const valorLead = p => p.v || p.pot || 0;
  const parados = m => lista.filter(p => p.etapa && p.etapa !== "fechou" && p.sev === "atrasado" && deMed(m)(p)).sort((a, b) => b.d - a.d);
  const noLimite = m => lista.filter(p => p.etapa && p.etapa !== "fechou" && p.sev === "atencao" && deMed(m)(p));

  window.VA = {
    HOJE, AGORA, DU, FEITOS, FRAC, P, ETAPAS, FECHOU_ANO, FORA, AGENDA, ST_AGENDA, DIAS_COM_CONSULTA, FERIADOS,
    ATENCAO, TIPO_ROT, METAS, ANO, FAT_DIAS, situacao, ritmo, metaVal, medKey, safraNov, comparecimento, fechNov, somaV, deMed,
    SAFRA_NOV, COMP_NOV, FECH_NOV, ATIVOS, ativosEtapa, fechMes,
    fone, consulta, dmNum, parados, noLimite, valorLead,
  };
})();
