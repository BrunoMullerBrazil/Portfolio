"use client";

import { LOGO_PATH } from "./Logo";
import { useLanguage, t } from "@/lib/LanguageContext";

/*
 * Créditos finais. The page opens on the loader filling the Müller mark
 * left → right; it closes on the same mark filling again as you reach the
 * end — the film's first and last frame are the signature. MotionSystem
 * writes --prog on .credits-mark (data-progress); CSS turns it into the
 * ink's clip. At the very bottom the mark is complete.
 */
const CREDITS = [
  { k: { pt: "Direção, motion e montagem", en: "Direction, motion & editing" }, v: "Bruno Müller" },
  { k: { pt: "Base", en: "Based in" }, v: "Florianópolis · BR" },
];

const YEAR = new Date().getFullYear();

export default function Footer() {
  const { lang } = useLanguage();
  return (
    <footer
      className="credits"
      data-scene="06"
      data-scene-label={t({ pt: "Créditos", en: "Credits" }, lang)}
    >
      <ul className="credits-roll reveal">
        {CREDITS.map((c) => (
          <li key={c.v + c.k.pt}>
            <span className="credits-k">{t(c.k, lang)}</span>
            <span className="credits-v">{c.v}</span>
          </li>
        ))}
      </ul>

      <div className="credits-mark" data-progress="1 .88" aria-label="Müller">
        <svg viewBox="160 720 1700 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path className="credits-ghost" d={LOGO_PATH} />
        </svg>
        <svg className="credits-ink" viewBox="160 720 1700 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d={LOGO_PATH} />
        </svg>
      </div>

      <div className="credits-row">
        <div className="footer-copy">© {YEAR} Bruno Müller</div>
        <div className="footer-copy credits-end">{t({ pt: "Fim", en: "The End" }, lang)}</div>
      </div>
    </footer>
  );
}
