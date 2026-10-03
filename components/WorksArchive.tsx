"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage, t, type Translated } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";
import { PROJECTS, type Project } from "@/lib/projects";
import { SplitText } from "./SplitText";

/*
 * Arquivo — every project in a grid, opened from a pill under the stage.
 *
 * Same language as the rest of the site:
 *   - the pill grows into the archive (clip from the button's own rect) and
 *     shrinks back into it on close — shape continuity, like the loader's
 *     capsule;
 *   - tiles arrive in a frame-timed cascade (foco + settle);
 *   - a tile expands into the player (FLIP from the tile's rect) and
 *     collapses back into it.
 * Thumbnails come from Vimeo's public oEmbed (no keys), cached per session.
 */

const F = 1000 / 24;
const EASE = "cubic-bezier(.16,1,.3,1)";
const EASE_IN = "cubic-bezier(.7,0,.84,0)";

const FILTERS: { label: Translated; value: "all" | Project["filter"] }[] = [
  { label: dict.filterAll, value: "all" },
  { label: dict.filterBrandFilm, value: "brand-film" },
  { label: dict.filterInstitucional, value: "institucional" },
  { label: dict.filterBts, value: "bts" },
  { label: dict.filterMotion, value: "motion" },
];

const L = {
  open: { pt: "Ver todos os trabalhos", en: "See all work" },
  eyebrow: { pt: "Arquivo", en: "Archive" },
  title: { pt: "Todos os trabalhos.", en: "All the work." },
  close: { pt: "Fechar", en: "Close" },
  closePlayer: { pt: "Fechar vídeo", en: "Close video" },
};

const thumbCache = new Map<string, string>();
async function vimeoThumb(id: string): Promise<string | null> {
  if (thumbCache.has(id)) return thumbCache.get(id)!;
  try {
    const r = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=960`);
    if (!r.ok) return null;
    const j = await r.json();
    const url = typeof j.thumbnail_url === "string" ? j.thumbnail_url : null;
    if (url) thumbCache.set(id, url);
    return url;
  } catch {
    return null;
  }
}

const pad = (n: number) => (n < 10 ? "0" : "") + n;

function insetFrom(r: DOMRect) {
  const vw = window.innerWidth, vh = window.innerHeight;
  return `inset(${r.top.toFixed(1)}px ${(vw - r.right).toFixed(1)}px ${(vh - r.bottom).toFixed(1)}px ${r.left.toFixed(1)}px round ${(r.height / 2).toFixed(1)}px)`;
}

export default function WorksArchive() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | Project["filter"]>("all");
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [playing, setPlaying] = useState<Project | null>(null);
  const [videoOn, setVideoOn] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const tileRectRef = useRef<DOMRect | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const items = filter === "all" ? PROJECTS : PROJECTS.filter((p) => p.filter === filter);
  const usedFilters = FILTERS.filter((f) => f.value === "all" || PROJECTS.some((p) => p.filter === f.value));

  // thumbnails, once, when the archive first opens
  useEffect(() => {
    if (!open) return;
    let alive = true;
    PROJECTS.forEach(async (p) => {
      const url = await vimeoThumb(p.vimeoId);
      if (alive && url) setThumbs((s) => (s[p.vimeoId] ? s : { ...s, [p.vimeoId]: url }));
    });
    return () => {
      alive = false;
    };
  }, [open]);

  // ── open / close the archive ─────────────────────────────────────────
  const doOpen = useCallback(() => {
    setOpen(true);
    window._lenis?.stop();
    document.documentElement.classList.add("arc-lock");
  }, []);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    const btn = btnRef.current;
    if (!sheet) return;
    sheet.scrollTop = 0;
    if (btn && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sheet.animate([{ clipPath: insetFrom(btn.getBoundingClientRect()) }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }], {
        duration: F * 18,
        easing: EASE,
      });
    }
    requestAnimationFrame(() => sheet.classList.add("in"));
    closeBtnRef.current?.focus();
  }, [open]);

  const doClose = useCallback(() => {
    const sheet = sheetRef.current;
    const btn = btnRef.current;
    const finish = () => {
      setOpen(false);
      setFilter("all");
      window._lenis?.start();
      document.documentElement.classList.remove("arc-lock");
      btn?.focus();
    };
    if (!sheet || !btn || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    sheet.classList.remove("in");
    const a = sheet.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: insetFrom(btn.getBoundingClientRect()) }], {
      duration: F * 12,
      easing: EASE_IN,
      fill: "forwards",
    });
    a.onfinish = finish;
  }, []);

  // ── player: a tile expands into it, and collapses back ────────────────
  function targetRect(p: Project) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const ratio = p.orientation === "vertical" ? 9 / 16 : 16 / 9;
    let w = Math.min(vw * 0.86, 1180);
    let h = w / ratio;
    const maxH = vh * 0.78;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { left: (vw - w) / 2, top: (vh - h) / 2 - vh * 0.03, width: w, height: h };
  }

  function play(p: Project, tile: HTMLElement) {
    tileRectRef.current = tile.getBoundingClientRect();
    setVideoOn(false);
    setPlaying(p);
  }

  useEffect(() => {
    if (!playing) return;
    const fr = frameRef.current;
    const from = tileRectRef.current;
    if (!fr || !from) return;
    const to = targetRect(playing);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Object.assign(fr.style, { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px" });
    if (reduce) {
      setVideoOn(true);
      return;
    }
    const a = fr.animate(
      [
        { left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px", borderRadius: "14px" },
        { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px", borderRadius: "18px" },
      ],
      { duration: F * 16, easing: EASE }
    );
    a.onfinish = () => setVideoOn(true);
  }, [playing]);

  const stopPlaying = useCallback(() => {
    const fr = frameRef.current;
    const to = tileRectRef.current;
    setVideoOn(false);
    if (!fr || !to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPlaying(null);
    const r = fr.getBoundingClientRect();
    const a = fr.animate(
      [
        { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: "18px", opacity: 1 },
        { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px", borderRadius: "14px", opacity: 0.4 },
      ],
      { duration: F * 11, easing: EASE_IN, fill: "forwards" }
    );
    a.onfinish = () => setPlaying(null);
  }, []);

  // Escape: player first, then the archive
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (playing) stopPlaying();
      else doClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, playing, stopPlaying, doClose]);

  return (
    <>
      <div className="arc-open-wrap">
        <button ref={btnRef} type="button" className="arc-open" onClick={doOpen} data-cursor="click">
          <span>{t(L.open, lang)}</span>
          <span className="arc-count">{pad(PROJECTS.length)}</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 2h8v8M2 10l8-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {mounted &&
        open &&
        createPortal(
          <div className="arc" ref={sheetRef} role="dialog" aria-modal="true" aria-label={t(L.title, lang)} data-lenis-prevent>
            <div className="arc-inner">
              <div className="arc-head">
                <div>
                  <div className="arc-eyebrow">
                    {t(L.eyebrow, lang)} · {pad(PROJECTS.length)}
                  </div>
                  <h2 className="arc-title">
                    <SplitText text={t(L.title, lang)} />
                  </h2>
                </div>
                <button ref={closeBtnRef} type="button" className="arc-close" onClick={doClose} aria-label={t(L.close, lang)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="arc-filters">
                {usedFilters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={"cine-filter" + (filter === f.value ? " active" : "")}
                    onClick={() => setFilter(f.value)}
                  >
                    {t(f.label, lang)}
                  </button>
                ))}
              </div>

              <div className="arc-grid">
                {items.map((p, i) => (
                  <button
                    key={p.id + filter}
                    type="button"
                    className="arc-tile"
                    style={{ "--i": i } as React.CSSProperties}
                    onClick={(e) => play(p, e.currentTarget.querySelector(".arc-thumb") as HTMLElement)}
                    data-cursor="click"
                  >
                    <span className="arc-thumb" data-orient={p.orientation}>
                      {thumbs[p.vimeoId] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbs[p.vimeoId]} alt="" loading="lazy" />
                      ) : null}
                    </span>
                    <span className="arc-meta">
                      <span className="arc-num">{p.num}</span>
                      <span className="arc-name">{t(p.name, lang)}</span>
                      <span className="arc-client">{[p.client, p.year].filter(Boolean).join(" • ")}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {playing && (
              <div className="arc-player" onClick={stopPlaying}>
                <div className="arc-frame" ref={frameRef} onClick={(e) => e.stopPropagation()}>
                  {thumbs[playing.vimeoId] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="arc-frame-poster" src={thumbs[playing.vimeoId]} alt="" />
                  )}
                  {videoOn && (
                    <iframe
                      src={`https://player.vimeo.com/video/${playing.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={t(playing.name, lang)}
                    />
                  )}
                </div>
                <div className="arc-player-meta" onClick={(e) => e.stopPropagation()}>
                  <span className="arc-num">{playing.num}</span>
                  <span className="arc-name">{t(playing.name, lang)}</span>
                  <span className="arc-client">{[playing.client, playing.year].filter(Boolean).join(" • ")}</span>
                </div>
                <button type="button" className="arc-close arc-close-player" onClick={stopPlaying} aria-label={t(L.closePlayer, lang)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
