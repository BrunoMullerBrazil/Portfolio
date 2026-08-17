import type { Translated } from "./LanguageContext";

// Centralized dictionary for standalone UI copy (nav, headings, buttons).
// Per-item data (portfolio projects, services, contact links) keeps its
// pt/en fields inline in its own component instead, right next to the
// rest of that item's data.
export const dict = {
  siteTitle: { pt: "Bruno Müller — Direção e Edição de Vídeo", en: "Bruno Müller — Video Direction & Editing" },

  navWork: { pt: "Portfólio", en: "Work" },
  navAbout: { pt: "Sobre", en: "About" },
  navContact: { pt: "Contato", en: "Contact" },

  heroGreeting1: { pt: "Oi,", en: "Hi," },
  heroGreeting2: { pt: "eu sou", en: "I'm" },
  heroGreeting3: { pt: "Bruno", en: "Bruno" },
  heroRoleLine: { pt: "Florianópolis · Brasil", en: "Florianópolis · Brazil" },
  heroRoleName: { pt: "Brand film para todos", en: "Brand film for all" },
  heroScrollCue: { pt: "role para baixo", en: "scroll down" },

  workIntroEyebrow: { pt: "Portfólio", en: "Portfolio" },
  workIntroHeading: { pt: "Veja o trabalho.", en: "See the work." },
  workIntroNumSuffix: { pt: " — Projeto", en: " — Project" },
  filterAll: { pt: "Todos", en: "All" },
  filterBrandFilm: { pt: "Brand Film", en: "Brand Film" },
  filterInstitucional: { pt: "Institucional", en: "Institutional" },
  filterBts: { pt: "Making Of & BTS", en: "Making Of & BTS" },
  filterMotion: { pt: "Motion", en: "Motion" },

  aboutEyebrow: { pt: "Sobre", en: "About" },
  aboutText1Strong: { pt: "Direção, câmera e edição", en: "Direction, camera and editing" },
  aboutText1Rest: {
    pt: " para marcas, empresas e projetos que precisam de presença audiovisual com critério.",
    en: " for brands, companies and projects that need audiovisual presence done right.",
  },
  aboutText2Pre: {
    pt: "Trabalho em Florianópolis e de forma remota em projetos de ",
    en: "I work in Florianópolis and remotely on ",
  },
  aboutText2Strong: { pt: "brand film", en: "brand film" },
  aboutText2Rest: {
    pt: ", making of, motion e editorial, do briefing à entrega.",
    en: ", making of, motion and editorial projects — from brief to delivery.",
  },
  aboutTrajButton: { pt: "Minha trajetória", en: "My journey" },
  statYears: { pt: "Anos de experiência", en: "Years of experience" },
  statProjects: { pt: "Projetos entregues", en: "Projects delivered" },
  statRemote: { pt: "Remoto disponível", en: "Remote available" },

  servicesEyebrow: { pt: "Serviços", en: "Services" },
  servicesCta: { pt: "Vamos conversar", en: "Let's talk" },

  ariaWatch: { pt: "Assistir", en: "Watch" },
  ariaPrev: { pt: "Anterior", en: "Previous" },
  ariaNext: { pt: "Próximo", en: "Next" },

  whatsappLabel: { pt: "Fale comigo", en: "Message me" },
  whatsappMessage: {
    pt: "Oi, Bruno. Vim pelo teu portfólio — tenho um projeto em mente e queria trocar uma ideia.",
    en: "Hi Bruno. I found you through your portfolio — I have a project in mind and would love to chat.",
  },
} as const satisfies Record<string, Translated>;
