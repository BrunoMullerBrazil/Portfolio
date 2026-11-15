/* =====================================================================
   PLANOS DE EXEMPLO (window.PLD) · dados FICTÍCIOS · hoje = 13/11/2026
   Formato de ESPECIALIDADES_SPEC.md §3.4. A tela de plano grava a versão
   editada em localStorage["munin:plano:<pacienteId>"] e cai aqui se não
   houver nada salvo.
   - cristina, patricia e gabriela já existem em dados.js (VA.P): os
     números de Painel, Funil e Metas NÃO mudam por causa destes planos.
   - mariana-alves e rafael-nogueira são pacientes de demonstração do pacote
     odonto e ficam SÓ aqui (PLD.pacientes), fora do registro VA.P.
   - Os itens guardam só o comercial: alvo, procedimento do catálogo, qtd,
     grupo, status, motivo fechado, datas. Nada clínico, nenhum texto livre.
   ===================================================================== */
(function () {
  const W = typeof window !== "undefined" ? window : globalThis;

  // Profissionais de demonstração que não estão em VA2.EQUIPE
  const profissionais = {
    o: { nome: "Dr. Caio Ribeiro", curto: "Dr. Caio", perfil: "medico", pacotes: ["odonto"], demo: true },
  };
  // Pacientes de demonstração (fora de VA.P)
  const pacientes = {
    "mariana-alves": { id: "mariana-alves", nome: "Mariana Alves", med: "o", origem: "Instagram", proc: "Plano odontológico", demo: true },
    "rafael-nogueira": { id: "rafael-nogueira", nome: "Rafael Nogueira", med: "o", origem: "Indicação", proc: "Plano odontológico", demo: true },
  };

  const PLANOS = {
    /* Cristina Valadares · recall de toxina; mandíbula (bioestimulador + ultrassom) em aberto, R$ 9.700.
       Subtotal 12.500 − 5% (625) = 11.875 · 10× de 1.187,50 · 3 pontos no rosto (glabela, mandíbula, malar).
       A remoção no tronco (i5) é sugestão do médico ainda não aceita: fica fora do total até a closer aceitar. */
    cristina: {
      id: "pl-cristina-1", paciente: "cristina", pacote: "dermato", variante: "A",
      med: "d", closer: "tatiana", criado: "13/11/2026", atualizado: "13/11/2026 09:40", subStatus: "Plano parcial",
      itens: [
        { uid: "i1", alvo: "glabela", proc: "tox", qtd: 20, unidade: "U", grupo: "superior", status: "aceito", origem: "closer", data: "13/11/2026" },
        { uid: "i2", alvo: "mandibula_e", lado: "bi", proc: "bio", qtd: 2, unidade: "frasco", grupo: "inferior", status: "em_aberto", origem: "medico", motivo: "Vai pensar" },
        { uid: "i3", alvo: "mandibula_e", lado: "bi", proc: "usm", qtd: 1, unidade: "sessao", grupo: "inferior", status: "em_aberto", origem: "medico", motivo: "Preço" },
        { uid: "i4", alvo: "malar_e", lado: "bi", proc: "skin", qtd: 1, unidade: "sessao", grupo: "medio", status: "proposto", origem: "closer" },
        { uid: "i5", alvo: "a-tronco", proc: "remocao", qtd: 2, unidade: "lesao", grupo: "pele", status: "proposto", origem: "medico", sugerido: true },
      ],
      desconto: { pct: 5, aprovado: true },
      pagamento: { forma: "cartao", parcelas: 10 },
      valores: { liberadosApresentacao: false },
      resumo: { token: "k8f2", expira: "20/11/2026" },
    },

    /* Patrícia Leme · fechou parcial em julho; 2ª etapa sem data = saldo R$ 8.114 (= VA.P.patricia.pend).
       Preços travados no fechamento (valorFechado), então a tabela nova não muda este plano. */
    patricia: {
      id: "pl-patricia-1", paciente: "patricia", pacote: "dermato", variante: "A",
      med: "d", closer: "tatiana", criado: "02/07/2026", fechado: "15/07/2026", atualizado: "15/07/2026 16:10", subStatus: "Plano parcial",
      itens: [
        { uid: "p1", alvo: "mandibula_e", lado: "bi", proc: "usm", qtd: 1, unidade: "sessao", grupo: "inferior", status: "realizado", origem: "closer", data: "15/07/2026", valorFechado: 4275, etapa: 1 },
        { uid: "p2", alvo: "mandibula_e", lado: "bi", proc: "bio", qtd: 2, unidade: "frasco", grupo: "inferior", status: "em_aberto", origem: "closer", valorFechado: 4940, etapa: 2, motivo: "Vai pensar" },
        { uid: "p3", alvo: "malar_e", lado: "bi", proc: "ah", qtd: 2, unidade: "seringa", grupo: "medio", status: "em_aberto", origem: "closer", valorFechado: 3174, etapa: 2, motivo: "Vai pensar" },
      ],
      desconto: { pct: 0 },
      pagamento: { forma: "cartao", parcelas: 6, pago: 4275 },
      valores: { liberadosApresentacao: false },
      resumo: null,
    },

    /* Gabriela Rocha · bioestimulador em 2 etapas de R$ 2.050 (total 4.100); 1ª em 10/11, 2ª hoje */
    gabriela: {
      id: "pl-gabriela-1", paciente: "gabriela", pacote: "dermato", variante: "A",
      med: "g", closer: "tatiana", criado: "10/11/2026", fechado: "10/11/2026", atualizado: "10/11/2026 15:20", subStatus: "Aguardando 2ª sessão",
      itens: [
        { uid: "g1", alvo: "malar_e", lado: "bi", proc: "bio", qtd: 1, unidade: "frasco", grupo: "medio", status: "realizado", origem: "closer", data: "10/11/2026", valorFechado: 2050, sessao: { i: 1, n: 2 } },
        { uid: "g2", alvo: "malar_e", lado: "bi", proc: "bio", qtd: 1, unidade: "frasco", grupo: "medio", status: "aceito", origem: "closer", data: "13/11/2026", valorFechado: 2050, sessao: { i: 2, n: 2 } },
      ],
      desconto: { pct: 0 },
      pagamento: { forma: "cartao", parcelas: 2, pago: 2050 },
      valores: { liberadosApresentacao: false },
      resumo: null,
    },

    /* revisão pacotes (tela do plano): duas pacientes da agenda de hoje da Dra. Lúcia, para o
       mini-mapa do estudo do Médico. Só planos novos: VA.P, Painel, Funil e Metas não mudam. */
    /* Mariana Siqueira · bioestimulador no malar em 2 sessões (hoje fecha o ciclo); ultrassom de mandíbula em aberto */
    mariana: {
      id: "pl-mariana-1", paciente: "mariana", pacote: "dermato", variante: "A",
      med: "d", closer: "tatiana", criado: "15/10/2026", fechado: "15/10/2026", atualizado: "13/11/2026 09:12", subStatus: "Série 2/2",
      itens: [
        { uid: "s1", alvo: "malar_e", lado: "bi", proc: "bio", qtd: 1, unidade: "frasco", grupo: "medio", status: "realizado", origem: "closer", data: "15/10/2026", valorFechado: 2600, sessao: { i: 1, n: 2 } },
        { uid: "s2", alvo: "malar_e", lado: "bi", proc: "bio", qtd: 1, unidade: "frasco", grupo: "medio", status: "aceito", origem: "closer", data: "13/11/2026", valorFechado: 2600, sessao: { i: 2, n: 2 } },
        { uid: "s3", alvo: "mandibula_e", lado: "bi", proc: "usm", qtd: 1, unidade: "sessao", grupo: "inferior", status: "em_aberto", origem: "medico", motivo: "Vai pensar" },
      ],
      desconto: { pct: 0 }, pagamento: { forma: "cartao", parcelas: 2, pago: 5200 }, valores: { liberadosApresentacao: false }, resumo: null,
    },
    /* Joana Bastos · skinbooster em 3 sessões (1ª hoje); a Dra. sugeriu toxina na glabela */
    joana: {
      id: "pl-joana-1", paciente: "joana", pacote: "dermato", variante: "A",
      med: "d", closer: "tatiana", criado: "06/11/2026", fechado: "06/11/2026", atualizado: "06/11/2026 15:30", subStatus: "Série 1/3",
      itens: [
        { uid: "j1", alvo: "malar_e", lado: "bi", proc: "skin", qtd: 3, unidade: "sessao", grupo: "medio", status: "aceito", origem: "closer", data: "13/11/2026", valorFechado: 4500, serie: { n: 3, intervalo: 30, i: 1 } },
        { uid: "j2", alvo: "glabela", proc: "tox", qtd: 20, unidade: "U", grupo: "superior", status: "proposto", origem: "medico", sugerido: true },
      ],
      desconto: { pct: 0 }, pagamento: { forma: "cartao", parcelas: 3 }, valores: { liberadosApresentacao: false }, resumo: null,
    },

    /* Mariana Alves · odonto · Fase 1 aceita (limpeza feita), Fase 2 coroa em aberto, Fase 3 estética proposta.
       350 + 240 + 1.400 + 2.400 + 5.800 + 12.000 (6 lentes) + 1.200 (clareamento) = 23.390 · 12× */
    "mariana-alves": {
      id: "pl-mariana-alves-1", paciente: "mariana-alves", pacote: "odonto", variante: "A",
      med: "o", closer: "tatiana", criado: "06/11/2026", atualizado: "13/11/2026 09:10", subStatus: "Fase 1 aceita",
      titulos: { "fase-1": "Prioridade", "fase-2": "Reabilitação", "fase-3": "Estética" },
      itens: [
        { uid: "m1", alvo: "boca", proc: "limpeza", qtd: 1, unidade: "sessao", grupo: "fase-1", status: "realizado", origem: "medico", data: "06/11/2026" },
        { uid: "m2", alvo: "d36", proc: "rest", faces: ["M", "O"], qtd: 2, unidade: "face", grupo: "fase-1", status: "aceito", origem: "medico" },
        { uid: "m3", alvo: "d46", proc: "endo-mol", qtd: 1, unidade: "dente", grupo: "fase-1", status: "aceito", origem: "medico" },
        { uid: "m4", alvo: "d46", proc: "coroa", qtd: 1, unidade: "dente", grupo: "fase-2", status: "em_aberto", origem: "medico", motivo: "Preço" },
        { uid: "m5", alvo: "d26", proc: "implante", qtd: 1, unidade: "dente", grupo: "fase-2", status: "proposto", origem: "medico" },
        ...["d13", "d12", "d11", "d21", "d22", "d23"].map((d, i) => ({ uid: "m" + (6 + i), alvo: d, proc: "lente", qtd: 1, unidade: "dente", grupo: "fase-3", status: "proposto", origem: "closer", combo: "lentes6#1" })),
        { uid: "m12", alvo: "arcada_sup", proc: "clareamento", qtd: 1, unidade: "arcada", grupo: "fase-3", status: "proposto", origem: "closer", combo: "clareamento2#1" },
        { uid: "m13", alvo: "arcada_inf", proc: "clareamento", qtd: 1, unidade: "arcada", grupo: "fase-3", status: "proposto", origem: "closer", combo: "clareamento2#1" },
      ],
      desconto: { pct: 0 },
      pagamento: { forma: "cartao", parcelas: 12 },
      valores: { liberadosApresentacao: false },
      resumo: { token: "m3a7", expira: "20/11/2026" },
    },

    /* Rafael Nogueira · odonto · Fase 1 aceita; Fase 2 alinhadores em aberto (recorrente mensal) e um item a definir.
       350 + 650 + 650 + 180 + 300 + 11.700 + 900 = 14.730 − 5% (737) = 13.993 · 12× */
    "rafael-nogueira": {
      id: "pl-rafael-nogueira-1", paciente: "rafael-nogueira", pacote: "odonto", variante: "A",
      med: "o", closer: "tatiana", criado: "30/10/2026", atualizado: "12/11/2026 17:45", subStatus: "Em execução",
      titulos: { "fase-1": "Prioridade", "fase-2": "Estética" },
      itens: [
        { uid: "l1", alvo: "boca", proc: "limpeza", qtd: 1, unidade: "sessao", grupo: "fase-1", status: "realizado", origem: "medico", data: "30/10/2026" },
        { uid: "l2", alvo: "d38", proc: "extracao-siso", qtd: 1, unidade: "dente", grupo: "fase-1", status: "aceito", origem: "medico", data: "19/11/2026" },
        { uid: "l3", alvo: "d48", proc: "extracao-siso", qtd: 1, unidade: "dente", grupo: "fase-1", status: "aceito", origem: "medico", data: "19/11/2026" },
        { uid: "l4", alvo: "d15", proc: "rest", faces: ["O"], qtd: 1, unidade: "face", grupo: "fase-1", status: "aceito", origem: "medico" },
        { uid: "l5", alvo: "d25", proc: "rest", faces: ["M", "O", "D"], qtd: 3, unidade: "face", grupo: "fase-1", status: "aceito", origem: "medico" },
        { uid: "l6", alvo: "boca", proc: "alinhadores", qtd: 18, unidade: "mes", grupo: "fase-2", status: "em_aberto", origem: "closer", motivo: "Decide com outra pessoa" },
        { uid: "l7", alvo: "arcada_sup", proc: "placa", qtd: 1, unidade: "arcada", grupo: "fase-2", status: "proposto", origem: "medico" },
        { uid: "l8", alvo: "d37", proc: "a-definir", qtd: 1, unidade: "dente", grupo: "fase-2", status: "proposto", origem: "medico" },
      ],
      desconto: { pct: 5, aprovado: true },
      pagamento: { forma: "cartao", parcelas: 12 },
      valores: { liberadosApresentacao: false },
      resumo: null,
    },
  };

  // plano efetivo de um paciente: o que a tela gravou (localStorage) ou a semente
  function plano(id) {
    try { const s = JSON.parse(W.localStorage.getItem("munin:plano:" + id) || "null"); if (s && Array.isArray(s.itens)) return s; } catch (e) { /* sem armazenamento */ }
    return PLANOS[id] ? JSON.parse(JSON.stringify(PLANOS[id])) : null;
  }
  const paciente = id => pacientes[id] || (W.VA && W.VA.P && W.VA.P[id]) || null;
  const nomeProf = med => profissionais[med] ? profissionais[med].nome : med === "d" ? "Dra. Lúcia Sena" : med === "g" ? "Dr. Rafael Sena" : med;

  W.PLD = Object.assign({}, PLANOS, {
    PLANOS, ids: Object.keys(PLANOS), pacientes, profissionais, plano, paciente, nomeProf,
  });
})();
