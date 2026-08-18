// `**word**` inside quote text marks the highlighted span (rendered as a
// marker/highlight box) — matches the approved design concept, where only
// part of each pull-quote gets the treatment, not the whole line.
export type Block =
  | { type: "body"; text: string }
  | { type: "quoteHighlight"; text: string }
  | { type: "quoteSerif"; text: string }
  | { type: "stats"; items: { value: string; label: string }[] }
  | { type: "chapter"; label: string; num: string }
  | { type: "paper"; tag?: string; paragraphs: string[] };

export const MANIFESTO_INTRO =
  "Tenho 23 anos e treze de ofício. Comecei cedo demais pra ter currículo bonito e cedo o bastante pra ter feito quase tudo pelo menos uma vez.";

export const MANIFESTO_PAPER =
  "Ainda não sei responder rápido. Cada empresa esconde a coisa real num lugar diferente e achar dá trabalho. É a parte de que eu gosto, e é por onde eu entro. A direção vem depois, e vem fácil quando a pergunta certa já foi feita.";

export const MANIFESTO_OUTRO =
  "Por isso eu evito trabalho de calendário. Não me interessa entrar em projeto onde a linguagem já foi decidida, nem em marca que quer parecer diferente sem mexer no que a faz parecer igual.";

export const MANIFESTO_CLOSER = "Se você tem um **negócio bom** e uma imagem genérica, esse é o meu assunto.";

export const BLOCKS: Block[] = [
  { type: "chapter", label: "Origem", num: "01" },
  {
    type: "body",
    text: "Aos dez anos eu gravava a mim mesmo jogando. Igual a alguns milhões de crianças naquela época. O canal chegou a duzentos inscritos, número que na ocasião me pareceu enorme.",
  },
  { type: "quoteHighlight", text: "O jogo durou pouco. **O que ficou foi o programa.**" },
  {
    type: "body",
    text: "Aos catorze eu já operava After Effects sozinho, aprendendo em tutorial de gringo com legenda automática errada, refazendo a mesma composição quinze vezes até entender por que a primeira não tinha funcionado. No ano seguinte descobri que aquilo valia dinheiro: comecei a vender ilustração pra gente que eu nunca ia conhecer, em países que eu nunca tinha visitado. Recebia pouco e tratava como a coisa mais séria do mundo.",
  },

  { type: "chapter", label: "Técnico e quartel", num: "02" },
  {
    type: "body",
    text: "Enquanto isso fiz ensino médio técnico em informática, no interior do Rio Grande do Sul. Não virei nada de tecnologia. O que ficou foi outra coisa: perdi o medo de abrir qualquer ferramenta e parei de esperar que alguém me explicasse. Até hoje é assim que eu aprendo tudo.",
  },
  {
    type: "body",
    text: "Terminado o técnico, fui pro quartel. Dez meses. Entrei sem fazer ideia do que ia fazer lá e acabei no estúdio, filmando formatura, instrução, rotina de tropa. Aprendi mais sobre disciplina de produção em dez meses de caserna do que em qualquer set. Quando você tem uma hora, uma câmera e ninguém pra segurar refletor, você para de discutir ideia e resolve.",
  },
  {
    type: "stats",
    items: [
      { value: "10", label: "Meses de quartel" },
      { value: "9", label: "Anos de prática ao sair" },
      { value: "19", label: "Idade ao sair" },
    ],
  },

  { type: "chapter", label: "Volta pra Floripa", num: "03" },
  {
    type: "body",
    text: "Saí de lá com 19 anos e uma conta simples na cabeça: eu tinha nove anos de prática e nenhum diploma que provasse isso, e o único lugar onde aquilo valia alguma coisa era um mercado maior que o interior. Voltei pra Florianópolis pra viver do que eu sabia fazer. Não tinha reserva, não tinha cliente e não tinha plano B. Tinha a certeza de que aquilo era a única coisa que eu ia levar a sério a vida inteira, e apostei nisso.",
  },
  { type: "quoteSerif", text: "Não tinha reserva, não tinha cliente e **não tinha plano B**." },
  {
    type: "body",
    text: "De volta, comecei História. Não terminei. Ficou a única coisa de que eu precisava: historiador não pergunta o que o documento diz, pergunta quem escreveu, pra quem, e o que ficou de fora de propósito. É uma desconfiança treinada. Você para de ler o que está na página e começa a ler a decisão que colocou aquilo ali.",
  },

  { type: "chapter", label: "Toyota", num: "04" },
  {
    type: "body",
    text: "Meses depois eu já estava dentro do marketing de uma concessionária Toyota, olhando anúncio exatamente assim. Quem aprovou isso, com medo de quê, o que foi cortado no caminho. Quase sempre a resposta explicava mais do que a peça.",
  },
  {
    type: "body",
    text: "Yaris, Hilux, Corolla Sedan. Assistente primeiro, analista depois. Mas antes de qualquer título, foi plotagem de para-brisa às seis da manhã no estacionamento, material de evento separado em caixa, foto de banner pra comprovar mídia. Quem já montou o estande sabe o que acontece com uma ideia entre a reunião e o asfalto.",
  },
  {
    type: "body",
    text: "Foi ali que eu ouvi, numa reunião, que a gente não tinha que fazer evento, tinha que vender.",
  },
  {
    type: "body",
    text: "Não soube responder. A frase parecia certa e me incomodava, e levei quase um ano pra entender que a pessoa estava certa no objetivo e errada na conta.",
  },

  { type: "chapter", label: "Retenção Day", num: "05" },
  {
    type: "body",
    text: "A resposta apareceu no Retenção Day. Agendamento, lead e call center sentados juntos, telefone o dia inteiro, brinde empilhado na mesa e uma energia que eu nunca tinha visto naquele prédio. Cinco mil ligações. Quatrocentas retenções a mais. Eu produzi o filme daquilo, e ele funcionou de um jeito que os bonitos nunca funcionaram.",
  },
  {
    type: "stats",
    items: [
      { value: "5.000", label: "Ligações" },
      { value: "+400", label: "Retenções" },
    ],
  },
  {
    type: "quoteSerif",
    text: "Não tinha luz, não tinha trilha épica, não tinha nada que eu pudesse pendurar num reel. **Tinha gente trabalhando.**",
  },

  { type: "chapter", label: "Hoje", num: "06" },
  {
    type: "body",
    text: "Levei essa mania comigo quando saí do automotivo. Hoje trabalho numa marca de coloração capilar, entre profissional de salão e consumidora final. Outro planeta. Em 2025 precisei anunciar o salão que ganhou uma viagem a Paris, e o que acabou na tela foi uma bisnaga de tinta virando Torre Eiffel. Levei aquilo tão a sério quanto o filme institucional, e aprendi ali que setor nenhum é menos exigente, só é diferente.",
  },
  {
    type: "body",
    text: "Duas empresas, dois mundos que não se falam, e a mesma cena nos dois. A empresa é boa. O produto aguenta comparação. O cliente volta.",
  },
  { type: "quoteHighlight", text: "E o material público **poderia ter o logo trocado** sem ninguém notar." },
  {
    type: "paper",
    tag: "// O QUE FICA DE FORA",
    paragraphs: [
      "Não é falta de produção. Elas produzem muito. É que ninguém para pra perguntar o que aquilo está dizendo antes de mandar fazer mais.",
      "Reparo nisso porque nunca fui o fornecedor de fora. Sempre fui quem recebe o vídeo pronto, aprova o orçamento e responde depois quando não dá certo.",
    ],
  },
];

export const FINAL_QUOTE =
  "Isso **estraga você pra sempre**. Não consigo mais assistir a um filme institucional sem imaginar a reunião que o produziu.";
