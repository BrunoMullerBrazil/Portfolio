import type { Metadata } from "next";
import styles from "./trajetoria.module.css";
import blueprint from "../blueprint.module.css";
import { SITE_URL, SITE_NAME, OG_IMAGE } from "@/lib/seo";
import LayerCanvas, { type Layer } from "./LayerCanvas";
import layers from "./layers.json";
import { MANIFESTO_INTRO } from "./content";

// Page-level openGraph/twitter fully replace the layout's (Next.js doesn't
// deep-merge nested metadata fields), so everything needed for a correct
// link preview has to be repeated here, not just title/description.
const PAGE_TITLE = "Minha Trajetória Profissional";
// The opening line of the manifesto, not a generic page blurb — it's the
// strongest single sentence in the piece.
const PAGE_DESCRIPTION = MANIFESTO_INTRO;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: `${PAGE_TITLE} — Bruno Müller`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/trajetoria/`,
    images: [{ ...OG_IMAGE, alt: PAGE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} — Bruno Müller`,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// Blank canvas on purpose: no text, no props — only the desk (background)
// and the free layers placed with the visual editor (/trajetoria#editar).
// The previous written page is still in ./content.ts and in git history.
export default function Trajetoria() {
  return (
    <main className={`${blueprint.page} ${styles.pageTall}`}>
      <div className={blueprint.shadow} />
      <div className={blueprint.lightBeam} />
      <div className={blueprint.rulerLeft} />
      <div className={blueprint.rulerBottom} />

      <div className={`${styles.content} ${styles.canvas}`}>
        <LayerCanvas initial={layers as Layer[]} />
      </div>
    </main>
  );
}
