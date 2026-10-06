"use client";

import { useEffect, useRef } from "react";
import { LOGO_BODY, LOGO_DOTS, LOGO_DOT_CENTERS } from "./Logo";
import { WRITE_STROKES } from "./logoWriting";

/*
 * Loader — a pena.
 *
 * The umlaut dot is shaped like a broad calligraphy nib (slanted, flat), so
 * it becomes the pen: it writes "Müller" at a fixed nib angle, then flies
 * up and lands on the ü, and the second dot splits out of it. Then the name
 * is swallowed into a capsule that flies into the hero's video card (last
 * frame of the loader = first frame of the site).
 *
 * Shot like one continuous take, not a sequence of steps:
 *   - one master clock drives everything, writing and hand-off included;
 *     no phase waits for another to finish (no onfinish chains), each one
 *     starts while the previous is still moving;
 *   - velocity is never broken: the pen leaves a stroke at the speed it was
 *     writing and carries it through the air (Hermite curves, not lerps), the
 *     flight to the ü inherits the r's exit and only brakes as it lands;
 *   - nothing bounces (no squash, no overshoot — same rule as the site's
 *     motion tokens): arrivals decelerate and settle;
 *   - a slow camera push-in under the whole take, so no frame is static;
 *   - ink, not a mask: every pixel of the name belongs to the nearest point
 *     of the hand's path and appears the moment the pen passes it, with a
 *     soft front — so ink follows the nib along the stroke, never ahead of
 *     it and never in blocks (see buildInk).
 */

const VB = { x: 160, y: 720, w: 1700, h: 480 };
const REST_Y = 905; // top of the lowercase — capsule's upper edge

// timeline (seconds)
const T_WRITE0 = 0.25;
const WRITE_DUR = 1.8; // the whole name, lifts included
const NIB_FLY = 0.62; // nib: end of the r → ü, one arc
const T_WRITE1 = T_WRITE0 + WRITE_DUR;
const T_LAND = T_WRITE1 + NIB_FLY;
const T_SPLIT = T_LAND - 0.1; // twin leaves before the nib has fully settled
const SPLIT = 0.42;
const T_HAND = T_SPLIT + SPLIT * 0.75; // the twin is visually home by now; camera still moving

// hand-off (seconds after T_HAND)
const H_SWALLOW = 0.5;
const H_FLY0 = 0.2;
const H_FLY = 0.95;
const H_MEDIA = H_FLY0 + H_FLY * 0.62; // video starts appearing under the capsule while it glides in
const H_DISSOLVE = 0.5;
const H_END = Math.max(H_FLY0 + H_FLY, H_MEDIA + H_DISSOLVE) + 0.05;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const span = (t: number, a: number, d: number) => clamp01((t - a) / d);
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const outQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const outSine = (t: number) => Math.sin((t * Math.PI) / 2);

// CSS-style cubic-bezier(x1,y1,x2,y2) as a function of t ∈ [0,1]
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (u: number) => ((ax * u + bx) * u + cx) * u;
  const dX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 6; i++) {
      const d = dX(u);
      if (Math.abs(d) < 1e-6) break;
      u -= (X(u) - x) / d;
    }
    u = clamp01(u);
    return ((ay * u + by) * u + cy) * u;
  };
}
// soft departure (the swallow is still moving when the fly starts), long glide in
const flyEase = bezier(0.3, 0, 0.08, 1);

type Pt = { x: number; y: number };

// cubic Hermite: position from endpoints and end tangents (tangents already × duration)
function hermite(p0: Pt, m0: Pt, p1: Pt, m1: Pt, u: number): Pt {
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  return { x: h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x, y: h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y };
}
const capLen = (v: Pt, max: number) => {
  const l = Math.hypot(v.x, v.y);
  return l > max ? { x: (v.x / l) * max, y: (v.y / l) * max } : v;
};

type StrokePlan = {
  path: SVGPathElement; L: number; t0: number; t1: number; ts: number[]; ls: number[];
  pts: Pt[]; // the samples behind ts/ls, logo units
  a: Pt; b: Pt; va: Pt; vb: Pt; // entry / exit velocity, units per second
};

/*
 * Time plan for the hand. Each path is sampled every ~6 units; local speed
 * drops with curvature (turning angle per unit) and near the stroke's ends
 * (pen landing / lifting, never to zero). Air time between strokes grows
 * with the jump. Everything is then scaled to WRITE_DUR.
 */
function planHand(paths: SVGPathElement[]): StrokePlan[] {
  const raw = paths.map((path) => {
    const L = path.getTotalLength();
    const n = Math.max(10, Math.ceil(L / 6));
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const q = path.getPointAtLength((L * i) / n);
      pts.push({ x: q.x, y: q.y });
    }
    const ds = L / n;
    const ts = [0];
    const ls = [0];
    let t = 0;
    for (let i = 1; i <= n; i++) {
      const p0 = pts[Math.max(0, i - 2)], p1 = pts[i - 1], p2 = pts[i];
      const a1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const a2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      let turn = Math.abs(a2 - a1);
      if (turn > Math.PI) turn = 2 * Math.PI - turn;
      const curv = turn / ds;
      const s = (i * L) / n;
      const ends = 0.62 + 0.38 * smoothstep(0, 45, s) * smoothstep(0, 45, L - s);
      const speed = ends / (1 + 45 * curv);
      t += ds / speed;
      ts.push(t);
      ls.push(s);
    }
    return { path, L, dur: t, ts, ls, pts, a: pts[0], b: pts[n] };
  });
  const lifts = raw.map((r, i) => {
    const nx = raw[i + 1];
    if (!nx) return 0;
    const gap = Math.hypot(nx.a.x - r.b.x, nx.a.y - r.b.y);
    return gap < 30 ? 30 : 130 + gap * 0.9; // the pen travels in the air, not teleports
  });
  const total = raw.reduce((acc, r, i) => acc + r.dur + lifts[i], 0);
  const k = WRITE_DUR / total;
  let clock = T_WRITE0;
  return raw.map((r, i) => {
    const t0 = clock;
    const t1 = t0 + r.dur * k;
    clock = t1 + lifts[i] * k;
    const n = r.pts.length - 1;
    const vel = (i0: number, i1: number): Pt => {
      const dt = (r.ts[i1] - r.ts[i0]) * k || 1e-3;
      return { x: (r.pts[i1].x - r.pts[i0].x) / dt, y: (r.pts[i1].y - r.pts[i0].y) / dt };
    };
    return {
      path: r.path, L: r.L, t0, t1, ts: r.ts.map((v) => t0 + v * k), ls: r.ls, pts: r.pts,
      a: r.a, b: r.b, va: vel(0, 1), vb: vel(n - 1, n),
    };
  });
}

function lengthAt(p: StrokePlan, t: number) {
  if (t <= p.t0) return 0;
  if (t >= p.t1) return p.L;
  let lo = 0, hi = p.ts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p.ts[mid] < t) lo = mid;
    else hi = mid;
  }
  const u = (t - p.ts[lo]) / (p.ts[hi] - p.ts[lo] || 1);
  return lerp(p.ls[lo], p.ls[hi], u);
}

/*
 * The ink field. The name is rasterised once; every covered pixel gets the
 * time the pen passes the nearest sample of its centre-line path (bucketed
 * nearest-neighbour search). Pixels are kept sorted by that time, so each
 * frame only touches the ones whose ink is still arriving.
 */
const INK_SOFT = 0.14; // seconds: how long a pixel takes to fill — a long, smoky wet front

type Ink = {
  ctx: CanvasRenderingContext2D;
  img: ImageData;
  idx: Int32Array; // pixel index, sorted by time
  cov: Uint8Array; // anti-aliased coverage
  T: Float32Array; // arrival time
  head: number; // first pixel not yet fully inked
};

function buildInk(canvas: HTMLCanvasElement, plan: StrokePlan[], wPx: number, hPx: number): Ink | null {
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const k = wPx / VB.w;

  // coverage of the body
  const off = document.createElement("canvas");
  off.width = wPx;
  off.height = hPx;
  const octx = off.getContext("2d");
  if (!octx) return null;
  octx.setTransform(k, 0, 0, k, -VB.x * k, -VB.y * k);
  octx.fillStyle = "#fff";
  octx.fill(new Path2D(LOGO_BODY));
  const cover = octx.getImageData(0, 0, wPx, hPx).data;

  // path samples (px) into a bucket grid
  const CELL = 24;
  const gw = Math.ceil(wPx / CELL), gh = Math.ceil(hPx / CELL);
  const buckets: number[][] = Array.from({ length: gw * gh }, () => []);
  const sx: number[] = [], sy: number[] = [], st: number[] = [];
  plan.forEach((p) =>
    p.pts.forEach((q, j) => {
      const x = (q.x - VB.x) * k, y = (q.y - VB.y) * k;
      const n = sx.length;
      sx.push(x); sy.push(y); st.push(p.ts[j]);
      const cx = Math.min(gw - 1, Math.max(0, Math.floor(x / CELL)));
      const cy = Math.min(gh - 1, Math.max(0, Math.floor(y / CELL)));
      buckets[cy * gw + cx].push(n);
    })
  );

  // arrival time per block of F×F pixels (the field is smooth; full-res
  // search would cost F² more for no visible difference)
  const F = Math.max(1, Math.round(wPx / 640));
  const lw = Math.ceil(wPx / F), lh = Math.ceil(hPx / F);
  const tLow = new Float32Array(lw * lh).fill(-1);
  for (let by = 0; by < lh; by++) {
    for (let bx = 0; bx < lw; bx++) {
      let any = false;
      for (let yy = by * F; yy < Math.min(hPx, by * F + F) && !any; yy++)
        for (let xx = bx * F; xx < Math.min(wPx, bx * F + F); xx++)
          if (cover[(yy * wPx + xx) * 4 + 3]) { any = true; break; }
      if (!any) continue;
      const x = bx * F + F / 2, y = by * F + F / 2;
      const cx = Math.min(gw - 1, Math.floor(x / CELL)), cy = Math.min(gh - 1, Math.floor(y / CELL));
      let best = -1, bd = Infinity;
      for (let r = 0; r < Math.max(gw, gh); r++) {
        for (let yy = cy - r; yy <= cy + r; yy++) {
          if (yy < 0 || yy >= gh) continue;
          for (let xx = cx - r; xx <= cx + r; xx++) {
            if (xx < 0 || xx >= gw) continue;
            if (r && Math.abs(xx - cx) < r && Math.abs(yy - cy) < r) continue; // ring only
            for (const n of buckets[yy * gw + xx]) {
              const d = (sx[n] - x) ** 2 + (sy[n] - y) ** 2;
              if (d < bd) { bd = d; best = n; }
            }
          }
        }
        // anything outside this ring is at least r·CELL away
        if (best >= 0 && bd <= (r * CELL) ** 2) break;
      }
      if (best >= 0) tLow[by * lw + bx] = st[best];
    }
  }

  const pix: number[] = [], cov: number[] = [], tim: number[] = [];
  for (let y = 0; y < hPx; y++) {
    for (let x = 0; x < wPx; x++) {
      const i = y * wPx + x;
      const a = cover[i * 4 + 3];
      if (!a) continue;
      const T = tLow[Math.floor(y / F) * lw + Math.floor(x / F)];
      if (T < 0) continue;
      pix.push(i); cov.push(a); tim.push(T);
    }
  }
  // order by arrival: counting sort on 1 ms buckets (a comparison sort of
  // ~160k pixels costs more than everything above)
  const n = pix.length;
  let tMin = Infinity, tMax = -Infinity;
  for (let i = 0; i < n; i++) { if (tim[i] < tMin) tMin = tim[i]; if (tim[i] > tMax) tMax = tim[i]; }
  const nb = Math.max(1, Math.ceil((tMax - tMin) * 1000) + 1);
  const start = new Int32Array(nb + 1);
  const key = new Int32Array(n);
  for (let i = 0; i < n; i++) { key[i] = Math.floor((tim[i] - tMin) * 1000); start[key[i] + 1]++; }
  for (let b = 0; b < nb; b++) start[b + 1] += start[b];
  const idx = new Int32Array(n), cv = new Uint8Array(n), T = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = start[key[i]]++;
    idx[o] = pix[i]; cv[o] = cov[i]; T[o] = tim[i];
  }
  const ink: Ink = { ctx, img: ctx.createImageData(wPx, hPx), idx, cov: cv, T, head: 0 };
  const d = ink.img.data;
  for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = 255;
  return ink;
}

// paint the ink that has arrived by time t
function paintInk(ink: Ink, t: number) {
  const { idx, cov, T, img } = ink;
  const d = img.data;
  const n = idx.length;
  let i = ink.head;
  while (i < n && T[i] <= t) {
    const f = (t - T[i]) / INK_SOFT;
    d[idx[i] * 4 + 3] = f >= 1 ? cov[i] : cov[i] * f * f * (3 - 2 * f); // eased, so the front smokes in
    i++;
  }
  // everything before the soft front is done for good
  while (ink.head < n && T[ink.head] <= t - INK_SOFT) ink.head++;
  ink.ctx.putImageData(img, 0, 0);
}

export default function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGPathElement | null)[]>([]);
  const pctRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    const center = centerRef.current;
    const svg = svgRef.current;
    const fill = fillRef.current;
    const pct = pctRef.current;
    const morph = morphRef.current;
    const grid = gridRef.current;
    const noise = noiseRef.current;
    if (!loader || !center || !svg || !fill || !pct || !morph || !grid || !noise) return;

    /*
     * Noise: the loader's own grain, heavier than the site's film stock and
     * on top of the mark (the white ink gets grain too, like footage). A
     * tile is generated once on a canvas and stepped around at ~12fps.
     */
    {
      const size = 320;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d");
      if (ctx) {
        const img = ctx.createImageData(size, size);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random() < 0.5 ? 0 : 255;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = Math.random() * 22;
        }
        ctx.putImageData(img, 0, 0);
        noise.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
      }
    }

    let finished = false;

    // Hard fallback: everything visible, loader gone.
    function finishPlain() {
      if (finished) return;
      finished = true;
      document.body.classList.add("site-ready", "media-ready");
      loader?.remove();
    }

    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) {
      finishPlain();
      return;
    }

    const failsafe = setTimeout(finishPlain, 9000);
    let raf = 0;
    let t0: number | null = null;
    let lastPct = -1;
    let unmasked = false;

    const strokes = strokeRefs.current.filter(Boolean) as SVGPathElement[];
    const plan = planHand(strokes);
    const totalLen = plan.reduce((a, p) => a + p.L, 0) || 1;

    // ink canvas, laid exactly over the svg at device resolution
    const inkCanvas = inkRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = svg.clientWidth, cssH = (cssW * VB.h) / VB.w;
    const ink = inkCanvas && cssW ? buildInk(inkCanvas, plan, Math.round(cssW * dpr), Math.round(cssH * dpr)) : null;
    if (ink && inkCanvas) {
      inkCanvas.style.height = cssH + "px";
    } else {
      fill.style.opacity = "1"; // no canvas: show the name as is
    }

    const C0 = LOGO_DOT_CENTERS[0];
    const C1 = LOGO_DOT_CENTERS[1];
    const nib = dotRefs.current[0]!;
    const twin = dotRefs.current[1]!;
    const last = plan[plan.length - 1];

    function put(el: SVGPathElement, c: Pt, p: Pt, s: number, op: number) {
      el.setAttribute(
        "transform",
        `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-c.x} ${-c.y})`
      );
      el.style.opacity = op.toFixed(3);
    }

    // where the pen is at time t while writing (on paper or in the air)
    function penAt(t: number): { p: Pt; air: number } {
      for (let i = 0; i < plan.length; i++) {
        const s = plan[i];
        if (t < s.t0) {
          const prev = plan[i - 1];
          if (!prev) return { p: s.a, air: 1 };
          const dur = s.t0 - prev.t1;
          const u = clamp01((t - prev.t1) / dur);
          const gap = Math.hypot(s.a.x - prev.b.x, s.a.y - prev.b.y);
          // leave at the writing speed, arrive at the next stroke's speed
          const max = gap * 1.4 + 24;
          const m0 = capLen({ x: prev.vb.x * dur, y: prev.vb.y * dur }, max);
          const m1 = capLen({ x: s.va.x * dur, y: s.va.y * dur }, max);
          const p = hermite(prev.b, m0, s.a, m1, u);
          const lift = Math.pow(Math.sin(Math.PI * u), 2);
          p.y -= lift * Math.min(60, gap * 0.22);
          return { p, air: lift };
        }
        if (t <= s.t1) {
          const q = s.path.getPointAtLength(lengthAt(s, t));
          return { p: { x: q.x, y: q.y }, air: 0 };
        }
      }
      return { p: last.b, air: 0 };
    }

    // ── hand-off state (measured once, when the capsule appears) ──
    type Rect = { l: number; t: number; w: number; h: number };
    let cap: Rect | null = null;
    let hero: Rect | null = null;
    let handStarted = false;
    let flyStarted = false;
    let mediaShown = false;
    let svgOut: Animation | null = null;

    function startHand() {
      handStarted = true;
      const sr = svg!.getBoundingClientRect();
      const s = sr.width / VB.w;
      // capsule = the lowercase band of the wordmark
      cap = {
        l: sr.left + (173 - VB.x) * s,
        t: sr.top + (REST_Y - VB.y) * s,
        w: (1854 - 173) * s,
        h: (1186 - REST_Y) * s,
      };
      morph!.style.opacity = "1";
      const ease = "cubic-bezier(.16,1,.3,1)";
      // the name dissolves into the capsule: a little defocus, not a cut
      svgOut = svg!.animate(
        [
          { opacity: 1, transform: "scaleX(1)", filter: "blur(0px)" },
          { opacity: 0, transform: "scaleX(.95)", filter: "blur(6px)" },
        ],
        { duration: 420, delay: 60, easing: ease, fill: "forwards" }
      );
      pct!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: ease, fill: "forwards" });
    }

    function startFly() {
      flyStarted = true;
      const hm = document.getElementById("heroMedia");
      const r = hm?.getBoundingClientRect();
      const onScreen =
        r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      hero = onScreen && r ? { l: r.left, t: r.top, w: r.width, h: r.height } : null;

      // the site starts arriving underneath while the capsule travels
      document.body.classList.add("site-ready");
      const ease = "cubic-bezier(.16,1,.3,1)";
      loader!.animate([{ backgroundColor: "rgba(14,16,12,1)" }, { backgroundColor: "rgba(14,16,12,0)" }], {
        duration: 900,
        delay: 120,
        easing: ease,
        fill: "forwards",
      });
      grid!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: ease, fill: "forwards" });
      noise!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, easing: ease, fill: "forwards" });
    }

    function setClip(r: Rect, radius: number) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const rad = Math.min(radius, r.h / 2, r.w / 2);
      morph!.style.clipPath = `inset(${r.t.toFixed(2)}px ${(vw - r.l - r.w).toFixed(2)}px ${(vh - r.t - r.h).toFixed(2)}px ${r.l.toFixed(2)}px round ${rad.toFixed(2)}px)`;
    }

    function handFrame(h: number) {
      if (!handStarted) startHand();
      if (!flyStarted && h >= H_FLY0) startFly();
      const c = cap!;

      // swallow: the capsule opens from the centre of the name
      const sw = outExpo(span(h, 0, H_SWALLOW));
      let r: Rect = { l: c.l + (c.w * (1 - sw)) / 2, t: c.t, w: c.w * sw, h: c.h };
      let radius = c.h / 2;

      if (hero) {
        // fly: one glide on a slight arc, no stop between swallow and travel
        const e = flyEase(span(h, H_FLY0, H_FLY));
        const arc = Math.sin(Math.PI * e) * Math.min(90, window.innerHeight * 0.08);
        r = {
          l: lerp(r.l, hero.l, e),
          t: lerp(r.t, hero.t, e) - arc,
          w: lerp(r.w, hero.w, e),
          h: lerp(r.h, hero.h, e),
        };
        radius = lerp(c.h / 2, 20, outSine(e));
        if (!mediaShown && h >= H_MEDIA) {
          mediaShown = true;
          document.body.classList.add("media-ready"); // video fades in under the capsule
        }
        morph!.style.opacity = (1 - smoothstep(H_MEDIA, H_MEDIA + H_DISSOLVE, h)).toFixed(3);
      } else if (flyStarted) {
        // hero card not on screen (scrolled / tiny viewport): just dissolve
        morph!.style.opacity = (1 - smoothstep(H_FLY0, H_FLY0 + 0.45, h)).toFixed(3);
      }
      setClip(r, radius);
    }

    function done() {
      if (finished) return;
      finished = true;
      clearTimeout(failsafe);
      document.body.classList.add("site-ready", "media-ready");
      svgOut?.cancel();
      loader!.remove();
    }

    function tick(ts: number) {
      if (t0 === null) t0 = ts;
      const t = (ts - t0) / 1000;

      // camera: a slow push-in for the whole take, so no frame is ever static
      const cam = outSine(clamp01(t / (T_HAND + 0.5)));
      center!.style.transform = `translate(-50%,-50%) scale(${lerp(0.94, 1, cam).toFixed(4)})`;

      // ink
      let written = 0;
      plan.forEach((s) => (written += lengthAt(s, t)));
      if (!unmasked) {
        if (ink) paintInk(ink, t);
        if (t >= T_WRITE1 + INK_SOFT + 0.03) {
          // dry: hand over to the vector body for crisp edges
          fill!.style.opacity = "1";
          if (inkCanvas) inkCanvas.style.display = "none";
          unmasked = true;
        }
      }

      // the nib
      if (t < T_WRITE0) {
        put(nib, C0, plan[0].a, 0.86, 0);
      } else if (t <= T_WRITE1) {
        const { p, air } = penAt(t);
        const fadeIn = smoothstep(T_WRITE0, T_WRITE0 + 0.18, t);
        put(nib, C0, p, 0.86 + air * 0.06, fadeIn);
        nib.classList.add("nib");
      } else if (t < T_LAND) {
        // carries the r's exit speed up into one arc and brakes onto the ü
        const u = (t - T_WRITE1) / NIB_FLY;
        const m0 = capLen({ x: last.vb.x * NIB_FLY, y: last.vb.y * NIB_FLY }, 420);
        const p = hermite(last.b, m0, C0, { x: 0, y: 40 }, u);
        p.y -= Math.pow(Math.sin(Math.PI * u), 2) * 210;
        put(nib, C0, p, lerp(0.86, 1, smoothstep(0.2, 1, u)), 1);
      } else {
        nib.classList.remove("nib");
        put(nib, C0, C0, 1, 1);
      }

      // the second dot slides out of the first and settles in its place
      if (t < T_SPLIT) {
        put(twin, C1, C0, 1, 0);
      } else {
        const v = clamp01((t - T_SPLIT) / SPLIT);
        const dx = C1.x - C0.x;
        const p = hermite(C0, { x: dx * 0.9, y: -70 }, C1, { x: dx * 0.15, y: 0 }, outQuart(v));
        put(twin, C1, p, 1, smoothstep(0, 0.3, v));
      }

      const pc = Math.round(clamp01(written / totalLen) * 100);
      if (pc !== lastPct) {
        pct!.firstChild!.nodeValue = String(pc);
        lastPct = pc;
      }

      if (t >= T_HAND) handFrame(t - T_HAND);

      if (t < T_HAND + H_END) raf = requestAnimationFrame(tick);
      else done();
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
  }, []);

  return (
    <div id="loader" ref={loaderRef} aria-hidden="true">
      <div id="ld-grid" ref={gridRef} />
      <div id="ld-center" ref={centerRef}>
        <canvas id="ld-ink" ref={inkRef} />
        <svg
          id="ld-logo"
          ref={svgRef}
          viewBox="160 720 1700 480"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="ld-glow" x="-100%" y="-200%" width="300%" height="500%">
              <feGaussianBlur stdDeviation="14" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* the hand's centre-lines: geometry only, never drawn */}
            {WRITE_STROKES.map((st, i) => (
              <path
                key={i}
                d={st.d}
                ref={(el) => {
                  strokeRefs.current[i] = el;
                }}
              />
            ))}
          </defs>
          <path id="ld-logo-fill" ref={fillRef} d={LOGO_BODY} style={{ opacity: 0 }} />
          {LOGO_DOTS.map((d, i) => (
            <path
              key={i}
              className="ld-dot"
              d={d}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              style={{ opacity: 0 }}
            />
          ))}
        </svg>
        <div id="ld-pct" ref={pctRef}>
          0<span>%</span>
        </div>
      </div>
      <div id="ld-morph" ref={morphRef} />
      <div id="ld-noise" ref={noiseRef} />
    </div>
  );
}
