import Link from "next/link";
import styles from "./trajetoria.module.css";
import { MANIFESTO, MANIFESTO_CLOSER, BLOCKS } from "./content";

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

        <div className={styles.titleBlock}>
          <div className={`${styles.eyebrow} reveal`}>Minha trajetória</div>
          <h1 className={`${styles.title} reveal reveal-d1`}>Profissional</h1>
        </div>

        <div className={styles.manifesto}>
          {MANIFESTO.map((p, i) => (
            <p key={i} className={`${styles.manifestoP} reveal reveal-d${Math.min(i + 1, 3)}`}>
              {p}
            </p>
          ))}
          <p className={`${styles.manifestoCloser} reveal reveal-d3`}>{MANIFESTO_CLOSER}</p>
        </div>

        <div className={styles.blocks}>
          {BLOCKS.map((b, i) => {
            if (b.type === "chapter") {
              return (
                <div key={i} className={`${styles.chapter} reveal`}>
                  <span>{b.label}</span>
                </div>
              );
            }
            if (b.type === "quote") {
              return (
                <div key={i} className={`${styles.quoteCard} reveal`}>
                  <div className={styles.quoteBar} />
                  <p className={styles.quoteText}>{b.text}</p>
                </div>
              );
            }
            if (b.type === "stats") {
              return (
                <div key={i} className={`${styles.statsRow} reveal`}>
                  {b.items.map((s, j) => (
                    <div key={j} className={styles.statChip}>
                      <div className={styles.statValue}>{s.value}</div>
                      <div className={styles.statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <p key={i} className={`${styles.bodyP} reveal`}>
                {b.text}
              </p>
            );
          })}
        </div>
      </div>
    </main>
  );
}
