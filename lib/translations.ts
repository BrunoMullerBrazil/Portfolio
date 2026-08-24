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
  heroSubtitle: {
    pt: "Direção audiovisual para marcas que valem mais do que parecem.",
    en: "The gap between what a company is and how it reads.",
  },
  heroRoleLine: { pt: "Florianópolis · Brasil", en: "Florianópolis · Brazil" },
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
  aboutPara1: {
    pt: "Presença audiovisual com critério, para marcas, empresas e projetos.",
    en: "I work on the gap between what a company is and how it reads. Most of it gets decided before the camera — in what the piece chooses not to say.",
  },
  aboutPara2: {
    pt: "Direção, câmera e edição em projetos de brand film, making of, motion e editorial — do briefing à entrega. Florianópolis e remoto.",
    en: "Brand film, motion and editorial work, from brief to delivery. In-house content strategy and direction at Gloss Express; previously marketing and audiovisual at a Toyota dealer group.",
  },
  // PT stays two paragraphs — this third block only renders when non-empty.
  aboutPara3: {
    pt: "",
    en: "Based in Florianópolis, Brazil — one hour ahead of EST. Available for remote contract work.",
  },
  aboutTrajButton: { pt: "Minha trajetória", en: "My journey" },
  statYears: { pt: "Anos de experiência", en: "Years of experience" },
  statRemoteValue: { pt: "BR", en: "UTC-3" },
  statRemote: { pt: "Remoto disponível", en: "Remote available" },

  servicesEyebrow: { pt: "Serviços", en: "Services" },
  servicesCta: { pt: "Vamos conversar", en: "Let's talk" },

  ariaWatch: { pt: "Assistir", en: "Watch" },
  ariaPrev: { pt: "Anterior", en: "Previous" },
  ariaNext: { pt: "Próximo", en: "Next" },
  ariaFullscreen: { pt: "Tela cheia", en: "Fullscreen" },
  ariaExitFullscreen: { pt: "Sair da tela cheia", en: "Exit fullscreen" },

  whatsappLabel: { pt: "Fale comigo", en: "Message me" },
  whatsappMessage: {
    pt: "Oi, Bruno. Vim pelo teu portfólio — tenho um projeto em mente e queria trocar uma ideia.",
    en: "Hi Bruno. I found you through your portfolio — I have a project in mind and would love to chat.",
  },
} as const satisfies Record<string, Translated>;
