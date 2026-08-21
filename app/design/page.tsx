"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import blueprint from "../blueprint.module.css";
import styles from "./design.module.css";
import { DESIGN_ITEMS, type DesignCategory, type DesignItem } from "./content";

const FILTERS: { label: string; value: "all" | DesignCategory }[] = [
  { label: "Todos", value: "all" },
  { label: "Carrossel", value: "carrossel" },
  { label: "Brandbook / ID", value: "brandbook" },
];

export default function DesignPage() {
  const [filter, setFilter] = useState<"all" | DesignCategory>("all");
  const [activeId, setActiveId] = useState<number | null>(null);

  const items = filter === "all" ? DESIGN_ITEMS : DESIGN_ITEMS.filter((i) => i.category === filter);
  const active = DESIGN_ITEMS.find((i) => i.id === activeId) ?? null;

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
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

        <div className={styles.grid}>
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={styles.tile}
              onClick={() => setActiveId(item.id)}
              aria-label={item.title}
            >
              <span className={styles.tilePlaceholder} data-tone={i % 3}>
                <span className={styles.tileLabel}>{item.title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && <Lightbox item={active} onClose={() => setActiveId(null)} />}
    </main>
  );
}

function Lightbox({ item, onClose }: { item: DesignItem; onClose: () => void }) {
  return (
    <div className={styles.lightboxBackdrop} onClick={onClose}>
      <div className={styles.lightboxPanel} onClick={(e) => e.stopPropagation()}>
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
