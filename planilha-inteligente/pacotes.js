/* =====================================================================
   PACOTES POR ESPECIALIDADE (window.PAC) · revisão "pacotes"
   Só DADOS: vistas (ids de desenho), alvos, catálogo neutro, unidades,
   combos, recall, KPIs, sub-status do funil e grupos. O motor de cálculo
   está em plano_motor.js (window.PL) e é o mesmo para todos os pacotes.

   Linha vermelha de prontuário (ESPECIALIDADES_SPEC.md §1.3):
   - o catálogo é FECHADO e usa nomes comerciais neutros (flag revisadoLGPD);
   - nada de diagnóstico, condição, queixa, medida, dose técnica ou foto;
   - não há campo livre clínico; a clínica só escolhe entre `sinonimos`
     neutros pré-aprovados.

   IDs de desenho (contrato com desenhos/desenhos_estetica.js e
   desenhos/desenhos_odonto.js, atributo data-alvo):
     rosto        frontal glabela periorbital_e/_d olheira_e/_d nariz malar_e/_d
                  nasogeniano_e/_d labios mento mandibula_e/_d masseter_e/_d papada
     corpo_frente pescoco colo braco_e/_d axila_e/_d abdome_sup abdome_inf
                  flanco_e/_d coxa_int_e/_d coxa_ext_e/_d joelho_e/_d maos
     corpo_costas costas_sup costas_inf gluteo_e/_d culote_e/_d posterior_coxa_e/_d
                  panturrilha_e/_d braco_post_e/_d
     odontograma  d11..d18 d21..d28 d31..d38 d41..d48 (faces M D O V L) + arcada_sup arcada_inf
     sorriso      d13..d23 d33..d43 arcada_sup arcada_inf
   Regiões em par: o item aponta para UM id de desenho (ex.: "mandibula_e") e
   leva `lado: "bi"` quando vale para os dois lados; o par vem em `alvo.par`
   ("mandibula_d"). PAC.alvosDoItem(pac, item) devolve os ids a acender.
   Alvos sem desenho (vista "pele", "corpo_inteiro", "boca") têm `vista`
   sem mapa e nunca aparecem como data-alvo.
   ===================================================================== */
(function () {
  const W = typeof window !== "undefined" ? window : globalThis;
  const REVISAO = "2026-11-15";

  /* ---------- Unidades comerciais (regras aplicadas em PL.normalizaQtd) ---------- */
  const UNIDADES = {
    U:       { rot: "U",       um: "unidade",  varios: "unidades",  passo: 2, min: 2, max: 400, desc: "unidades de toxina" },
    seringa: { rot: "ser.",    um: "seringa",  varios: "seringas",  passo: 1, min: 1, max: 10 },
    frasco:  { rot: "fr.",     um: "frasco",   varios: "frascos",   passo: 1, min: 1, max: 6 },
    sessao:  { rot: "sess.",   um: "sessão",   varios: "sessões",   passo: 1, min: 1, max: 24 },
    area:    { rot: "área",    um: "área",     varios: "áreas",     passo: 1, min: 1, max: 12 },
    lesao:   { rot: "un.",     um: "lesão",    varios: "lesões",    passo: 1, min: 1, max: 30, desc: "1ª unidade cheia, seguintes com preço adicional" },
    dente:   { rot: "dente",   um: "dente",    varios: "dentes",    passo: 1, min: 1, max: 1, desc: "uma linha por dente" },
    face:    { rot: "face",    um: "face",     varios: "faces",     passo: 1, min: 1, max: 5, desc: "preço por nº de faces: 1, 2, 3 ou mais" },
    arcada:  { rot: "arcada",  um: "arcada",   varios: "arcadas",   passo: 1, min: 1, max: 2 },
    mes:     { rot: "mês",     um: "mês",      varios: "meses",     passo: 1, min: 1, max: 36, desc: "recorrente mensal (informativo, fora da meta)" },
    pacote:  { rot: "pac.",    um: "pacote",   varios: "pacotes",   passo: 1, min: 1, max: 1 },
  };

  /* ---------- Detector suave de texto livre (§4f) ---------- */
  const TERMOS_SENSIVEIS = {
    regex: [/\d+\s?(mg\/dL|kg|mmHg|dB|%)/i, /\b[A-TV-Z]\d{2}(\.\d)?\b/],
    termos: ["câncer", "cancer", "melanoma", "suspeito", "suspeita", "alergia", "alérgica", "gestante", "grávida",
      "cárie", "carie", "apneia", "perda auditiva", "seroma", "diástase", "diabetes", "hipertensão", "lesão maligna",
      "biópsia", "laudo", "infecção", "inflamação", "dor", "sangramento", "medicação", "remédio", "hiperidrose",
      "bruxismo", "melasma", "rosácea", "acne", "periodontite", "gengivite", "canal inflamado", "abscesso"],
    aviso: "Isso parece dado clínico. Registre no prontuário da clínica.",
  };
  const semAcento = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function sensivel(txt) {
    if (!txt) return false;
    if (TERMOS_SENSIVEIS.regex.some(r => r.test(txt))) return true;
    const t = " " + semAcento(txt).replace(/[^a-z0-9 ]/g, " ") + " ";
    return TERMOS_SENSIVEIS.termos.some(w => t.includes(" " + semAcento(w) + " "));
  }

  /* =====================================================================
     ESTÉTICA (id "dermato") · rosto, corpo (frente + costas), pele
     ===================================================================== */
  // alvo de rosto/corpo: [id, nome, grupo, procs, extras]
  const A = (id, vista, nome, grupo, procs, x) => Object.assign({ id, tipo: "regiao", vista, nome, grupo, procs }, x || {});
  const par = (base, vista, nome, grupo, procs, x) => [
    A(base + "_e", vista, nome, grupo, procs, Object.assign({ lado: "E", par: base + "_d", nomePar: nome }, x)),
    A(base + "_d", vista, nome, grupo, procs, Object.assign({ lado: "D", par: base + "_e", nomePar: nome }, x)),
  ];

  const dermatoAlvos = [
    // ROSTO
    A("frontal", "rosto", "Frontal", "superior", ["tox", "usm"], { beneficio: "suavizar a expressão da testa" }),
    A("glabela", "rosto", "Glabela", "superior", ["tox"], { pequena: true, beneficio: "suavizar a expressão" }),
    ...par("periorbital", "rosto", "Região dos olhos", "superior", ["tox", "skin"], { pequena: true, beneficio: "olhar descansado" }),
    ...par("olheira", "rosto", "Infraorbital", "medio", ["ah", "skin"], { pequena: true, beneficio: "aspecto descansado" }),
    A("nariz", "rosto", "Nariz", "medio", ["ah"], { pequena: true, beneficio: "harmonia do perfil" }),
    ...par("malar", "rosto", "Malar", "medio", ["ah", "bio", "skin"], { beneficio: "sustentação e viço" }),
    ...par("nasogeniano", "rosto", "Sulco nasogeniano", "medio", ["ah"], { pequena: true, beneficio: "transição suave" }),
    A("labios", "rosto", "Lábios", "inferior", ["ah"], { pequena: true, beneficio: "contorno e hidratação" }),
    A("mento", "rosto", "Mento", "inferior", ["ah", "bio"], { pequena: true, beneficio: "equilíbrio do perfil" }),
    ...par("mandibula", "rosto", "Mandíbula", "inferior", ["ah", "bio", "usm"], { beneficio: "contorno e firmeza" }),
    ...par("masseter", "rosto", "Masseter", "inferior", ["tox-masseter"], { beneficio: "contorno do terço inferior" }),
    A("papada", "rosto", "Papada", "inferior", ["usm", "rf"], { beneficio: "definição do contorno" }),
    // CORPO · frente
    A("pescoco", "corpo_frente", "Pescoço", "corpo", ["tox-pescoco", "skin", "usm-corpo"], { beneficio: "pele do pescoço" }),
    A("colo", "corpo_frente", "Colo", "corpo", ["skin", "bio-corpo"], { beneficio: "viço do colo" }),
    ...par("braco", "corpo_frente", "Braço", "corpo", ["bio-corpo", "rf", "crio"], { beneficio: "firmeza dos braços" }),
    ...par("axila", "corpo_frente", "Axila", "corpo", ["tox-axilas"], { pequena: true, beneficio: "conforto no dia a dia" }),
    A("abdome_sup", "corpo_frente", "Abdome superior", "corpo", ["crio", "rf", "bio-corpo", "usm-corpo"], { beneficio: "contorno do abdome" }),
    A("abdome_inf", "corpo_frente", "Abdome inferior", "corpo", ["crio", "rf", "bio-corpo", "usm-corpo"], { beneficio: "contorno do abdome" }),
    ...par("flanco", "corpo_frente", "Flanco", "corpo", ["crio", "rf"], { beneficio: "contorno da cintura" }),
    ...par("coxa_int", "corpo_frente", "Coxa interna", "corpo", ["bio-corpo", "rf", "crio"], { beneficio: "firmeza das coxas" }),
    ...par("coxa_ext", "corpo_frente", "Coxa externa", "corpo", ["bio-corpo", "rf", "crio"], { beneficio: "contorno das coxas" }),
    ...par("joelho", "corpo_frente", "Joelho", "corpo", ["bio-corpo", "rf"], { pequena: true, beneficio: "pele acima dos joelhos" }),
    A("maos", "corpo_frente", "Mãos", "corpo", ["skin", "bio-corpo"], { pequena: true, beneficio: "viço das mãos" }),
    // CORPO · costas
    A("costas_sup", "corpo_costas", "Costas superior", "corpo", ["peeling-corpo", "rf"], { beneficio: "pele das costas" }),
    A("costas_inf", "corpo_costas", "Costas inferior", "corpo", ["crio", "rf"], { beneficio: "contorno lombar" }),
    ...par("gluteo", "corpo_costas", "Glúteo", "corpo", ["bio-corpo", "rf"], { beneficio: "firmeza e contorno" }),
    ...par("culote", "corpo_costas", "Culote", "corpo", ["crio", "rf", "bio-corpo"], { beneficio: "contorno do quadril" }),
    ...par("posterior_coxa", "corpo_costas", "Posterior da coxa", "corpo", ["bio-corpo", "rf"], { beneficio: "firmeza das coxas" }),
    ...par("panturrilha", "corpo_costas", "Panturrilha", "corpo", ["rf"], { beneficio: "pele das pernas" }),
    ...par("braco_post", "corpo_costas", "Braço posterior", "corpo", ["bio-corpo", "rf", "crio"], { beneficio: "firmeza dos braços" }),
    // PELE · quantidade por área ampla (sem mapa, sem posição)
    { id: "a-rosto",  tipo: "area", vista: "pele", nome: "Rosto",          grupo: "pele", procs: ["remocao", "laser-rosto", "peeling"] },
    { id: "a-tronco", tipo: "area", vista: "pele", nome: "Tronco",         grupo: "pele", procs: ["remocao", "peeling-corpo"] },
    { id: "a-bracos", tipo: "area", vista: "pele", nome: "Braços e mãos",  grupo: "pele", procs: ["remocao"] },
    { id: "a-pernas", tipo: "area", vista: "pele", nome: "Pernas",         grupo: "pele", procs: ["remocao"] },
    { id: "corpo_inteiro", tipo: "pacote", vista: "pele", nome: "Corpo inteiro", grupo: "pele", procs: ["mapa"], fixo: true },
  ];

  const dermatoProcs = [
    { id: "tox", nome: "Toxina botulínica", sinonimos: ["Toxina botulínica", "Neuromodulador", "Toxina"], familia: "toxina", unidade: "U",
      precoBase: 55, qtdPadrao: { frontal: 10, glabela: 20, periorbital: 24, _: 20 }, recall: [{ d: 120 }], retornoIncluso: 15 },
    { id: "tox-masseter", nome: "Toxina · masseter", sinonimos: ["Toxina · masseter", "Neuromodulador · masseter"], familia: "toxina", unidade: "U",
      precoBase: 55, qtdPadrao: 50, recall: [{ d: 180 }], retornoIncluso: 15 },
    { id: "tox-axilas", nome: "Toxina · axilas", sinonimos: ["Toxina · axilas", "Neuromodulador · axilas"], familia: "toxina", unidade: "U",
      precoBase: 40, qtdPadrao: 100, recall: [{ d: 180 }] },
    { id: "tox-pescoco", nome: "Toxina · pescoço", sinonimos: ["Toxina · pescoço", "Neuromodulador · pescoço"], familia: "toxina", unidade: "U",
      precoBase: 55, qtdPadrao: 30, recall: [{ d: 120 }], retornoIncluso: 15 },
    { id: "ah", nome: "Preenchimento com ácido hialurônico", sinonimos: ["Preenchimento com ácido hialurônico", "Ácido hialurônico", "Preenchimento"], familia: "preenchimento", unidade: "seringa",
      precoBase: 1900, qtdPadrao: { malar: 2, mandibula: 2, _: 1 }, recall: [{ d: 365 }], retornoIncluso: 20 },
    { id: "bio", nome: "Bioestimulador de colágeno", sinonimos: ["Bioestimulador de colágeno", "Bioestimulador"], familia: "bioestimulador", unidade: "frasco",
      precoBase: 2600, qtdPadrao: { mandibula: 2, _: 1 }, serie: { n: 3, intervalo: 45 }, recall: [{ d: 365 }] },
    { id: "bio-corpo", nome: "Bioestimulador corporal", sinonimos: ["Bioestimulador corporal", "Bioestimulador · corpo"], familia: "bioestimulador", unidade: "frasco",
      precoBase: 2400, qtdPadrao: 2, serie: { n: 2, intervalo: 60 }, recall: [{ d: 365 }] },
    { id: "skin", nome: "Skinbooster", sinonimos: ["Skinbooster", "Hidratação injetável"], familia: "skinbooster", unidade: "sessao",
      precoBase: 1700, qtdPadrao: 1, serie: { n: 3, intervalo: 30 }, recall: [{ d: 180 }] },
    { id: "usm", nome: "Ultrassom microfocado", sinonimos: ["Ultrassom microfocado", "Ultrassom de rosto"], familia: "ultrassom", unidade: "sessao",
      precoBase: 4500, qtdPadrao: 1, recall: [{ d: 365 }] },
    { id: "usm-corpo", nome: "Ultrassom microfocado corporal", sinonimos: ["Ultrassom microfocado corporal", "Ultrassom · corpo"], familia: "ultrassom", unidade: "area",
      precoBase: 2800, qtdPadrao: 1, recall: [{ d: 365 }] },
    { id: "rf", nome: "Radiofrequência", sinonimos: ["Radiofrequência", "Tecnologia de firmeza"], familia: "tecnologia", unidade: "sessao",
      precoBase: 450, qtdPadrao: 6, serie: { n: 6, intervalo: 7 }, recall: [{ d: 180 }] },
    { id: "crio", nome: "Criolipólise", sinonimos: ["Criolipólise", "Tecnologia de contorno"], familia: "tecnologia", unidade: "area",
      precoBase: 1200, qtdPadrao: 1, recall: [{ d: 120 }] },
    { id: "laser-rosto", nome: "Laser · rosto", sinonimos: ["Laser · rosto", "Laser facial"], familia: "laser", unidade: "sessao",
      precoBase: 1200, qtdPadrao: 1, serie: { n: 3, intervalo: 30 }, recall: [{ d: 365 }] },
    { id: "peeling", nome: "Peeling · rosto", sinonimos: ["Peeling · rosto", "Renovação de pele · rosto"], familia: "pele", unidade: "sessao",
      precoBase: 600, qtdPadrao: 1, serie: { n: 3, intervalo: 21 }, recall: [{ d: 180 }] },
    { id: "peeling-corpo", nome: "Peeling · corpo", sinonimos: ["Peeling · corpo", "Renovação de pele · corpo"], familia: "pele", unidade: "sessao",
      precoBase: 700, qtdPadrao: 1, serie: { n: 3, intervalo: 21 }, recall: [{ d: 180 }] },
    { id: "remocao", nome: "Remoção por unidade", sinonimos: ["Remoção por unidade", "Procedimento ambulatorial · por unidade"], familia: "pele", unidade: "lesao",
      precoBase: 450, precoAdicional: 300, qtdPadrao: 1, recall: [] },
    { id: "mapa", nome: "Mapeamento corporal", sinonimos: ["Mapeamento corporal", "Mapeamento · corpo inteiro"], familia: "mapeamento", unidade: "sessao",
      precoBase: 650, qtdPadrao: 1, alvoFixo: "corpo_inteiro", recall: [{ d: 365 }] },
  ];

  const dermato = {
    id: "dermato", rot: "Estética", nome: "Estética", nomeLongo: "Dermatologia e estética", estado: "ativo",
    revisadoLGPD: REVISAO, ico: "rosto",
    vistas: [
      { id: "rosto",        rot: "Rosto",          desenho: "rosto",        svg: "DES.rosto",        padrao: true },
      { id: "corpo_frente", rot: "Corpo · frente", desenho: "corpo_frente", svg: "DES.corpo_frente", aba: "corpo" },
      { id: "corpo_costas", rot: "Corpo · costas", desenho: "corpo_costas", svg: "DES.corpo_costas", aba: "corpo" },
      { id: "pele",         rot: "Pele",           desenho: null,           svg: null, tipo: "quantidade" },
    ],
    abas: [{ id: "rosto", rot: "Rosto", vistas: ["rosto"] }, { id: "corpo", rot: "Corpo", vistas: ["corpo_frente", "corpo_costas"] }, { id: "pele", rot: "Pele", vistas: ["pele"] }],
    grupos: [
      { id: "superior", nome: "Terço superior" },
      { id: "medio",    nome: "Terço médio" },
      { id: "inferior", nome: "Terço inferior e pescoço" },
      { id: "corpo",    nome: "Corpo" },
      { id: "pele",     nome: "Pele" },
    ],
    alvos: dermatoAlvos,
    procedimentos: dermatoProcs,
    // itens: [alvo, proc, qtd, lado?]
    combos: [
      { id: "terco-sup", nome: "Terço superior", itens: [["frontal", "tox", 10], ["glabela", "tox", 20], ["periorbital_e", "tox", 24, "bi"]], preco: 2700 },
      { id: "bio3", nome: "Protocolo bioestimulador · 3 sessões", itens: [["malar_e", "bio", 1, "bi"]], serie: true, preco: 7200 },
      { id: "contorno", nome: "Contorno do terço inferior", itens: [["mandibula_e", "ah", 2, "bi"], ["mento", "ah", 1]], preco: 5200 },
      { id: "skin3", nome: "Skinbooster · 3 sessões", itens: [["malar_e", "skin", 1, "bi"]], serie: true, preco: 4500 },
      { id: "abdome", nome: "Contorno do abdome", itens: [["abdome_inf", "crio", 2], ["abdome_inf", "rf", 6]], preco: 4600 },
    ],
    familias: [
      { id: "toxina", rot: "Toxina" }, { id: "bioestimulador", rot: "Bioestimulador" }, { id: "preenchimento", rot: "Preenchimento" },
      { id: "ultrassom", rot: "Ultrassom" }, { id: "skinbooster", rot: "Skinbooster" }, { id: "tecnologia", rot: "Tecnologias" },
      { id: "laser", rot: "Laser" }, { id: "pele", rot: "Pele" }, { id: "mapeamento", rot: "Mapeamento" },
    ],
    kpis: [
      { id: "recall90",      rot: "Recall previsto · 90 dias", desc: "R$ dos recalls com data até hoje + 90" },
      { id: "retornoToxina", rot: "Volta da toxina",           desc: "pacientes de toxina que voltaram no prazo (contagem)" },
      { id: "itensPorPlano", rot: "Itens por plano",           desc: "média de linhas aceitas por plano fechado" },
      { id: "porRegiao",     rot: "Por região",                desc: "região → propostos, aceitos, R$ aceito (contagens, sem %)" },
      { id: "serieCompleta", rot: "Séries completas",          desc: "séries que chegaram à última sessão (contagem)" },
    ],
    subStatus: { plano: ["Plano parcial", "Aguardando 2ª sessão"], fechou: ["Série 1/3", "Série 2/3", "Série completa"] },
    interessesSDR: ["Rosto", "Corpo", "Pele"],
    pagamento: { pixDesc: 5, maxParcelas: 10 },
    descMax: { closer: 5, medico: 0, gestao: 100 },
    creditos3D: [],
  };

  /* =====================================================================
     ODONTOLOGIA (id "odonto") · odontograma oclusal FDI + sorriso
     ===================================================================== */
  const TIPO_N = { 1: "incisivo", 2: "incisivo", 3: "canino", 4: "premolar", 5: "premolar", 6: "molar", 7: "molar", 8: "molar" };
  const NOME_N = { 1: "Incisivo central", 2: "Incisivo lateral", 3: "Canino", 4: "1º pré-molar", 5: "2º pré-molar", 6: "1º molar", 7: "2º molar", 8: "3º molar" };
  const Q = { 1: ["superior", "direito"], 2: ["superior", "esquerdo"], 3: ["inferior", "esquerdo"], 4: ["inferior", "direito"] };
  const SORRISO = ["d13", "d12", "d11", "d21", "d22", "d23", "d43", "d42", "d41", "d31", "d32", "d33"];
  const procsDoDente = n => n === 8 ? ["extracao-siso", "rest", "a-definir"]
    : n >= 6 ? ["rest", "endo-mol", "coroa", "onlay", "extracao", "implante", "a-definir"]
    : n >= 4 ? ["rest", "endo-pm", "coroa", "lente", "faceta", "extracao", "implante", "a-definir"]
    : ["lente", "faceta", "rest", "contorno-gengival", "endo-ant", "coroa", "extracao", "implante", "a-definir"];
  const odontoDentes = [];
  [1, 2, 3, 4].forEach(q => { for (let n = 1; n <= 8; n++) {
    const id = "d" + q + n, [arc, lado] = Q[q];
    odontoDentes.push({
      id, tipo: "dente", fdi: q * 10 + n, quadrante: q, tipoDente: n === 8 ? "terceiroMolar" : TIPO_N[n],
      nome: `${q}${n} · ${NOME_N[n]} ${arc} ${lado}`, nomeCurto: `${q}${n}`,
      arcada: arc === "superior" ? "arcada_sup" : "arcada_inf",
      vista: "odontograma", vistas: SORRISO.includes(id) ? ["odontograma", "sorriso"] : ["odontograma"],
      faces: ["M", "D", "O", "V", "L"], rotFace: { M: "Mesial", D: "Distal", O: n <= 3 ? "Incisal" : "Oclusal", V: "Vestibular", L: arc === "superior" ? "Palatina" : "Lingual" },
      grupo: null, procs: procsDoDente(n),
      beneficio: n <= 3 ? "harmonia do sorriso" : "função e conforto ao mastigar",
    });
  } });
  const odontoAlvos = odontoDentes.concat([
    { id: "arcada_sup", tipo: "arcada", vista: "odontograma", vistas: ["odontograma", "sorriso"], nome: "Arcada superior", procs: ["clareamento", "clareamento-casa", "placa", "protese-total", "protocolo"], beneficio: "sorriso mais claro" },
    { id: "arcada_inf", tipo: "arcada", vista: "odontograma", vistas: ["odontograma", "sorriso"], nome: "Arcada inferior", procs: ["clareamento", "clareamento-casa", "placa", "protese-total", "protocolo"], beneficio: "sorriso mais claro" },
    { id: "boca", tipo: "pacote", vista: null, nome: "Boca toda", procs: ["limpeza", "manut-tri", "alinhadores", "aparelho"], fixo: true, beneficio: "manutenção do tratamento" },
  ]);

  const odontoProcs = [
    { id: "limpeza", nome: "Limpeza e profilaxia", sinonimos: ["Limpeza e profilaxia", "Profilaxia"], familia: "prevencao", unidade: "sessao",
      precoBase: 350, qtdPadrao: 1, alvoFixo: "boca", recall: [{ d: 180, rot: "Manutenção semestral" }] },
    { id: "manut-tri", nome: "Manutenção trimestral", sinonimos: ["Manutenção trimestral"], familia: "prevencao", unidade: "sessao",
      precoBase: 300, qtdPadrao: 1, alvoFixo: "boca", recall: [{ d: 90, rot: "Manutenção trimestral" }] },
    { id: "rest", nome: "Restauração em resina", sinonimos: ["Restauração em resina", "Restauração estética"], familia: "clinico", unidade: "face",
      porFace: true, precoBase: 180, precoFaces: [180, 240, 300], qtdPadrao: 1, recall: [] },
    { id: "endo-ant", nome: "Endodontia · anterior", sinonimos: ["Endodontia · anterior", "Tratamento de canal · anterior"], familia: "clinico", unidade: "dente",
      precoBase: 900, qtdPadrao: 1, recall: [] },
    { id: "endo-pm", nome: "Endodontia · pré-molar", sinonimos: ["Endodontia · pré-molar", "Tratamento de canal · pré-molar"], familia: "clinico", unidade: "dente",
      precoBase: 1100, qtdPadrao: 1, recall: [] },
    { id: "endo-mol", nome: "Endodontia · molar", sinonimos: ["Endodontia · molar", "Tratamento de canal · molar"], familia: "clinico", unidade: "dente",
      precoBase: 1400, qtdPadrao: 1, recall: [] },
    { id: "coroa", nome: "Coroa em cerâmica", sinonimos: ["Coroa em cerâmica", "Coroa cerâmica"], familia: "reabilitacao", unidade: "dente",
      precoBase: 2400, qtdPadrao: 1, recall: [] },
    { id: "onlay", nome: "Onlay em cerâmica", sinonimos: ["Onlay em cerâmica", "Restauração indireta em cerâmica"], familia: "reabilitacao", unidade: "dente",
      precoBase: 1800, qtdPadrao: 1, recall: [] },
    { id: "extracao", nome: "Extração simples", sinonimos: ["Extração simples", "Exodontia simples"], familia: "cirurgia", unidade: "dente",
      precoBase: 300, qtdPadrao: 1, recall: [] },
    { id: "extracao-siso", nome: "Extração · terceiro molar", sinonimos: ["Extração · terceiro molar", "Exodontia · siso"], familia: "cirurgia", unidade: "dente",
      precoBase: 650, qtdPadrao: 1, recall: [], retornoIncluso: 7 },
    { id: "implante", nome: "Implante + coroa", sinonimos: ["Implante + coroa", "Implante com coroa"], familia: "implante", unidade: "dente",
      precoBase: 5800, qtdPadrao: 1, recall: [{ d: 180, rot: "Manutenção semestral" }] },
    { id: "a-definir", nome: "A definir pelo dentista", sinonimos: ["A definir pelo dentista"], familia: "clinico", unidade: "dente",
      precoBase: null, aDefinir: true, qtdPadrao: 1, recall: [] },
    { id: "lente", nome: "Lente de contato dental", sinonimos: ["Lente de contato dental", "Laminado cerâmico"], familia: "estetica", unidade: "dente",
      precoBase: 2200, qtdPadrao: 1, recall: [{ d: 365, rot: "Revisão anual" }] },
    { id: "faceta", nome: "Faceta em resina", sinonimos: ["Faceta em resina", "Faceta direta"], familia: "estetica", unidade: "dente",
      precoBase: 900, qtdPadrao: 1, recall: [{ d: 365, rot: "Revisão anual" }] },
    { id: "contorno-gengival", nome: "Contorno gengival estético", sinonimos: ["Contorno gengival estético", "Plástica gengival"], familia: "estetica", unidade: "dente",
      precoBase: 400, qtdPadrao: 1, recall: [] },
    { id: "clareamento", nome: "Clareamento · consultório", sinonimos: ["Clareamento · consultório", "Clareamento em consultório"], familia: "estetica", unidade: "arcada",
      precoBase: 700, qtdPadrao: 1, recall: [{ d: 365 }] },
    { id: "clareamento-casa", nome: "Clareamento · caseiro", sinonimos: ["Clareamento · caseiro", "Clareamento supervisionado"], familia: "estetica", unidade: "arcada",
      precoBase: 450, qtdPadrao: 1, recall: [{ d: 365 }] },
    { id: "placa", nome: "Placa de proteção noturna", sinonimos: ["Placa de proteção noturna", "Placa miorrelaxante"], familia: "clinico", unidade: "arcada",
      precoBase: 900, qtdPadrao: 1, recall: [{ d: 365, rot: "Revisão anual" }] },
    { id: "protese-total", nome: "Prótese total · arcada", sinonimos: ["Prótese total · arcada"], familia: "reabilitacao", unidade: "arcada",
      precoBase: 3500, qtdPadrao: 1, recall: [{ d: 365, rot: "Revisão anual" }] },
    { id: "protocolo", nome: "Protocolo sobre implantes · arcada", sinonimos: ["Protocolo sobre implantes · arcada", "Prótese fixa sobre implantes"], familia: "implante", unidade: "arcada",
      precoBase: 28000, qtdPadrao: 1, recall: [{ d: 180, rot: "Manutenção semestral" }] },
    { id: "alinhadores", nome: "Alinhadores · plano mensal", sinonimos: ["Alinhadores · plano mensal", "Alinhadores transparentes"], familia: "ortodontia", unidade: "mes",
      precoBase: 650, qtdPadrao: 18, recorrenteMensal: true, alvoFixo: "boca", recall: [] },
    { id: "aparelho", nome: "Aparelho ortodôntico · mensalidade", sinonimos: ["Aparelho ortodôntico · mensalidade", "Ortodontia · mensalidade"], familia: "ortodontia", unidade: "mes",
      precoBase: 250, qtdPadrao: 24, recorrenteMensal: true, alvoFixo: "boca", recall: [] },
  ];

  const odonto = {
    id: "odonto", rot: "Odontologia", nome: "Odontologia", nomeLongo: "Odontologia", estado: "ativo",
    revisadoLGPD: REVISAO, ico: "dente",
    vistas: [
      { id: "odontograma", rot: "Odontograma", desenho: "odontograma", svg: "DES.odontograma", padrao: true },
      { id: "sorriso",     rot: "Sorriso",     desenho: "sorriso",     svg: "DES.sorriso" },
    ],
    abas: [{ id: "odontograma", rot: "Odontograma", vistas: ["odontograma"] }, { id: "sorriso", rot: "Sorriso", vistas: ["sorriso"] }],
    escopos: [
      { id: "dente", rot: "Dente" },
      { id: "arcada", rot: "Arcada", alvos: ["arcada_sup", "arcada_inf"] },
      { id: "sorriso", rot: "Sorriso", alvos: SORRISO },
    ],
    // Fase 1/2/3 + título comercial em lista fechada (nunca "aliviar a dor")
    titulosFase: ["Prioridade", "Reabilitação", "Estética"],
    grupos: [
      { id: "fase-1", nome: "Fase 1", titulo: "Prioridade" },
      { id: "fase-2", nome: "Fase 2", titulo: "Reabilitação" },
      { id: "fase-3", nome: "Fase 3", titulo: "Estética" },
    ],
    alvos: odontoAlvos,
    procedimentos: odontoProcs,
    combos: [
      { id: "lentes6", nome: "Sorriso · 6 lentes (13 a 23)", itens: ["d13", "d12", "d11", "d21", "d22", "d23"].map(d => [d, "lente", 1]), preco: 12000 },
      { id: "lentes10", nome: "Sorriso · 10 lentes (15 a 25)", itens: ["d15", "d14", "d13", "d12", "d11", "d21", "d22", "d23", "d24", "d25"].map(d => [d, "lente", 1]), preco: 19000 },
      { id: "clareamento2", nome: "Clareamento · duas arcadas", itens: [["arcada_sup", "clareamento", 1], ["arcada_inf", "clareamento", 1]], preco: 1200 },
      { id: "clareamento-combo", nome: "Clareamento consultório + caseiro", itens: [["arcada_sup", "clareamento", 1], ["arcada_inf", "clareamento", 1], ["arcada_sup", "clareamento-casa", 1], ["arcada_inf", "clareamento-casa", 1]], preco: 1900 },
    ],
    familias: [
      { id: "prevencao", rot: "Prevenção" }, { id: "clinico", rot: "Clínico" }, { id: "reabilitacao", rot: "Reabilitação" },
      { id: "implante", rot: "Implantes" }, { id: "estetica", rot: "Estética" }, { id: "ortodontia", rot: "Ortodontia" }, { id: "cirurgia", rot: "Cirurgia" },
    ],
    kpis: [
      { id: "aceitacao",      rot: "Aceitação do plano",   desc: "R$ aceito ÷ R$ apresentado, por plano" },
      { id: "aExecutar",      rot: "Receita a executar",   desc: "R$ aceito ainda não realizado" },
      { id: "fasesAprovadas", rot: "Fases aceitas",        desc: "planos com Fase 1, 2 e 3 aceitas (contagem)" },
      { id: "manutencao",     rot: "Manutenção em dia",    desc: "pacientes com manutenção trimestral ou semestral no prazo (contagem)" },
      { id: "porRegiao",      rot: "Por região",           desc: "arcada e quadrante → propostos, aceitos, R$ (contagens, sem %)" },
    ],
    subStatus: { plano: ["Fase 1 apresentada", "Aguardando decisão"], fechou: ["Fase 1 aceita", "Fase 2 aceita", "Em execução", "Plano concluído"] },
    motivosPendencia: ["Preço", "Vai pensar", "Vai comparar", "Decide com outra pessoa", "Sem tempo agora"],
    interessesSDR: ["Sorriso", "Implante", "Ortodontia", "Clínico"],
    mapaSoPlanoAtual: true,   // itens de planos antigos não são desenhados (vão para "Planos anteriores · R$")
    pagamento: { pixDesc: 5, maxParcelas: 12 },
    descMax: { closer: 5, medico: 0, gestao: 100 },
    creditos3D: [],
  };

  /* ---------- Em breve (só nome e vistas previstas) ---------- */
  const breve = (id, nome, vistasPrevistas, ico) => ({ id, rot: nome, nome, estado: "em_breve", vistasPrevistas, ico, vistas: [], alvos: [], procedimentos: [], combos: [] });
  const PACOTES = {
    dermato, odonto,
    otorrino: breve("otorrino", "Otorrino", ["Cabeça de perfil", "Orelha (lupa)"], "perfil"),
    geral:    breve("geral", "Clínica geral e check-up", ["Montador de pacote", "Linha do tempo de 12 meses"], "pacote"),
    plastica: breve("plastica", "Cirurgia plástica", ["Corpo · frente e costas", "Etapas e validade do orçamento"], "corpo"),
    laser:    breve("laser", "Depilação a laser", ["Corpo · regiões × sessões"], "corpo"),
    capilar:  breve("capilar", "Tricologia e capilar", ["Couro cabeludo"], "capilar"),
  };
  const ORDEM = ["dermato", "odonto", "otorrino", "geral", "plastica", "laser", "capilar"];

  /* ---------- Índices e ajudantes ---------- */
  ORDEM.forEach(k => {
    const p = PACOTES[k];
    p._alvo = {}; p.alvos.forEach(a => (p._alvo[a.id] = a));
    p._proc = {}; p.procedimentos.forEach(x => (p._proc[x.id] = x));
    p._grupo = {}; (p.grupos || []).forEach(g => (p._grupo[g.id] = g));
  });
  const get = id => PACOTES[id] || null;
  const alvo = (pac, id) => (typeof pac === "string" ? get(pac) : pac)._alvo[id] || null;
  const procBase = (pac, id) => (typeof pac === "string" ? get(pac) : pac)._proc[id] || null;
  const vistaDe = (pac, id) => (typeof pac === "string" ? get(pac) : pac).vistas.find(v => v.id === id) || null;
  // ids de desenho que um item acende (par quando lado = "bi")
  function alvosDoItem(pac, item) {
    const a = alvo(pac, item.alvo); if (!a) return [];
    if (a.tipo !== "regiao" && a.tipo !== "dente" && a.tipo !== "arcada") return [];
    return item.lado === "bi" && a.par ? [a.id, a.par] : [a.id];
  }
  function nomeAlvo(pac, item) {
    const a = alvo(pac, typeof item === "string" ? item : item.alvo); if (!a) return "";
    if (!a.par) return a.nome;
    const lado = typeof item === "string" ? a.lado : (item.lado === "bi" ? "bi" : a.lado);
    return lado === "bi" ? a.nomePar : `${a.nomePar} · ${lado === "E" ? "esquerdo" : "direito"}`;
  }
  // quantidade padrão de um procedimento num alvo (aceita chave do id, do par sem sufixo, ou "_")
  function qtdPadrao(proc, alvoId) {
    const q = proc.qtdPadrao;
    if (q == null) return 1;
    if (typeof q === "number") return q;
    const base = String(alvoId || "").replace(/_(e|d)$/, "");
    return q[alvoId] != null ? q[alvoId] : q[base] != null ? q[base] : q._ != null ? q._ : 1;
  }

  /* ---------- Ajustes da clínica (localStorage, sempre com try/catch) ---------- */
  const K_PAC = "munin:pacotes", K_TAB = p => "munin:tabela:" + p;
  const PADRAO_CFG = {
    ativos: ["dermato", "odonto"],
    uso: { d: ["dermato"], g: ["dermato"], o: ["odonto"], closer: ["dermato", "odonto"] },
    padrao: { d: "dermato", g: "dermato", o: "odonto", closer: "dermato" },
    prontuario: "https://prontuario.exemplo.com.br/paciente/{id}",
  };
  const ler = (k, def) => { try { const v = JSON.parse(W.localStorage.getItem(k) || "null"); return v == null ? def : v; } catch (e) { return def; } };
  const gravar = (k, v) => { try { W.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  function config() {
    const s = ler(K_PAC, null) || {};
    const c = JSON.parse(JSON.stringify(PADRAO_CFG));
    if (Array.isArray(s.ativos)) c.ativos = s.ativos.filter(k => PACOTES[k] && PACOTES[k].estado === "ativo");
    ["uso", "padrao"].forEach(k => { if (s[k] && typeof s[k] === "object") Object.assign(c[k], s[k]); });
    if (typeof s.prontuario === "string") c.prontuario = s.prontuario;
    return c;
  }
  const salvaConfig = c => gravar(K_PAC, c);
  const ativos = () => config().ativos.map(get).filter(Boolean);
  const doMedico = med => get(config().padrao[med]) || (ativos()[0] || dermato);
  const linkProntuario = id => config().prontuario.replace("{id}", encodeURIComponent(id));

  // Tabela de preços: {procs: {id: {precoBase, precoAdicional, precoFaces, qtdPadrao, recallD, ativo, nome}}, combos: {id: {preco}}, pagamento, descMax}
  const tabelaSalva = pacId => ler(K_TAB(pacId), null);
  const salvaTabela = (pacId, t) => gravar(K_TAB(pacId), t);
  const limpaTabela = pacId => { try { W.localStorage.removeItem(K_TAB(pacId)); return true; } catch (e) { return false; } };
  // procedimento efetivo = base do pacote + o que a clínica salvou (o nome só muda para um sinônimo aprovado)
  function proc(pac, id, tab) {
    const P = typeof pac === "string" ? get(pac) : pac, b = P._proc[id]; if (!b) return null;
    const t = tab === undefined ? tabelaSalva(P.id) : tab;
    const o = t && t.procs && t.procs[id]; if (!o) return Object.assign({ ativo: true }, b);
    const r = Object.assign({ ativo: true }, b);
    if (typeof o.precoBase === "number" && o.precoBase >= 0 && !b.aDefinir) r.precoBase = o.precoBase;
    if (typeof o.precoAdicional === "number" && o.precoAdicional >= 0) r.precoAdicional = o.precoAdicional;
    if (Array.isArray(o.precoFaces) && o.precoFaces.length === 3) r.precoFaces = o.precoFaces.map(Number);
    if (typeof o.qtdPadrao === "number" && o.qtdPadrao > 0) r.qtdPadrao = o.qtdPadrao;
    if (typeof o.recallD === "number") r.recall = o.recallD > 0 ? [Object.assign({}, b.recall[0] || {}, { d: o.recallD })].concat(b.recall.slice(1)) : [];
    if (typeof o.ativo === "boolean") r.ativo = o.ativo;
    if (o.nome && b.sinonimos && b.sinonimos.includes(o.nome)) r.nome = o.nome;
    return r;
  }
  function combo(pac, id, tab) {
    const P = typeof pac === "string" ? get(pac) : pac, b = P.combos.find(c => c.id === id); if (!b) return null;
    const t = tab === undefined ? tabelaSalva(P.id) : tab, o = t && t.combos && t.combos[id];
    return Object.assign({}, b, o && typeof o.preco === "number" ? { preco: o.preco } : {}, o && typeof o.ativo === "boolean" ? { ativo: o.ativo } : {});
  }
  function pagamento(pac, tab) {
    const P = typeof pac === "string" ? get(pac) : pac, t = tab === undefined ? tabelaSalva(P.id) : tab;
    return { pagamento: Object.assign({}, P.pagamento, t && t.pagamento), descMax: Object.assign({}, P.descMax, t && t.descMax) };
  }

  W.PAC = {
    REVISAO, UNIDADES, TERMOS_SENSIVEIS, sensivel, PACOTES, ORDEM, SORRISO,
    get, lista: () => ORDEM.map(get), alvo, procBase, proc, combo, pagamento, vistaDe, alvosDoItem, nomeAlvo, qtdPadrao,
    config, salvaConfig, ativos, doMedico, linkProntuario, tabelaSalva, salvaTabela, limpaTabela,
    K_PAC, K_TAB,
  };
})();
