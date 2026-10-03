"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { withBasePath } from "@/lib/basePath";

/*
 * Trajetória — free image layers + a visual editor that publishes itself.
 *
 * View mode (everyone): the layers from layers.json render over the page,
 * positioned in "column units" — px of the 760px content column — so they
 * scale with it on smaller screens.
 *
 * Edit mode (/trajetoria?editar): drop or paste a PNG anywhere, drag to
 * move, corner to scale, top handle to rotate. Keys:
 *   Delete remove · ←↑→↓ nudge (Shift ×10) · [ ] layer order · B behind/
 *   in front of the text · M show/hide on phones · D duplicate · ⌘/Ctrl+Z undo
 * "Publicar" commits the new images + layers.json to main in ONE commit via
 * the GitHub API (fine-grained token kept only in this browser), and Vercel
 * puts it live in about a minute.
 */

export type Layer = {
  id: string;
  src: string; // "/assets/trajetoria/layers/…" once published
  x: number; // column units (px at a 760px column), from the column's left edge
  y: number; // column units, from the column's top
  w: number; // width in column units (height follows the image ratio)
  rot: number; // degrees
  z: number; // stacking order among layers
  back?: boolean; // behind the page text
  hideMobile?: boolean;
};

const REPO = { owner: "BrunoMullerBrazil", repo: "Portfolio", branch: "main" };
const LAYERS_JSON = "app/trajetoria/layers.json";
const LAYERS_DIR = "public/assets/trajetoria/layers";
const TOKEN_KEY = "traj-editor-gh-token";
const COL = 760;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const extOf = (dataUrl: string) => {
  const m = /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);/.exec(dataUrl);
  const t = m?.[1] || "png";
  return t === "jpeg" ? "jpg" : t === "svg+xml" ? "svg" : t;
};

/*
 * Transparency helpers. Many "transparent PNGs" from the web are actually
 * flat images with a white/black (or baked checkerboard) background. On
 * drop we check for real alpha; R removes a solid background by flood-
 * filling from the edges with the dominant border colour (connected region
 * only, so the same colour inside the artwork survives), with a soft edge.
 */
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}
function hasAlpha(img: HTMLImageElement): boolean {
  const w = Math.min(img.naturalWidth, 400), h = Math.round((w * img.naturalHeight) / img.naturalWidth) || 1;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}
async function removeBackground(src: string): Promise<string> {
  const img = await loadImg(src);
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, w, h);
  const d = id.data;
  // dominant border colour (quantised)
  const counts = new Map<number, number>();
  const at = (px: number, py: number) => (py * w + px) * 4;
  const q = (i: number) => ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
  for (let px = 0; px < w; px += 2) [0, h - 1].forEach((py) => { const k = q(at(px, py)); counts.set(k, (counts.get(k) || 0) + 1); });
  for (let py = 0; py < h; py += 2) [0, w - 1].forEach((px) => { const k = q(at(px, py)); counts.set(k, (counts.get(k) || 0) + 1); });
  let best = 0, bk = 0;
  counts.forEach((v, k) => { if (v > best) { best = v; bk = k; } });
  const br = ((bk >> 8) & 15) * 16 + 8, bg = ((bk >> 4) & 15) * 16 + 8, bb = (bk & 15) * 16 + 8;
  const TOL = 42;
  const dist = (i: number) => Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb);
  // flood fill from every edge pixel that matches
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (px: number, py: number) => {
    const n = py * w + px;
    if (seen[n]) return;
    seen[n] = 1;
    if (dist(n * 4) <= TOL) stack.push(n);
  };
  for (let px = 0; px < w; px++) { push(px, 0); push(px, h - 1); }
  for (let py = 0; py < h; py++) { push(0, py); push(w - 1, py); }
  while (stack.length) {
    const n = stack.pop()!;
    const px = n % w, py = (n / w) | 0;
    const i = n * 4;
    // soft edge: fully clear in the core, fade near the tolerance limit
    const t = dist(i) / TOL;
    d[i + 3] = Math.round(d[i + 3] * Math.min(1, Math.max(0, (t - 0.55) / 0.45)));
    if (px > 0) push(px - 1, py);
    if (px < w - 1) push(px + 1, py);
    if (py > 0) push(px, py - 1);
    if (py < h - 1) push(px, py + 1);
  }
  x.putImageData(id, 0, 0);
  return c.toDataURL("image/png");
}

type Gh = (path: string, init?: RequestInit) => Promise<any>;
function github(token: string): Gh {
  return async (path, init) => {
    const r = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.repo}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return r.json();
  };
}

export default function LayerCanvas({ initial }: { initial: Layer[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [u, setU] = useState(1); // px per column unit
  const [mobile, setMobile] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(initial);
  const [preview, setPreview] = useState<Record<string, string>>({}); // id → dataURL (unpublished)
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [opaque, setOpaque] = useState<Record<string, boolean>>({}); // id → image has no transparency
  const [busy, setBusy] = useState(false);
  const [askToken, setAskToken] = useState(false);
  const history = useRef<Layer[][]>([]);
  const published = useRef<Layer[]>(initial);

  // scale with the content column
  useEffect(() => {
    const host = hostRef.current?.parentElement;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      setU(host.clientWidth / COL);
      setMobile(window.innerWidth <= 640);
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // ?editar, or #editar (a fragment survives any trailing-slash redirect)
    const on = new URLSearchParams(window.location.search).has("editar") || window.location.hash === "#editar";
    if (on) setEditing(true);
  }, []);

  // click on empty space deselects
  useEffect(() => {
    if (!editing) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!t.closest(".traj-layer, .traj-bar, .traj-modal")) setSel(null);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [editing]);

  useEffect(() => {
    document.body.classList.toggle("traj-editing", editing);
    if (editing) window._lenis?.stop();
    return () => {
      document.body.classList.remove("traj-editing");
      window._lenis?.start();
    };
  }, [editing]);

  const commit = useCallback((next: Layer[] | ((l: Layer[]) => Layer[])) => {
    setLayers((cur) => {
      history.current.push(cur);
      if (history.current.length > 80) history.current.shift();
      return typeof next === "function" ? next(cur) : next;
    });
  }, []);
  const patch = (id: string, p: Partial<Layer>, record = false) => {
    const fn = (l: Layer[]) => l.map((x) => (x.id === id ? { ...x, ...p } : x));
    if (record) commit(fn);
    else setLayers(fn);
  };

  // client point → column units
  const toUnits = (cx: number, cy: number) => {
    const r = hostRef.current!.getBoundingClientRect();
    return { x: (cx - r.left) / u, y: (cy - r.top) / u };
  };

  // ── adding images: drop or paste ─────────────────────────────────────
  const addFiles = useCallback(
    (files: FileList | File[], at?: { x: number; y: number }) => {
      Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .forEach((f, k) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result);
            const img = new Image();
            img.onload = () => {
              const id = uid();
              if (!hasAlpha(img)) {
                setOpaque((o) => ({ ...o, [id]: true }));
                setStatus("Essa imagem não tem fundo transparente. Selecione e aperte R para remover o fundo.");
              }
              const w = Math.min(img.naturalWidth / u, 320);
              const pos = at ?? toUnits(window.innerWidth / 2, window.innerHeight / 2);
              setPreview((p) => ({ ...p, [id]: dataUrl }));
              commit((l) => [
                ...l,
                {
                  id,
                  src: "",
                  x: pos.x - w / 2 + k * 24,
                  y: pos.y - ((w * img.naturalHeight) / img.naturalWidth) / 2 + k * 24,
                  w,
                  rot: 0,
                  z: (l.reduce((m, x) => Math.max(m, x.z), 0) || 0) + 1,
                },
              ]);
              setSel(id);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(f);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [u, commit]
  );

  useEffect(() => {
    if (!editing) return;
    const over = (e: DragEvent) => {
      e.preventDefault();
      document.body.classList.add("traj-drop");
    };
    const leave = () => document.body.classList.remove("traj-drop");
    const drop = (e: DragEvent) => {
      e.preventDefault();
      leave();
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files, toUnits(e.clientX, e.clientY));
    };
    const paste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) addFiles(files);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    window.addEventListener("paste", paste);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
      window.removeEventListener("paste", paste);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, addFiles]);

  // ── keyboard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const prev = history.current.pop();
        if (prev) setLayers(prev);
        return;
      }
      if (!sel) return;
      const L = layers.find((l) => l.id === sel);
      if (!L) return;
      const step = e.shiftKey ? 10 : 1;
      const k = e.key;
      if (k === "Delete" || k === "Backspace") {
        e.preventDefault();
        commit((l) => l.filter((x) => x.id !== sel));
        setSel(null);
      } else if (k.startsWith("Arrow")) {
        e.preventDefault();
        const dx = k === "ArrowLeft" ? -step : k === "ArrowRight" ? step : 0;
        const dy = k === "ArrowUp" ? -step : k === "ArrowDown" ? step : 0;
        patch(sel, { x: L.x + dx, y: L.y + dy }, true);
      } else if (k === "]") patch(sel, { z: L.z + 1 }, true);
      else if (k === "[") patch(sel, { z: L.z - 1 }, true);
      else if (k.toLowerCase() === "b") patch(sel, { back: !L.back }, true);
      else if (k.toLowerCase() === "m") patch(sel, { hideMobile: !L.hideMobile }, true);
      else if (k.toLowerCase() === "r") {
        const src = preview[L.id] || (L.src ? withBasePath(L.src) : "");
        if (!src) return;
        setStatus("Removendo o fundo…");
        removeBackground(src)
          .then((png) => {
            setPreview((p) => ({ ...p, [L.id]: png }));
            setOpaque((o) => ({ ...o, [L.id]: false }));
            // the processed PNG replaces the original on the next publish
            commit((l) => l.map((x) => (x.id === L.id ? { ...x, src: "" } : x)));
            setStatus("Fundo removido. R de novo tira mais; ⌘Z desfaz.");
          })
          .catch(() => setStatus("Não consegui processar essa imagem."));
      } else if (k.toLowerCase() === "d") {
        const id = uid();
        if (preview[L.id]) setPreview((p) => ({ ...p, [id]: p[L.id] }));
        commit((l) => [...l, { ...L, id, x: L.x + 20, y: L.y + 20, z: L.z + 1 }]);
        setSel(id);
      } else if (k === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, sel, layers, preview, commit]);

  // ── direct manipulation: move / scale / rotate ───────────────────────
  function startGesture(e: React.PointerEvent, L: Layer, mode: "move" | "scale" | "rotate") {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    setSel(L.id);
    history.current.push(layers);
    const start = toUnits(e.clientX, e.clientY);
    const el = (e.currentTarget as HTMLElement).closest(".traj-layer") as HTMLElement;
    const r = el.getBoundingClientRect();
    const c = toUnits(r.left + r.width / 2, r.top + r.height / 2);
    const d0 = Math.hypot(start.x - c.x, start.y - c.y) || 1;
    const a0 = Math.atan2(start.y - c.y, start.x - c.x);
    const move = (ev: PointerEvent) => {
      const p = toUnits(ev.clientX, ev.clientY);
      if (mode === "move") patch(L.id, { x: L.x + p.x - start.x, y: L.y + p.y - start.y });
      else if (mode === "scale") {
        const k = Math.hypot(p.x - c.x, p.y - c.y) / d0;
        const w = Math.max(12, L.w * k);
        patch(L.id, { w, x: c.x - (c.x - L.x) * (w / L.w), y: c.y - (c.y - L.y) * (w / L.w) });
      } else {
        let rot = L.rot + ((Math.atan2(p.y - c.y, p.x - c.x) - a0) * 180) / Math.PI;
        if (ev.shiftKey) rot = Math.round(rot / 15) * 15;
        patch(L.id, { rot });
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // ── publish: images + layers.json in one commit ──────────────────────
  async function publish() {
    let token = "";
    try {
      token = localStorage.getItem(TOKEN_KEY) || "";
    } catch {}
    if (!token) return setAskToken(true);
    setBusy(true);
    setStatus("Publicando…");
    try {
      const gh = github(token);
      const ref = await gh(`/git/ref/heads/${REPO.branch}`);
      const head = await gh(`/git/commits/${ref.object.sha}`);
      const tree: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];

      const out: Layer[] = [];
      for (const L of layers) {
        if (!L.src && preview[L.id]) {
          const data = preview[L.id];
          const ext = extOf(data);
          const blob = await gh(`/git/blobs`, {
            method: "POST",
            body: JSON.stringify({ content: data.split(",")[1], encoding: "base64" }),
          });
          const path = `${LAYERS_DIR}/${L.id}.${ext}`;
          tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
          out.push({ ...L, src: `/assets/trajetoria/layers/${L.id}.${ext}` });
        } else if (L.src) out.push(L);
      }
      // images of layers that were removed (and no other layer uses)
      const used = new Set(out.map((l) => l.src));
      published.current
        .filter((l) => l.src && !used.has(l.src))
        .forEach((l) => tree.push({ path: `public${l.src}`, mode: "100644", type: "blob", sha: null }));

      const json = JSON.stringify(
        out.map(({ id, src, x, y, w, rot, z, back, hideMobile }) => ({
          id,
          src,
          x: +x.toFixed(1),
          y: +y.toFixed(1),
          w: +w.toFixed(1),
          rot: +rot.toFixed(1),
          z,
          ...(back ? { back } : {}),
          ...(hideMobile ? { hideMobile } : {}),
        })),
        null,
        2
      );
      const jb = await gh(`/git/blobs`, { method: "POST", body: JSON.stringify({ content: json + "\n", encoding: "utf-8" }) });
      tree.push({ path: LAYERS_JSON, mode: "100644", type: "blob", sha: jb.sha });

      const newTree = await gh(`/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
      const c = await gh(`/git/commits`, {
        method: "POST",
        body: JSON.stringify({
          message: "Trajetória: layout editado no editor visual",
          tree: newTree.sha,
          parents: [ref.object.sha],
        }),
      });
      await gh(`/git/refs/heads/${REPO.branch}`, { method: "PATCH", body: JSON.stringify({ sha: c.sha }) });

      setLayers(out);
      published.current = out;
      setStatus("Publicado. No ar em ~1 min.");
    } catch (err) {
      setStatus(String((err as Error).message || err));
      if (/401|403/.test(String(err))) setAskToken(true);
    } finally {
      setBusy(false);
    }
  }

  const dirty = JSON.stringify(layers) !== JSON.stringify(published.current);

  return (
    <div ref={hostRef} className={"traj-layers" + (editing ? " editing" : "")}>
      {[...layers]
        .sort((a, b) => a.z - b.z)
        .filter((L) => editing || !(mobile && L.hideMobile))
        .map((L) => {
          const src = preview[L.id] || (L.src ? withBasePath(L.src) : "");
          if (!src) return null;
          return (
            <div
              key={L.id}
              className={"traj-layer" + (sel === L.id ? " sel" : "") + (L.back ? " back" : "") + (L.hideMobile ? " nomobile" : "") + (opaque[L.id] ? " opaque" : "")}
              style={{
                left: L.x * u,
                top: L.y * u,
                width: L.w * u,
                transform: `rotate(${L.rot}deg)`,
                zIndex: L.back ? -1 : 10 + L.z,
              }}
              onPointerDown={(e) => startGesture(e, L, "move")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} />
              {editing && sel === L.id && (
                <>
                  <span className="traj-h scale" onPointerDown={(e) => startGesture(e, L, "scale")} />
                  <span className="traj-h rotate" onPointerDown={(e) => startGesture(e, L, "rotate")} />
                </>
              )}
            </div>
          );
        })}

      {editing &&
        createPortal(
          <>
            <div className="traj-badge">Modo edição</div>
            {layers.length === 0 && <div className="traj-empty">Arraste um PNG para cá<br />ou cole com ⌘V / Ctrl+V</div>}
        <div className="traj-bar" onPointerDown={(e) => e.stopPropagation()}>
          <span className="traj-hint">Arraste ou cole um PNG · R remove fundo · Del · setas · [ ] · B atrás · M celular · D duplicar · ⌘Z</span>
          <span className="traj-status">{status || (dirty ? "Alterações não publicadas" : "Tudo publicado")}</span>
          <button type="button" onClick={() => setAskToken(true)}>Chave</button>
          <button type="button" className="go" disabled={busy || !dirty} onClick={publish}>
            {busy ? "Publicando…" : "Publicar"}
          </button>
        </div>
          </>,
          document.body
        )}

      {askToken &&
        createPortal(
        <TokenDialog
          onClose={() => setAskToken(false)}
          onSave={(t) => {
            try {
              localStorage.setItem(TOKEN_KEY, t);
            } catch {}
            setAskToken(false);
            setStatus("Chave salva neste navegador.");
          }}
        />,
          document.body
        )}
    </div>
  );
}

function TokenDialog({ onClose, onSave }: { onClose: () => void; onSave: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="traj-modal" onPointerDown={(e) => e.stopPropagation()}>
      <div className="traj-modal-card">
        <h3>Chave do GitHub</h3>
        <p>
          Crie uma chave <b>fine-grained</b> com acesso só ao repositório <b>Portfolio</b> e permissão{" "}
          <b>Contents: Read and write</b>. Ela fica salva só neste navegador.
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
    </div>
  );
}
