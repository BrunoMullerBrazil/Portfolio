/* =====================================================================
   DADOS DE APOIO das telas por perfil (fictícios) · window.VAP
   Carregar DEPOIS de dados.js e dados2.js. Não muda nenhum número de
   Painel, Funil e Metas: os leads que chegaram hoje entram em VA.P SEM
   etapa (fazem parte dos 38 leads da safra de novembro, que é agregada).
   Hoje = sexta 13/11/2026, 09:40 (o mesmo relógio de dados.js).
   ===================================================================== */
(function () {
  const VA = window.VA, P = VA.P;
  const min = h => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const AGORA = min(VA.AGORA);

  /* ---------- SDR: leads que chegaram hoje -------------------------------
     prazo de 1ª resposta: 15 minutos (o lead esfria rápido).
     st: aguarda (ninguém respondeu) | respondido (respondemos, falta agendar) | agendado */
  const PRAZO_RESPOSTA = 15;
  const NOVOS = [
    { id: "marcela",  nome: "Marcela Tavares",  med: "d", origem: "Instagram", proc: "Toxina botulínica",      t: 3, pot: 1800, chegou: "08:12", canal: "Direct do Instagram", pediu: "Perguntou o valor do botox", st: "aguarda" },
    { id: "luiza",    nome: "Luíza Arruda",     med: "d", origem: "Indicação", proc: "Skinbooster",            t: 4, pot: 2400, chegou: "08:20", canal: "WhatsApp", pediu: "Indicada pela Joana Bastos", st: "agendado", resp: "08:24", consulta: ["19/11", "14:00"] },
    { id: "henrique", nome: "Henrique Saboia",  med: "g", origem: "Parceria", proc: "Ultrassom microfocado",  t: 4, pot: 7800, chegou: "08:50", canal: "Parceiro", pediu: "Quer horário à tarde", st: "respondido", resp: "08:58" },
    { id: "gisele",   nome: "Gisele Nóbrega",   med: "g", origem: "Google",    proc: "Clareamento de manchas", t: 3, pot: 2600, chegou: "09:05", canal: "Formulário do site", pediu: "Manchas no rosto há 2 anos", st: "aguarda" },
    { id: "barbara",  nome: "Bárbara Quintana", med: "d", origem: "Site",      proc: "Bioestimulador",         t: 3, pot: 3600, chegou: "09:31", canal: "WhatsApp", pediu: "Quer saber como funciona", st: "aguarda" },
  ];
  NOVOS.forEach(n => {
    n.espera = AGORA - min(n.chegou);            // minutos desde que chegou
    P[n.id] = Object.assign({ id: n.id, novoHoje: true, lead: "13/11/2026", nota: n.pediu }, P[n.id] || {},
      { nome: n.nome, med: n.med, origem: n.origem, proc: n.proc, t: n.t, pot: n.pot });
  });
  // Qualificados sem data (SDR agenda): leads em contato que já disseram o que querem
  const AGENDAR = [
    { id: "henrique", motivo: "Respondido às 08:58 · quer horário à tarde", sev: "atencao", prazo: "Hoje" },
    { id: "cecilia",  motivo: "Aguardando data · volta a falar em 25/11", sev: "ok", prazo: "25/11" },
    { id: "lucas",    motivo: "Lead de ontem · sem próximo contato definido", sev: "neutro", prazo: "Sem data" },
  ];
  // Meta de agendamentos do mês (SDR): realizado = "agendaram" da safra de novembro (VA.safraNov)
  const META_AG = { meta: 40, sup: 44 };

  /* ---------- Médico: o "estudo" de cada paciente da agenda de hoje -----
     hist: o que já aconteceu · plano: plano em aberto ou em curso · oport: oportunidade
     (só quando faz sentido clínico) · tom: como conduzir. Coerência clínica, não só objetivo comercial. */
  const ESTUDO = {
    heloisa: { hist: "Paciente da casa desde 2024. Liftera de papada em 3 sessões, boa resposta e sem intercorrências.", plano: "Nenhum plano em aberto.", oport: "Se houver flacidez de pescoço, ultrassom microfocado complementa a papada.", tom: "Mostre a evolução com as fotos; sugira só se a pele pedir." },
    ingrid:  { hist: "Laser em 3 sessões (campanha de setembro). Hoje é a sessão 2.", plano: "Sessão 3 já paga, a marcar para dezembro.", oport: "Skinbooster depois do laser pode consolidar a textura.", tom: "Primeiro o resultado do laser; o resto fica para a sessão 3." },
    mariana: { hist: "Carteira Diamante. Bioestimulador em 2 sessões; hoje fecha o ciclo.", plano: "Ciclo pago por inteiro.", oport: "Manutenção do bioestimulador em 6 meses: deixe o recall combinado na saída.", tom: "Cliente fiel: conversa de acompanhamento, sem pressa de vender." },
    debora:  { hist: "Toxina botulínica há 5 meses. Chegou pelo Instagram.", plano: "Nenhum plano em aberto.", oport: "Manutenção a cada 4 meses: o próximo retorno já pode sair marcado hoje.", tom: "Reaplicação simples; reforce o intervalo certo." },
    paula:   { hist: "1ª consulta. Lead do Google de 04/11.", plano: "Ainda sem plano.", oport: "Conduta clínica fica com a médica; plano estético só se ela indicar.", tom: "Primeira consulta: ouvir antes de propor." },
    aline:   { hist: "Consulta anual de rotina.", plano: "Nenhum plano em aberto.", oport: "Retorno em 6 meses.", tom: "Consulta de segurança. Não é momento de oferta estética." },
    raquel:  { hist: "1ª consulta. Lead do Instagram de 06/11; não respondeu à confirmação.", plano: "Ainda sem plano.", oport: "Interesse no Protocolo Natural Lift (≈ R$ 6,5 mil), mas está morna.", tom: "Entenda a queixa antes de falar em protocolo." },
    joana:   { hist: "Veio por indicação. Skinbooster em 3 sessões; hoje é a 1ª.", plano: "3 sessões fechadas.", oport: "Indicou a Luíza Arruda (agendada para 19/11): vale agradecer.", tom: "Explique o que esperar entre as sessões e o cuidado em casa." },
    simone:  { hist: "1ª consulta. Indicada pela Parceria; confirmou rápido.", plano: "Ainda sem plano.", oport: "Interesse em ultrassom microfocado (≈ R$ 7,8 mil).", tom: "Se a flacidez não justificar, diga por quê. Indicação certa fideliza." },
    kelly:   { hist: "Retorno de acompanhamento, 3ª consulta.", plano: "Acompanhamento em curso.", oport: "Peeling para manchas, se a médica indicar.", tom: "Só se ela trouxer o assunto." },
    thais:   { hist: "1ª consulta. Lead do Google de 07/11; ainda não confirmou.", plano: "Ainda sem plano.", oport: "Protocolo Natural Lift (≈ R$ 6,5 mil).", tom: "Ouça a expectativa; proponha só o que a pele pede." },
    luana:   { hist: "Peeling químico em série, 2ª sessão.", plano: "Série em curso.", oport: "Manutenção semestral; avalie manchas.", tom: "Reforce a fotoproteção; é ela que segura o resultado." },
  };

  /* ---------- Closer: saldos de fechamento parcial ---------------------- */
  const SALDOS = [
    { id: "gabriela", saldo: 2050, total: 4100, txt: "Bioestimulador · 2ª etapa combinada para hoje, horário a marcar", sev: "atencao", prazo: "Hoje" },
    { id: "patricia", saldo: 8114, total: null, txt: "Natural Lift · fechou a 1ª etapa em julho, 2ª sem data", sev: "atrasado", prazo: "8 dias de atraso" },
  ];

  /* ---------- Responsável da etapa ("com quem está agora") -------------- */
  const PAPEL = { sdr: "SDR", recepcao: "Recepção", medico: "Médico", closer: "Closer" };
  // contato → SDR · agendado/confirmado → Recepção · compareceu → Médico · plano/fechou → Closer.
  // Em atendimento agora → Médico. Pacientes da casa: com consulta marcada → Recepção; recall ou
  // saldo de fechamento parcial → Closer.
  function responsavel(p) {
    if (!p) return null;
    if (p.novoHoje) return "sdr";
    const ag = VA.AGENDA.find(a => a.id === p.id && !a.evento);
    if (ag && ag.st === "atend") return "medico";            // em atendimento agora
    switch (p.etapa) {
      case "contato": return "sdr";
      case "agendado": case "confirmado": return "recepcao";
      case "compareceu": return "medico";
      case "plano": case "fechou": return "closer";
    }
    if (ag && ag.st === "feito") return null;                // já atendida hoje, sem pendência
    if (p.ag || (ag && ag.st === "recep") || (VA.consulta && VA.consulta(p.id))) return "recepcao";
    if (p.pend || p.ult) return "closer";
    return ag ? "recepcao" : null;
  }
  const MOTIVO = {
    sdr: "qualificar e agendar", recepcao: "confirmar, receber e registrar",
    medico: "consulta e plano", closer: "apresentar, fechar e recall",
  };

  window.VAP = { NOVOS, PRAZO_RESPOSTA, AGENDAR, META_AG, ESTUDO, SALDOS, PAPEL, MOTIVO, responsavel, min };
})();
