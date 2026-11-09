"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage, t, type Translated } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";
import { PROJECT_DATA, PROJECTS, vimeoPageUrl, vimeoPlayerUrl, type Project, type ProjectData } from "@/lib/projects";
import { commitFiles, getToken, setToken } from "@/lib/ghPublish";
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

type VimeoInfo = { thumb: string | null; title: string; vertical: boolean };
const infoCache = new Map<string, VimeoInfo>();
async function vimeoInfo(p: Pick<ProjectData, "vimeoId" | "vimeoHash">): Promise<VimeoInfo | null> {
  const key = p.vimeoId + (p.vimeoHash || "");
  if (infoCache.has(key)) return infoCache.get(key)!;
  try {
    const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoPageUrl(p))}&width=960`);
    if (!r.ok) return null;
    const j = await r.json();
    const info = {
      thumb: typeof j.thumbnail_url === "string" ? j.thumbnail_url : null,
      title: typeof j.title === "string" ? j.title : "",
      vertical: Number(j.height) > Number(j.width),
    };
    infoCache.set(key, info);
    return info;
  } catch {
    return null;
  }
}

// vimeo.com/123, vimeo.com/123/abcd (unlisted), player.vimeo.com/video/123?h=abcd
function parseVimeo(link: string): { vimeoId: string; vimeoHash?: string } | null {
  const m = /vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]{6,}))?/i.exec(link);
  if (!m) return null;
  const h = /[?&]h=([0-9a-f]{6,})/i.exec(link)?.[1] || m[2];
  return h ? { vimeoId: m[1], vimeoHash: h } : { vimeoId: m[1] };
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

  // ── gallery editor (/#editar): same publish flow as the trajetória editor
  const [editing, setEditing] = useState(false);
  const [list, setList] = useState<ProjectData[]>(PROJECT_DATA);
  const [form, setForm] = useState<ProjectData | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [askToken, setAskToken] = useState(false);
  const published = useRef(JSON.stringify(PROJECT_DATA));

  useEffect(() => {
    setMounted(true);
    const on = new URLSearchParams(window.location.search).has("editar") || window.location.hash === "#editar";
    if (on) setEditing(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("traj-editing", editing && open);
  }, [editing, open]);

  const ALL: Project[] = editing ? list.map((p, i) => ({ ...p, num: pad(i + 1) })) : PROJECTS;
  const items = filter === "all" || editing ? ALL : ALL.filter((p) => p.filter === filter);
  const usedFilters = FILTERS.filter((f) => f.value === "all" || ALL.some((p) => p.filter === f.value));

  // thumbnails, when the archive opens (and for videos added in the editor)
  const idsKey = ALL.map((p) => p.vimeoId + (p.vimeoHash || "")).join(",");
  useEffect(() => {
    if (!open) return;
    let alive = true;
    ALL.forEach(async (p) => {
      const info = await vimeoInfo(p);
      if (alive && info?.thumb) setThumbs((s) => (s[p.vimeoId] ? s : { ...s, [p.vimeoId]: info.thumb! }));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idsKey]);

  const moveItem = (id: number, d: number) =>
    setList((l) => {
      const i = l.findIndex((x) => x.id === id);
      const j = i + d;
      if (i < 0 || j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const toggleFeatured = (id: number) =>
    setList((l) => l.map((x) => (x.id === id ? { ...x, featured: x.featured === false ? undefined : false } : x)));
  const removeItem = (id: number) => {
    if (window.confirm("Remover este trabalho da galeria?")) setList((l) => l.filter((x) => x.id !== id));
  };
  const saveItem = (p: ProjectData) => {
    setList((l) => (l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [p, ...l]));
    setForm(null);
  };
  const newItem = (): ProjectData => ({
    id: list.reduce((m, x) => Math.max(m, x.id), 0) + 1,
    name: { pt: "", en: "" },
    client: "",
    year: String(new Date().getFullYear()),
    desc: { pt: "", en: "" },
    tags: { pt: "", en: "" },
    filter: "brand-film",
    vimeoId: "",
    orientation: "horizontal",
  });
  const dirty = JSON.stringify(list) !== published.current;

  async function publish() {
    const token = getToken();
    if (!token) return setAskToken(true);
    setBusy(true);
    setStatus("Publicando…");
    try {
      await commitFiles(token, "Galeria: trabalhos editados no site", [
        { path: "lib/projects.json", text: JSON.stringify(list, null, 2) + "\n" },
      ]);
      published.current = JSON.stringify(list);
      setStatus("Publicado. No ar em ~1 min.");
    } catch (err) {
      setStatus(String((err as Error).message || err));
      if (/401|403/.test(String(err))) setAskToken(true);
    } finally {
      setBusy(false);
    }
  }

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
          <span>{editing ? "Editar galeria" : t(L.open, lang)}</span>
          <span className="arc-count">{pad(ALL.length)}</span>
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
                    {t(L.eyebrow, lang)} · {pad(ALL.length)}
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
                {editing && (
                  <button type="button" className="arc-tile arc-add" style={{ "--i": 0 } as React.CSSProperties} onClick={() => setForm(newItem())}>
                    <span className="arc-thumb">
                      <span className="arc-add-plus">+</span>
                    </span>
                    <span className="arc-meta">
                      <span className="arc-name">Adicionar vídeo</span>
                      <span className="arc-client">Cole o link do Vimeo</span>
                    </span>
                  </button>
                )}
                {items.map((p, i) => (
                  <div key={p.id + filter} className="arc-cell" style={{ "--i": i + (editing ? 1 : 0) } as React.CSSProperties}>
                  {editing && (
                    <div className="arc-tools">
                      <button type="button" title="Destaque na home" className={p.featured === false ? "" : "on"} onClick={() => toggleFeatured(p.id)}>★</button>
                      <button type="button" title="Mover para trás" onClick={() => moveItem(p.id, -1)}>↑</button>
                      <button type="button" title="Mover para frente" onClick={() => moveItem(p.id, 1)}>↓</button>
                      <button type="button" title="Editar" onClick={() => setForm(list.find((x) => x.id === p.id) || null)}>✎</button>
                      <button type="button" title="Remover" onClick={() => removeItem(p.id)}>✕</button>
                    </div>
                  )}
                  <button
                    type="button"
                    className="arc-tile"
                    onClick={(e) =>
                      editing
                        ? setForm(list.find((x) => x.id === p.id) || null)
                        : play(p, e.currentTarget.querySelector(".arc-thumb") as HTMLElement)
                    }
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
                  </div>
                ))}
              </div>
            </div>

            {editing && (
              <div className="traj-bar">
                <span className="traj-hint">★ destaque na home · ↑↓ ordem · ✎ editar · ✕ remover</span>
                <span className="traj-status">{status || (dirty ? "Alterações não publicadas" : "Tudo publicado")}</span>
                <button type="button" onClick={() => setAskToken(true)}>Chave</button>
                <button type="button" className="go" disabled={busy || !dirty} onClick={publish}>
                  {busy ? "Publicando…" : "Publicar"}
                </button>
              </div>
            )}

            {form && (
              <ProjectForm
                initial={form}
                lang={lang}
                onCancel={() => setForm(null)}
                onSave={saveItem}
                onThumb={(id, url) => setThumbs((s) => ({ ...s, [id]: url }))}
              />
            )}

            {askToken && (
              <div className="traj-modal">
                <TokenCard
                  onClose={() => setAskToken(false)}
                  onSave={(tk) => {
                    setToken(tk);
                    setAskToken(false);
                    setStatus("Chave salva neste navegador.");
                  }}
                />
              </div>
            )}

            {playing && (
              <div className="arc-player" onClick={stopPlaying}>
                <div className="arc-frame" ref={frameRef} onClick={(e) => e.stopPropagation()}>
                  {thumbs[playing.vimeoId] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="arc-frame-poster" src={thumbs[playing.vimeoId]} alt="" />
                  )}
                  {videoOn && (
                    <iframe
                      src={vimeoPlayerUrl(playing, "autoplay=1&title=0&byline=0&portrait=0")}
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

const CATS: { v: ProjectData["filter"]; l: string }[] = [
  { v: "brand-film", l: "Brand film" },
  { v: "institucional", l: "Institucional" },
  { v: "bts", l: "Making of / BTS" },
  { v: "motion", l: "Motion" },
];

function ProjectForm({
  initial,
  onCancel,
  onSave,
  onThumb,
}: {
  initial: ProjectData;
  lang: string;
  onCancel: () => void;
  onSave: (p: ProjectData) => void;
  onThumb: (vimeoId: string, url: string) => void;
}) {
  const [p, setP] = useState<ProjectData>(initial);
  const [link, setLink] = useState(initial.vimeoId ? vimeoPageUrl(initial) : "");
  const [note, setNote] = useState("");
  const set = (patch: Partial<ProjectData>) => setP((x) => ({ ...x, ...patch }));

  async function readLink(v: string) {
    const parsed = parseVimeo(v);
    if (!parsed) {
      setNote(v ? "Link do Vimeo não reconhecido." : "");
      return;
    }
    const next = { ...p, ...parsed, vimeoHash: parsed.vimeoHash };
    setP(next);
    setNote("Lendo o vídeo…");
    const info = await vimeoInfo(next);
    if (!info) {
      setNote("Não consegui ler esse vídeo. Se ele for privado, use o link de compartilhamento (não listado).");
      return;
    }
    if (info.thumb) onThumb(next.vimeoId, info.thumb);
    setP((x) => ({
      ...x,
      orientation: info.vertical ? "vertical" : "horizontal",
      name: x.name.pt ? x.name : { pt: info.title, en: info.title },
    }));
    setNote(info.vertical ? "Vídeo vertical detectado." : "Vídeo horizontal detectado.");
  }

  const ok = !!p.vimeoId && !!p.name.pt.trim();
  const tx = (k: "name" | "desc" | "tags", lng: "pt" | "en", v: string) => set({ [k]: { ...p[k], [lng]: v } } as Partial<ProjectData>);

  return (
    <div className="traj-modal" onClick={onCancel}>
      <form
        className="arc-form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok) return;
          onSave({
            ...p,
            name: { pt: p.name.pt.trim(), en: (p.name.en || p.name.pt).trim() },
            desc: { pt: p.desc.pt, en: p.desc.en || p.desc.pt },
            tags: { pt: p.tags.pt, en: p.tags.en || p.tags.pt },
            vimeoHash: p.vimeoHash || undefined,
          });
        }}
      >
        <h3>{initial.vimeoId ? "Editar trabalho" : "Adicionar vídeo"}</h3>
        <label>
          Link do Vimeo
          <input value={link} onChange={(e) => setLink(e.target.value)} onBlur={() => readLink(link)} placeholder="https://vimeo.com/…" autoFocus />
        </label>
        {note && <p className="arc-form-note">{note}</p>}
        <div className="arc-form-row">
          <label>
            Título
            <input value={p.name.pt} onChange={(e) => tx("name", "pt", e.target.value)} />
          </label>
          <label>
            Title (EN, opcional)
            <input value={p.name.en} onChange={(e) => tx("name", "en", e.target.value)} />
          </label>
        </div>
        <div className="arc-form-row">
          <label>
            Cliente
            <input value={p.client} onChange={(e) => set({ client: e.target.value })} />
          </label>
          <label>
            Ano
            <input value={p.year} onChange={(e) => set({ year: e.target.value })} inputMode="numeric" />
          </label>
        </div>
        <label>
          Descrição (a decisão de direção + o que resolveu)
          <textarea value={p.desc.pt} onChange={(e) => tx("desc", "pt", e.target.value)} rows={2} />
        </label>
        <label>
          Description (EN, opcional)
          <textarea value={p.desc.en} onChange={(e) => tx("desc", "en", e.target.value)} rows={2} />
        </label>
        <div className="arc-form-row">
          <label>
            Créditos / tags
            <input value={p.tags.pt} onChange={(e) => tx("tags", "pt", e.target.value)} />
          </label>
          <label>
            Credits (EN, opcional)
            <input value={p.tags.en} onChange={(e) => tx("tags", "en", e.target.value)} />
          </label>
        </div>
        <div className="arc-form-row">
          <label>
            Categoria
            <select value={p.filter} onChange={(e) => set({ filter: e.target.value as ProjectData["filter"] })}>
              {CATS.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Formato
            <select value={p.orientation} onChange={(e) => set({ orientation: e.target.value as ProjectData["orientation"] })}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
        </div>
        <label className="arc-form-check">
          <input type="checkbox" checked={p.featured !== false} onChange={(e) => set({ featured: e.target.checked ? undefined : false })} />
          Destaque na galeria da home
        </label>
        <div className="traj-modal-row">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="go" disabled={!ok}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function TokenCard({ onClose, onSave }: { onClose: () => void; onSave: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="traj-modal-card">
      <h3>Chave do GitHub</h3>
      <p>
        A mesma chave do editor da trajetória: <b>fine-grained</b>, só o repositório <b>Portfolio</b>,{" "}
        <b>Contents: Read and write</b>. Fica salva só neste navegador.
      </p>
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">
        Criar chave no GitHub ↗
      </a>
      <input type="password" placeholder="github_pat_…" value={v} onChange={(e) => setV(e.target.value.trim())} autoFocus />
      <div className="traj-modal-row">
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="go" disabled={!v} onClick={() => onSave(v)}>
          Salvar chave
        </button>
      </div>
    </div>
  );
}
