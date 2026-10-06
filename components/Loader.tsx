"use client";

import { useEffect, useRef } from "react";
import { LOGO_BODY, LOGO_DOTS, LOGO_DOT_CENTERS } from "./Logo";

/*
 * Loader — o trema como semente.
 *
 * One object, one camera, no cuts (after rerun / SHIFT):
 *   1. seed: the umlaut dot is born alone and pops in; the second dot springs
 *      out of it — the trema assembles itself;
 *   2. dive: the camera rushes into the dot until it fills the screen white;
 *   3. pull-back: from inside the dot the camera pulls out on an exponential
 *      curve — the ü, then "Mü", then "Müller" appear *around* the dot. The
 *      dot never moves on screen: it is the anchor the world zooms out from;
 *   4. bar: while the camera is still settling, the name collapses down into
 *      a capsule that sweeps across it (left → right), and that capsule flies
 *      into the hero's video card (last frame of the loader = first frame of
 *      the site).
 *
 * Motion vocabulary: exponential camera (fast start, long settle — it never
 * stops dead), damped springs only where something is born (the dot, the
 * twin, the capsule landing in the card). Every phase starts while the
 * previous one is still moving.
 */

const L_CENTER = { x: 1010, y: 960 }; // centre of the wordmark, logo units
const LOGO_W = 1700; // wordmark width, logo units
const BAND = { x0: 173, x1: 1854, y0: 905, y1: 1186 }; // lowercase band → capsule
const C0 = LOGO_DOT_CENTERS[0];
const C1 = LOGO_DOT_CENTERS[1];

// timeline (seconds)
const T_POP = 0.12; // the dot is born
const T_SPLIT = 0.46; // the twin springs out of it
const T_DIVE = 0.86; // camera rushes into the dot
const DIVE = 0.42;
const T_PULL = T_DIVE + DIVE; // hidden cut: inside the dot, all white
const PULL = 1.75; // exponential pull-back to rest
const T_BAR = T_PULL + 1.3; // camera still settling when the bar starts
const BAR = 0.44;
const T_FLY = T_BAR + 0.34; // flight leaves before the sweep has finished
const T_MEDIA = T_FLY + 0.42; // video appears under the capsule as it lands
const DISSOLVE = 0.42;
const T_END = T_MEDIA + DISSOLVE + 0.04;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const span = (t: number, a: number, d: number) => clamp01((t - a) / d);
const inExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
const sweepEase = bezier(0.7, 0, 0.2, 1);

/*
 * Damped spring, closed form (underdamped, 0 < z < 1), starting at rest:
 * 0 → 1 with overshoot, settling in a swing or two.
 */
function spring(t: number, w: number, z: number) {
  if (t <= 0) return 0;
  const d = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(d * t) + ((z * w) / d) * Math.sin(d * t));
}

export default function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const camRef = useRef<SVGGElement>(null);
  const markRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const dotRefs = useRef<(SVGPathElement | null)[]>([]);
  const pctRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    const svg = svgRef.current;
    const cam = camRef.current;
    const mark = markRef.current;
    const body = bodyRef.current;
    const pct = pctRef.current;
    const morph = morphRef.current;
    const grid = gridRef.current;
    const dot = dotRefs.current[0];
    const twin = dotRefs.current[1];
    if (!loader || !svg || !cam || !mark || !body || !pct || !morph || !grid || !dot || !twin) return;

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

    // ── camera ──────────────────────────────────────────────────────
    let vw = 0, vh = 0, sRest = 1, sSeed = 1, sMax = 1;
    const dotBox = dot.getBBox();
    function measure() {
      vw = window.innerWidth;
      vh = window.innerHeight;
      svg!.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
      sRest = Math.min(560, Math.max(280, vw * 0.42)) / LOGO_W; // px per logo unit at rest
      sSeed = sRest * 4.6; // the seed is seen close: the dots read as shapes, not specks
      // inside the dot = the dot's short side covers the whole screen from the anchor
      sMax = (3.4 * Math.hypot(vw, vh)) / Math.min(dotBox.width, dotBox.height);
    }
    measure();
    window.addEventListener("resize", measure);

    /*
     * The anchor: the dot keeps the screen position it has in the final
     * mark at every zoom level, so the world zooms around it. With focus
     * f = C0 + (L_CENTER − C0) · (sRest / s), a point P lands on screen at
     *   centre + (P − C0) · s + (C0 − L_CENTER) · sRest.
     */
    function toScreen(p: { x: number; y: number }, s: number) {
      return {
        x: vw / 2 + (p.x - C0.x) * s + (C0.x - L_CENTER.x) * sRest,
        y: vh / 2 + (p.y - C0.y) * s + (C0.y - L_CENTER.y) * sRest,
      };
    }
    function setCamera(s: number) {
      const m = Math.min(1, sRest / s);
      const fx = C0.x + (L_CENTER.x - C0.x) * m;
      const fy = C0.y + (L_CENTER.y - C0.y) * m;
      cam!.setAttribute("transform", `translate(${(vw / 2).toFixed(2)} ${(vh / 2).toFixed(2)}) scale(${s.toFixed(5)}) translate(${(-fx).toFixed(3)} ${(-fy).toFixed(3)})`);
    }
    function cameraAt(t: number) {
      if (t < T_DIVE) {
        // the seed: a slow push-in, never static
        return sSeed * lerp(0.92, 1.08, smoothstep(0, T_DIVE, t));
      }
      if (t < T_PULL) {
        // dive: accelerate into the dot (log space, so every e-fold takes the same "push")
        const e = inExpo(span(t, T_DIVE, DIVE));
        return Math.exp(lerp(Math.log(sSeed * 1.08), Math.log(sMax), e));
      }
      // pull-back: the fastest instant is the first — then a long settle that
      // keeps drifting a hair past rest, so the mark is never frozen
      const e = outExpo(span(t, T_PULL, PULL));
      const s = Math.exp(lerp(Math.log(sMax), Math.log(sRest), e));
      return s * (1 - 0.025 * smoothstep(T_PULL + PULL * 0.6, T_END, t));
    }

    function putDot(el: SVGPathElement, c: { x: number; y: number }, at: { x: number; y: number }, sc: number, op: number) {
      el.setAttribute(
        "transform",
        `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)}) scale(${Math.max(0, sc).toFixed(4)}) translate(${-c.x} ${-c.y})`
      );
      el.style.opacity = op.toFixed(3);
    }

    // ── hand-off ────────────────────────────────────────────────────
    type Rect = { l: number; t: number; w: number; h: number };
    let hero: Rect | null = null;
    let flyStarted = false;
    let mediaShown = false;
    let pctOut = false;

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
        duration: 820,
        delay: 60,
        easing: ease,
        fill: "forwards",
      });
      grid!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 640, easing: ease, fill: "forwards" });
    }

    function setClip(r: Rect, radius: number) {
      const w = Math.max(0, r.w), h = Math.max(0, r.h);
      const rad = Math.min(radius, h / 2, w / 2);
      morph!.style.clipPath = `inset(${r.t.toFixed(2)}px ${(vw - r.l - w).toFixed(2)}px ${(vh - r.t - h).toFixed(2)}px ${r.l.toFixed(2)}px round ${rad.toFixed(2)}px)`;
    }

    function handFrame(t: number, s: number) {
      // the capsule: the lowercase band of the name, swept in from the left
      const a = toScreen({ x: BAND.x0, y: BAND.y0 }, s);
      const b = toScreen({ x: BAND.x1, y: BAND.y1 }, s);
      const sw = sweepEase(span(t, T_BAR, BAR));
      const band: Rect = { l: a.x, t: a.y, w: (b.x - a.x) * sw, h: b.y - a.y };
      morph!.style.opacity = "1";

      if (!flyStarted && t >= T_FLY) startFly();
      if (!flyStarted || !hero) {
        if (flyStarted) morph!.style.opacity = (1 - smoothstep(T_FLY, T_FLY + 0.45, t)).toFixed(3);
        setClip(band, band.h / 2);
        return;
      }

      // flight: position barely overshoots, size settles into the card like jelly
      const tf = t - T_FLY;
      const ep = spring(tf, 9, 0.72);
      const es = spring(tf, 9, 0.5);
      const cx = band.l + band.w / 2, cy = band.t + band.h / 2;
      const hx = hero.l + hero.w / 2, hy = hero.t + hero.h / 2;
      const arc = Math.sin(Math.PI * clamp01(ep)) * Math.min(80, vh * 0.07);
      const x = lerp(cx, hx, ep);
      const y = lerp(cy, hy, ep) - arc;
      const w = lerp(band.w, hero.w, es);
      const h = lerp(band.h, hero.h, es);
      if (!mediaShown && t >= T_MEDIA) {
        mediaShown = true;
        document.body.classList.add("media-ready"); // video fades in under the capsule
      }
      morph!.style.opacity = (1 - smoothstep(T_MEDIA, T_MEDIA + DISSOLVE, t)).toFixed(3);
      setClip({ l: x - w / 2, t: y - h / 2, w, h }, lerp(band.h / 2, 20, clamp01(es)));
    }

    function done() {
      if (finished) return;
      finished = true;
      clearTimeout(failsafe);
      document.body.classList.add("site-ready", "media-ready");
      loader!.remove();
    }

    // ── one clock ───────────────────────────────────────────────────
    function tick(ts: number) {
      if (t0 === null) t0 = ts;
      const t = (ts - t0) / 1000;

      const s = cameraAt(t);
      setCamera(s);

      // seed: the dot is born (spring from nothing), the twin springs out of it
      const born = spring(t - T_POP, 20, 0.42);
      putDot(dot!, C0, C0, born, t >= T_POP ? 1 : 0);
      const k = spring(t - T_SPLIT, 15, 0.45);
      const hop = Math.sin(Math.PI * span(t, T_SPLIT, 0.26)) * 34;
      putDot(twin!, C1, { x: lerp(C0.x, C1.x, k), y: lerp(C0.y, C1.y, k) - hop }, lerp(0.7, 1, clamp01(k)), t >= T_SPLIT ? smoothstep(0, 0.06, t - T_SPLIT) : 0);

      // the name exists only from the hidden cut on — it is revealed by the
      // camera pulling out, never faded in
      body!.style.opacity = t >= T_PULL ? "1" : "0";

      // bar: the name collapses down into the band as the capsule sweeps over it
      if (t >= T_BAR) {
        const c = inOutCubic(span(t, T_BAR + 0.06, 0.32));
        const yb = (BAND.y0 + BAND.y1) / 2;
        mark!.setAttribute("transform", `translate(0 ${yb}) scale(1 ${(1 - 0.75 * c).toFixed(4)}) translate(0 ${-yb})`);
        mark!.style.opacity = (1 - span(t, T_BAR + 0.22, 0.14)).toFixed(3);
        handFrame(t, s);
      }

      // the counter rides the camera: 0 at the seed, 100 when the mark is home
      const pc = Math.round(100 * (t < T_PULL ? 0.3 * span(t, 0, T_PULL) : 0.3 + 0.7 * outExpo(span(t, T_PULL, PULL))));
      if (pc !== lastPct) {
        pct!.firstChild!.nodeValue = String(pc);
        lastPct = pc;
      }
      if (!pctOut && t >= T_BAR) {
        pctOut = true;
        pct!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" });
      }

      if (t < T_END) raf = requestAnimationFrame(tick);
      else done();
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div id="loader" ref={loaderRef} aria-hidden="true">
      <div id="ld-grid" ref={gridRef} />
      <svg id="ld-logo" ref={svgRef} xmlns="http://www.w3.org/2000/svg">
        <g ref={camRef}>
          <g ref={markRef}>
            <path id="ld-logo-fill" ref={bodyRef} d={LOGO_BODY} style={{ opacity: 0 }} />
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
          </g>
        </g>
      </svg>
      <div id="ld-pct" ref={pctRef}>
        0<span>%</span>
      </div>
      <div id="ld-morph" ref={morphRef} />
    </div>
  );
}
