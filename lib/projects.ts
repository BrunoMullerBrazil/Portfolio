import type { Translated } from "@/lib/LanguageContext";

/*
 * Every audiovisual project on the site, in one list.
 *  - the home stage (WorkIntro) shows the featured ones (featured !== false)
 *  - "Ver todos os trabalhos" (WorksArchive) shows all of them
 * To add a project to the archive only, append it with `featured: false`.
 */

export type Project = {
  id: number;
  num: string;
  name: Translated;
  client: string;
  year: string;
  desc: Translated;
  tags: Translated;
  filter: "brand-film" | "bts" | "motion" | "institucional";
  vimeoId: string;
  orientation: "horizontal" | "vertical";
  // false = archive only (not in the home stage). Omitted = featured.
  featured?: boolean;
};

// Fixed card format (never vary): título, "Cliente • Ano", uma descrição
// curta (a decisão de direção + o que ela resolveu), créditos. Entries
// without copy yet are left blank on purpose.
//
// `name`/`client`/`year` aren't translated (real campaign titles and
// proper nouns/numbers) — only `desc`/`tags` have an English version.
export const PROJECTS: Project[] = [
  {
    id: 6,
    num: "01",
    name: { pt: "Vídeo Tráfego Dinâmico", en: "Vídeo Tráfego Dinâmico" },
    client: "Gloss Company",
    year: "2026",
    desc: { pt: "", en: "" },
    tags: { pt: "Brand film", en: "Brand film" },
    filter: "brand-film",
    vimeoId: "1222793243",
    orientation: "vertical",
  },
  {
    id: 1,
    num: "02",
    name: {
      pt: "Gloss na Estrada — Transição Floripa–Curitiba",
      en: "Gloss na Estrada — Transição Floripa–Curitiba",
    },
    client: "Gloss Express",
    year: "2025",
    desc: {
      pt: "Sistema de transições que transforma a viagem entre Florianópolis e Curitiba em passagem narrativa.",
      en: "A transition system that turns the trip between Florianópolis and Curitiba into a narrative passage.",
    },
    tags: {
      pt: "Motion design, composição, edição audiovisual",
      en: "Motion design, compositing, video editing",
    },
    filter: "motion",
    vimeoId: "1218890209",
    orientation: "horizontal",
  },
  {
    id: 2,
    num: "03",
    name: { pt: "Motion Outubro Gloss", en: "Motion Outubro Gloss" },
    client: "Gloss Express",
    year: "2025",
    desc: {
      pt: "Direção que transformou a bisnaga Gloss em Torre Eiffel, revelando a vencedora e seu prêmio: Paris.",
      en: "Direction that turned the Gloss tube into the Eiffel Tower, revealing the winner and her prize: Paris.",
    },
    tags: { pt: "Motion, storytelling, direção", en: "Motion, storytelling, direction" },
    filter: "motion",
    vimeoId: "1218434521",
    orientation: "horizontal",
  },
  {
    id: 3,
    num: "04",
    name: { pt: "Institucional Retenção Day Toyota", en: "Institucional Retenção Day Toyota" },
    client: "Hai Toyota",
    year: "2025",
    desc: {
      pt: "Direção que priorizou a mobilização real das equipes — e transformou a ação em prova institucional.",
      en: "Direction that prioritized the team's real mobilization — turning the initiative into institutional proof.",
    },
    tags: { pt: "Direção, montagem, cor, captação", en: "Direction, editing, color grading, filming" },
    filter: "institucional",
    vimeoId: "1218901316",
    orientation: "horizontal",
  },
  {
    id: 4,
    num: "05",
    name: { pt: "Vídeo Promocional Campanha", en: "Vídeo Promocional Campanha" },
    client: "",
    year: "2026",
    desc: {
      pt: "Introdução dos benefícios da campanha para clientes B2B.",
      en: "An introduction to the campaign's benefits for B2B clients.",
    },
    tags: { pt: "Motion, tráfego pago", en: "Motion, paid traffic" },
    filter: "motion",
    vimeoId: "1218435106",
    orientation: "vertical",
  },
  {
    id: 5,
    num: "06",
    name: { pt: "Vídeo Institucional para LP Tráfego", en: "Vídeo Institucional para LP Tráfego" },
    client: "Gloss Company",
    year: "2025",
    desc: { pt: "", en: "" },
    tags: { pt: "Institucional, brand film", en: "Institutional, brand film" },
    filter: "institucional",
    vimeoId: "1218435477",
    orientation: "horizontal",
  },
  {
    id: 7,
    num: "07",
    name: { pt: "Vídeo Reel Viral Depoimento", en: "Vídeo Reel Viral Depoimento" },
    client: "Gloss Company",
    year: "2026",
    desc: { pt: "", en: "" },
    tags: { pt: "Depoimento, reel", en: "Testimonial, reel" },
    filter: "brand-film",
    vimeoId: "1222794098",
    orientation: "vertical",
  },
  {
    id: 8,
    num: "08",
    name: { pt: "Chamada para Campanha Prêmio B2B", en: "Chamada para Campanha Prêmio B2B" },
    client: "Gloss Company",
    year: "2026",
    desc: { pt: "", en: "" },
    tags: { pt: "Campanha B2B, chamada", en: "B2B campaign, call-to-action" },
    filter: "brand-film",
    vimeoId: "1222795141",
    orientation: "vertical",
  },
  {
    id: 9,
    num: "09",
    name: { pt: "WhatsApp Bundle", en: "WhatsApp Bundle" },
    client: "",
    year: "",
    desc: { pt: "", en: "" },
    tags: { pt: "", en: "" },
    filter: "brand-film",
    vimeoId: "1222803437",
    orientation: "horizontal",
  },
];
