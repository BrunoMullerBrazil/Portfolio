import type { Translated } from "./LanguageContext";

// Centralized dictionary for standalone UI copy (nav, headings, buttons).
// Per-item data (portfolio projects, services, contact links) keeps its
// pt/en fields inline in its own component instead, right next to the
// rest of that item's data.
//
// `en` is currently a placeholder copy of `pt` everywhere — real English
// copy gets swapped in here later (translated externally), no code
// changes needed beyond editing the `en` values below.
export const dict = {
  navWork: { pt: "Portfólio", en: "Portfólio" },
  navAbout: { pt: "Sobre", en: "Sobre" },
  navContact: { pt: "Contato", en: "Contato" },

  heroGreeting1: { pt: "Oi,", en: "Oi," },
  heroGreeting2: { pt: "eu sou", en: "eu sou" },
  heroGreeting3: { pt: "Bruno", en: "Bruno" },
  heroRoleLine: { pt: "Florianópolis · Brasil", en: "Florianópolis · Brasil" },
  heroRoleName: { pt: "Brand film para todos", en: "Brand film para todos" },
  heroScrollCue: { pt: "role para baixo", en: "role para baixo" },

  workIntroEyebrow: { pt: "Portfólio", en: "Portfólio" },
  workIntroHeading: { pt: "Veja o trabalho.", en: "Veja o trabalho." },
  workIntroNumSuffix: { pt: " — Projeto", en: " — Projeto" },
  filterAll: { pt: "Todos", en: "Todos" },
  filterBrandFilm: { pt: "Brand Film", en: "Brand Film" },
  filterInstitucional: { pt: "Institucional", en: "Institucional" },
  filterBts: { pt: "Making Of & BTS", en: "Making Of & BTS" },
  filterMotion: { pt: "Motion", en: "Motion" },

  aboutEyebrow: { pt: "Sobre", en: "Sobre" },
  aboutText1Strong: { pt: "Direção, câmera e edição", en: "Direção, câmera e edição" },
  aboutText1Rest: {
    pt: " para marcas, empresas e projetos que precisam de presença audiovisual com critério.",
    en: " para marcas, empresas e projetos que precisam de presença audiovisual com critério.",
  },
  aboutText2Pre: {
    pt: "Trabalho em Florianópolis e de forma remota em projetos de ",
    en: "Trabalho em Florianópolis e de forma remota em projetos de ",
  },
  aboutText2Strong: { pt: "brand film", en: "brand film" },
  aboutText2Rest: {
    pt: ", making of, motion e editorial, do briefing à entrega.",
    en: ", making of, motion e editorial, do briefing à entrega.",
  },
  aboutTrajButton: { pt: "Minha trajetória", en: "Minha trajetória" },
  statYears: { pt: "Anos de experiência", en: "Anos de experiência" },
  statProjects: { pt: "Projetos entregues", en: "Projetos entregues" },
  statRemote: { pt: "Remoto disponível", en: "Remoto disponível" },

  servicesEyebrow: { pt: "Serviços", en: "Serviços" },
  servicesCta: { pt: "Vamos conversar", en: "Vamos conversar" },

  ariaWatch: { pt: "Assistir", en: "Assistir" },
  ariaPrev: { pt: "Anterior", en: "Anterior" },
  ariaNext: { pt: "Próximo", en: "Próximo" },

  whatsappLabel: { pt: "Fale comigo", en: "Fale comigo" },
  whatsappMessage: {
    pt: "Oi, Bruno. Vim pelo teu portfólio — tenho um projeto em mente e queria trocar uma ideia.",
    en: "Oi, Bruno. Vim pelo teu portfólio — tenho um projeto em mente e queria trocar uma ideia.",
  },
} as const satisfies Record<string, Translated>;
