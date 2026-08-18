import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./trajetoria.module.css";
import { MANIFESTO_INTRO, MANIFESTO_PAPER, MANIFESTO_OUTRO, MANIFESTO_CLOSER, BLOCKS, FINAL_QUOTE } from "./content";

// Splits "before **highlighted** after" into plain text with the marked
// span wrapped for the highlighter/highlight-box treatment.
function withHighlight(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span className={styles.hl} key={i}>
        {part}
      </span>
    ) : (
      part
    )
  );
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
    <main className={styles.page}>
      <div className={styles.shadow} />
      <div className={styles.rulerLeft} />
      <div className={styles.rulerBottom} />

      <div className={styles.content}>
        <Link href="/" className={`${styles.back} reveal`}>
          ← Voltar
        </Link>

        <div className={styles.titleZone}>
          <div className={`${styles.stamp} reveal`}>MÜLLER — CASO 01</div>
          <div className={`${styles.eyebrowTyped} reveal`}>MINHA TRAJETÓRIA</div>
          <div className={`${styles.titleRow} reveal reveal-d1`}>
            <h1 className={styles.titleBig}>
              PROFISS<span className={styles.hl}>IONAL</span>
            </h1>
            <span className={styles.blackBar} />
          </div>
        </div>

        <div className={styles.manifestoZone}>
          <p className={`${styles.manifestoP} reveal`}>{MANIFESTO_INTRO}</p>

          <div className={`${styles.paperPlatform} reveal`}>
            <div className={styles.paperTag}>// A PARTE QUE EU GOSTO</div>
            <p>{MANIFESTO_PAPER}</p>
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
                <div className={styles.chapterPaper}>
                  <span className={`${styles.tape} ${styles.tapeTl}`} />
                  <span className={`${styles.tape} ${styles.tapeBr}`} />
                  <div className={styles.chapterRow}>
                    <div className={styles.chapterLabel}>{b.label}</div>
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
              <div key={i} className={`${styles.paperPlatform} reveal`}>
                {b.tag && <div className={styles.paperTag}>{b.tag}</div>}
                {b.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
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
