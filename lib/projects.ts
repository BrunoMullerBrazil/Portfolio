import type { Translated } from "@/lib/LanguageContext";
import data from "./projects.json";

/*
 * Every audiovisual project on the site. The data lives in projects.json so
 * the gallery editor (WorksArchive, /#editar) can publish it from the site.
 *  - FEATURED (featured !== false) feeds the home stage (WorkIntro)
 *  - PROJECTS (all, in this order) feeds "Ver todos os trabalhos"
 * Numbers are derived from position, never stored.
 */
export type ProjectData = {
  id: number;
  name: Translated;
  client: string;
  year: string;
  desc: Translated;
  tags: Translated;
  filter: "brand-film" | "bts" | "motion" | "institucional";
  vimeoId: string;
  vimeoHash?: string; // unlisted videos need the hash from their share link
  orientation: "horizontal" | "vertical";
  featured?: boolean; // false = archive only
};

export type Project = ProjectData & { num: string };

const pad = (n: number) => (n < 10 ? "0" : "") + n;

export const PROJECT_DATA = data as ProjectData[];
export const PROJECTS: Project[] = PROJECT_DATA.map((p, i) => ({ ...p, num: pad(i + 1) }));
export const FEATURED: Project[] = PROJECT_DATA.filter((p) => p.featured !== false).map((p, i) => ({
  ...p,
  num: pad(i + 1),
}));

export function vimeoPlayerUrl(p: Pick<ProjectData, "vimeoId" | "vimeoHash">, params: string) {
  const h = p.vimeoHash ? `h=${p.vimeoHash}&` : "";
  return `https://player.vimeo.com/video/${p.vimeoId}?${h}${params}`;
}

export function vimeoPageUrl(p: Pick<ProjectData, "vimeoId" | "vimeoHash">) {
  return `https://vimeo.com/${p.vimeoId}${p.vimeoHash ? "/" + p.vimeoHash : ""}`;
}
