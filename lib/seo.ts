// Single source of truth for site-wide SEO constants, so title/description/
// OG-image values can't drift between layout.tsx, per-page metadata,
// robots.ts and sitemap.ts.
export const SITE_URL = "https://aue.productions";
export const SITE_NAME = "Bruno Müller";
export const TITLE_SUFFIX = "Bruno Müller";

export const DEFAULT_TITLE = "Bruno Müller — Direção de brand film e motion";
export const DEFAULT_DESCRIPTION =
  "Direção audiovisual para empresas cuja comunicação pública não reflete a qualidade do que entregam. Diagnóstico de percepção antes de produção.";

export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
};
