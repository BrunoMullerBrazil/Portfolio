"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import blueprint from "../blueprint.module.css";
import styles from "./design.module.css";
import { withBasePath } from "@/lib/basePath";
import { DESIGN_ITEMS, type DesignCategory, type DesignItem } from "./content";

const arrowAsset = withBasePath("/assets/design/arrow.png");

const FILTERS: { label: string; value: "all" | DesignCategory }[] = [
  { label: "Todos", value: "all" },
  { label: "Carrossel", value: "carrossel" },
  { label: "Brandbook / ID", value: "brandbook" },
];

// Closing needs its own render pass (with the .closing class) before the
// lightbox unmounts, or the fade/scale-out animation never gets to play —
// removing the element immediately on click skips straight past it.
const CLOSE_ANIMATION_MS = 220;

export default function DesignPage() {
  const [filter, setFilter] = useState<"all" | DesignCategory>("all");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = filter === "all" ? DESIGN_ITEMS : DESIGN_ITEMS.filter((i) => i.category === filter);
  const active = DESIGN_ITEMS.find((i) => i.id === activeId) ?? null;

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setActiveId(null);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <main className={blueprint.page}>
      <div className={blueprint.shadow} />
      <div className={blueprint.lightBeam} />
      <div className={blueprint.rulerLeft} />
      <div className={blueprint.rulerBottom} />

      <div className={styles.content}>
        <Link href="/" className={styles.back}>
          ← Voltar
        </Link>

        <div className={styles.titleZone}>
          <div className={styles.stamp}>MÜLLER — DESIGN</div>
          <div className={styles.eyebrow}>// PROJETOS DE DESIGN</div>
          <h1 className={styles.titleBig}>DESIGN</h1>
        </div>

        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.gridWrap}>
          <img className={`${styles.arrow} ${styles.arrowLeft}`} src={arrowAsset} alt="" aria-hidden="true" />
          <img className={`${styles.arrow} ${styles.arrowRight}`} src={arrowAsset} alt="" aria-hidden="true" />

          <div className={styles.grid}>
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={styles.tile}
                onClick={() => setActiveId(item.id)}
                aria-label={item.title}
                data-cursor="click"
              >
                <span className={styles.tilePlaceholder} data-tone={i % 3}>
                  <span className={styles.tileLabel}>{item.title}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {active && <Lightbox item={active} closing={closing} onClose={requestClose} />}
    </main>
  );
}

function Lightbox({ item, closing, onClose }: { item: DesignItem; closing: boolean; onClose: () => void }) {
  return (
    <div className={`${styles.lightboxBackdrop} ${closing ? styles.closing : ""}`} onClick={onClose}>
      <div className={`${styles.lightboxPanel} ${closing ? styles.closing : ""}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.lightboxClose} onClick={onClose} aria-label="Fechar">
          ✕
        </button>

        {item.category === "carrossel" ? (
          <div className={styles.slidesRow}>
            {Array.from({ length: item.slideCount ?? 3 }).map((_, i) => (
              <div key={i} className={styles.slidePlaceholder} data-tone={i % 3}>
                <span>{i + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.tallPlaceholder}>
            <span>Imagem única (brandbook)</span>
          </div>
        )}

        <div className={styles.lightboxInfo}>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </div>
      </div>
    </div>
  );
}
