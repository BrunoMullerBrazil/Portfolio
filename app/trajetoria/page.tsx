import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import styles from "./trajetoria.module.css";
import blueprint from "../blueprint.module.css";
import { withBasePath } from "@/lib/basePath";
import { SITE_URL, SITE_NAME, OG_IMAGE } from "@/lib/seo";
import {
  MANIFESTO_INTRO_PARAGRAPHS,
  TOOLS_QUOTE,
  CAMERA_LEAD,
  CAMERA_YEAR,
  MANIFESTO_PAPER,
  MANIFESTO_OUTRO,
  MANIFESTO_CLOSER,
  BLOCKS,
  FINAL_QUOTE,
} from "./content";

const asset = (name: string) => withBasePath(`/assets/trajetoria/${name}`);
const asset2 = (name: string) => withBasePath(`/assets/trajetoria/v2/${name}`);

// Page-level openGraph/twitter fully replace the layout's (Next.js doesn't
// deep-merge nested metadata fields), so everything needed for a correct
// link preview has to be repeated here, not just title/description.
const PAGE_TITLE = "Minha Trajetória Profissional";
// The opening line of the manifesto, not a generic page blurb — it's the
// strongest single sentence in the piece.
const PAGE_DESCRIPTION = MANIFESTO_INTRO_PARAGRAPHS[0];

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

// A torn-paper card gets one real tape-photo corner instead of a CSS shape —
// sourced from a small rotating set so repeated cards don't look identical.
function PaperTape({ variant = 0, className }: { variant?: number; className?: string }) {
  const files = ["tape-1.png", "tape-3.png", "tape-4.png"];
  return (
    <img
      className={className}
      src={asset(files[variant % files.length])}
      alt=""
      aria-hidden="true"
    />
  );
}

// Real highlighter-pen strokes (photographed, tinted yellow) stand in for a
// flat CSS box behind grifado text — cycled so repeated marks don't look
// identical.
const MARKER_FILES = ["marker-hl-1.png", "marker-hl-2.png", "marker-hl-3.png"];
let markerSeed = 0;
function nextMarker() {
  const file = MARKER_FILES[markerSeed % MARKER_FILES.length];
  markerSeed += 1;
  return asset(file);
}

// Splits "before **highlighted** after" into plain text with the marked
// span wrapped for the highlighter/highlight-box treatment.
function withHighlight(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span className={styles.hl} key={i} style={{ backgroundImage: `url(${nextMarker()})` }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

function withBold(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

function withBlueHighlight(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span className={styles.bh} key={i}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

function StatStar() {
  return (
    <svg className={styles.statStar} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 0v16M0 8h16M2.3 2.3l11.4 11.4M13.7 2.3L2.3 13.7"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export default function Trajetoria() {
  return (
    <main
      className={`${blueprint.page} ${styles.pageTall}`}
      style={{
        backgroundImage: `url(${asset2("bg-blueprint-photo.png")})`,
        backgroundRepeat: "repeat",
        backgroundSize: "640px auto",
      }}
    >
      <div className={blueprint.shadow} />
      <div className={blueprint.lightBeam} />
      <div className={blueprint.rulerLeft} />
      <div className={blueprint.rulerBottom} />

      <div className={styles.content}>
        <Link href="/" className={`${styles.back} reveal`}>
          ← Voltar
        </Link>

        {/* Stage: every child's left/top/width/height below is the Figma
            node's own box (fileKey 3J2SniYtpoy9bcIdXhrt1C) scaled by 0.594
            (760px content / 1279px Figma frame), y-shifted +434px so the
            highest bleed (glasses, node 2004:11, y=-434) lands at top:0. */}
        <div className={styles.stage}>
          {/* 2027:2 Glimmer Shadow Overlays 6 1 — the real photographed
              texture (window-blind light streaks), blended color-burn */}
          <img
            className={styles.glimmerOverlay}
            src={asset2("glimmer-shadow-overlay.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2033:6 Design sem nome (30) 2 — pen */}
          <img
            className={`${styles.penProp} ${styles.stageItem} reveal`}
            style={{ left: -85, top: 498, width: 800, height: 622 }}
            src={asset("pen.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2004:11 magnific_deixe-o-oculos-um-pouco-m — glasses */}
          <img
            className={`${styles.glasses} ${styles.stageItem} reveal`}
            style={{ left: 298, top: 0, width: 516, height: 516 }}
            src={asset2("glasses.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2033:8 magnific_quero-um-cafe-com-leite — coffee */}
          <img
            className={`${styles.coffeeCup} ${styles.stageItem} reveal`}
            style={{ left: 486, top: 93, width: 546, height: 451 }}
            src={asset2("coffee-cup.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2001:6 magnific_remover-fundo_iGW4Cq93uK — torn cloud sticker */}
          <img
            className={`${styles.cloudSticker} ${styles.stageItem} reveal`}
            style={{ left: -20, top: 287, width: 239, height: 239 }}
            src={asset2("sticker-cloud-torn.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2004:10 magnific_9_8auXEKBIrU — welcome bubble */}
          <img
            className={`${styles.welcomeBubble} ${styles.stageItem} reveal`}
            style={{ left: 17, top: 220, width: 410, height: 410 }}
            src={asset2("welcome-bubble.png")}
            alt="Welcome to my world (:"
          />
          {/* 2004:6 magnific_remover-fundo_3zc96dBREY 1 — arrow cluster (down-left) */}
          <img
            className={`${styles.arrowClusterTR} ${styles.stageItem}`}
            style={{ left: 701, top: 629, width: 198, height: 219 }}
            src={asset2("arrows-cluster-down-left.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2004:7 magnific_remover-fundo_3zc96dBREY 2 — arrow cluster (up-right) */}
          <img
            className={`${styles.arrowClusterBL} ${styles.stageItem}`}
            style={{ left: 87, top: 623, width: 200, height: 229 }}
            src={asset2("arrows-cluster-up-right.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2004:9 "Minha Trajetória" text */}
          <div
            className={`${styles.titleMinhaWrap} ${styles.stageItem} reveal reveal-d1`}
            style={{ left: 216, top: 563, width: 357, height: 176 }}
          >
            <h1 className={styles.titleMinha}>
              Minha
              <br />
              Trajetória
            </h1>
          </div>
          {/* 2004:4 magnific_5_O6ZUHKmynm — falling person */}
          <img
            className={`${styles.fallingPerson} ${styles.stageItem}`}
            style={{ left: 310, top: 532, width: 168, height: 168 }}
            src={asset2("falling-person.png")}
            alt=""
            aria-hidden="true"
          />
          {/* 2006:13 "PROFISSIONAL" text */}
          <div
            className={`${styles.profTagWrap} ${styles.stageItem} reveal`}
            style={{ left: 323, top: 691, width: 314, height: 115 }}
          >
            <span className={styles.profTag}>PROFISSIONAL</span>
            <span className={styles.profTagLine} aria-hidden="true" />
            <span className={styles.profTagDot} aria-hidden="true" />
          </div>
          {/* 2012:10 magnific_remover-fundo_YMdnbCtWeC (1) 1 — notebook paper + tape */}
          <div
            className={`${styles.deskNote} ${styles.stageItem} reveal`}
            style={{ left: 337, top: 803, width: 437, height: 437 }}
          >
            <img className={styles.deskNoteImg} src={asset2("notebook-paper-tape.png")} alt="" aria-hidden="true" />
          </div>
          {/* 2010:5/2010:6/2010:7 — the three tool icons pinned on the note */}
          <img
            className={`${styles.stageItem} reveal`}
            style={{ left: 505, top: 944, width: 34, height: 34, zIndex: 2 }}
            src={asset2("icon-tool-1.png")}
            alt=""
            aria-hidden="true"
          />
          <img
            className={`${styles.stageItem} reveal`}
            style={{ left: 552, top: 912, width: 34, height: 34, zIndex: 2 }}
            src={asset2("icon-monitor.png")}
            alt=""
            aria-hidden="true"
          />
          <img
            className={`${styles.stageItem} reveal`}
            style={{ left: 587, top: 928, width: 50, height: 31, zIndex: 2 }}
            src={asset2("icon-c4d.png")}
            alt=""
            aria-hidden="true"
          />
        </div>

        <div className={styles.manifestoZone}>
          {MANIFESTO_INTRO_PARAGRAPHS.map((p, i) => (
            <p key={i} className={`${styles.manifestoTyped} reveal`}>
              {p}
            </p>
          ))}

          <div className={`${styles.browserWindow} reveal`}>
            <div className={styles.browserChrome}>
              <span className={styles.browserDot} />
              <span className={styles.browserDot} />
              <span className={styles.browserDot} />
            </div>
            <div className={styles.browserBody}>
              <p className={styles.browserQuote}>{withBold(TOOLS_QUOTE)}</p>
            </div>
          </div>

          <div
            className={`${styles.cameraPanel} reveal`}
            style={{ backgroundImage: `url(${asset2("bg-cream-paper-photo.png")})` }}
          >
            <img className={styles.cameraLead} src={asset2("camera-veio-em.png")} alt={CAMERA_LEAD} />
            <img className={styles.cameraYear} src={asset2("number-2020.png")} alt={CAMERA_YEAR} />
            <div className={styles.atlasScene}>
              <img className={styles.mountainsImg} src={asset2("mountains.png")} alt="" aria-hidden="true" />
              <img className={styles.atlasFigure} src={asset2("atlas-figure.png")} alt="" aria-hidden="true" />
              <img className={styles.cameraSony} src={asset2("camera-sony-1.png")} alt="" aria-hidden="true" />
            </div>
          </div>

          <div className={`${styles.paperWrap} reveal`}>
            <PaperTape variant={1} className={styles.platformTape} />
            <div className={styles.paperPlatform}>
              <div className={styles.paperTag}>// A PARTE QUE EU GOSTO</div>
              <p>{MANIFESTO_PAPER}</p>
            </div>
          </div>

          <p className={`${styles.manifestoP} reveal`}>{MANIFESTO_OUTRO}</p>

          <div className={`${styles.closerWrap} reveal`}>
            <div className={styles.closerCard}>
              <p className={styles.closerText}>{withBlueHighlight(MANIFESTO_CLOSER)}</p>
            </div>
          </div>
        </div>

        {BLOCKS.map((b, i) => {
          if (b.type === "chapter") {
            return (
              <div key={i} className={`${styles.chapterWrap} reveal`}>
                <PaperTape variant={i} className={`${styles.chapterTapeImg} ${styles.chapterTapeTl}`} />
                <PaperTape variant={i + 1} className={`${styles.chapterTapeImg} ${styles.chapterTapeBr}`} />
                <div className={styles.chapterPaper}>
                  <div className={styles.chapterRow}>
                    <div className={styles.chapterLabelWrap}>
                      <div className={styles.chapterLabel}>{b.label}</div>
                      {b.underline && (
                        <img
                          className={styles.chapterUnderline}
                          src={asset("marker-underline.png")}
                          alt=""
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className={styles.chapterTag}>{b.num} / 06</div>
                  </div>
                </div>
              </div>
            );
          }
          if (b.type === "body") {
            return (
              <p key={i} className={`${styles.bodyP} reveal`}>
                {b.text}
              </p>
            );
          }
          if (b.type === "quoteHighlight") {
            return (
              <div key={i} className={`${styles.quoteHighlightZone} reveal`}>
                <div className={styles.quoteHighlightText}>{withHighlight(b.text)}</div>
              </div>
            );
          }
          if (b.type === "quoteSerif") {
            return (
              <div key={i} className={`${styles.quoteSerifZone} reveal`}>
                <div className={styles.quoteSerifText}>{withBlueHighlight(b.text)}</div>
              </div>
            );
          }
          if (b.type === "stats") {
            return (
              <div key={i} className={`${styles.statsRow} reveal`}>
                {b.items.map((s, j) => (
                  <div key={j} className={styles.statChip}>
                    {b.circleIndex === j && (
                      <img
                        className={styles.statCircleMark}
                        src={asset("marker-circle.png")}
                        alt=""
                        aria-hidden="true"
                      />
                    )}
                    <StatStar />
                    <div className={styles.statVal}>{s.value}</div>
                    <div className={styles.statLbl}>{s.label}</div>
                  </div>
                ))}
              </div>
            );
          }
          if (b.type === "paper") {
            return (
              <div key={i} className={`${styles.paperWrap} reveal`}>
                <PaperTape variant={i} className={styles.platformTape} />
                <div className={styles.paperPlatform}>
                  {b.tag && <div className={styles.paperTag}>{b.tag}</div>}
                  {b.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}

        <div className={`${styles.finalWrap} reveal`}>
          <div className={styles.finalCard}>
            <div className={styles.finalTag}>A FRASE QUE FICA</div>
            <p className={styles.finalText}>{withBlueHighlight(FINAL_QUOTE)}</p>
          </div>
          <div className={styles.finalStamp}>FIM — CASO 01</div>
        </div>
      </div>
    </main>
  );
}
