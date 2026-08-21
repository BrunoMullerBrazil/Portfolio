// Placeholder content only — real project images/copy come later. Every
// title/description here is a stand-in so the grid + lightbox layout can
// be reviewed before any real design work is wired in.
export type DesignCategory = "carrossel" | "brandbook";

export type DesignItem = {
  id: number;
  category: DesignCategory;
  title: string;
  description: string;
  // Carrossel only — how many placeholder slides the expanded view shows.
  slideCount?: number;
};

export const DESIGN_ITEMS: DesignItem[] = [
  {
    id: 1,
    category: "carrossel",
    title: "Placeholder 01",
    description: "Descrição placeholder — entra o texto real do projeto quando o conteúdo for definido.",
    slideCount: 4,
  },
  {
    id: 2,
    category: "brandbook",
    title: "Placeholder 02",
    description: "Descrição placeholder — entra o texto real do projeto quando o conteúdo for definido.",
  },
  {
    id: 3,
    category: "carrossel",
    title: "Placeholder 03",
    description: "Descrição placeholder — entra o texto real do projeto quando o conteúdo for definido.",
    slideCount: 3,
  },
  {
    id: 4,
    category: "carrossel",
    title: "Placeholder 04",
    description: "Descrição placeholder — entra o texto real do projeto quando o conteúdo for definido.",
    slideCount: 5,
  },
  {
    id: 5,
    category: "brandbook",
    title: "Placeholder 05",
    description: "Descrição placeholder — entra o texto real do projeto quando o conteúdo for definido.",
  },
  {
    id: 6,
    category: "carrossel",
    title: "Placeholder 06",
    description: "Descrição placeholder — entra o texto real do projeto quando o conteúdo for definido.",
    slideCount: 4,
  },
];
