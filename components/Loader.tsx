"use client";

import { useEffect, useRef } from "react";
import { LOGO_BODY, LOGO_DOTS, LOGO_DOT_CENTERS } from "./Logo";
import { WRITE_STROKES } from "./logoWriting";

/*
 * Loader — a pena.
 *
 * The umlaut dot is shaped like a broad calligraphy nib (slanted, flat), so
 * it becomes the pen: it writes "Müller" at a fixed nib angle, then flies
 * up and lands on the ü, and the second dot splits out of it. The mark is
 * complete the moment the trema is whole. Then the name is swallowed into
 * a capsule that flies into the hero's video card (last frame of the
 * loader = first frame of the site).
 *
 * What keeps it from reading as a procedural wipe:
 *   - one continuous hand: speed comes from the path itself — the pen slows
 *     into tight curves and runs on straights, eases only where it lands or
 *     lifts, and travels through the air between strokes (no 11 full stops);
 *   - ink, not a mask: the reveal edge is softened (blurred mask), so the
 *     leading edge bleeds like ink; the mask comes off once the name is done;
 *   - someone is holding the pen: the nib is visible, with a soft glow.
 */

const VB = { x: 160, y: 720, w: 1700, h: 480 };
const F = 1000 / 24; // one frame at 24fps, in ms
const REST_Y = 905; // top of the lowercase — capsule's upper edge

// timeline (seconds)
const T_WRITE0 = 0.2;
const WRITE_DUR = 1.75; // the whole name, lifts included
const NIB_FLY = 0.4; // nib: end of the r → ü
const LAND = 0.12;
const SPLIT = 0.2; // second dot hops out of the first
const SPLIT_LAND = 0.12;
const T_WRITE1 = T_WRITE0 + WRITE_DUR;
const T_LAND = T_WRITE1 + NIB_FLY;
const T_SPLIT = T_LAND + LAND * 0.6;
const T_END = T_SPLIT + SPLIT + SPLIT_LAND + 0.12;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function squash(since: number, d: number, k = 0.4) {
  if (since < 0 || since > d) return { sx: 1, sy: 1 };
  const v = since / d;
  const a = Math.sin(Math.PI * v) * (1 - v * 0.4) * k;
  return { sx: 1 + a * 0.7, sy: 1 - a };
}

type Pt = { x: number; y: number };
type StrokePlan = { path: SVGPathElement; L: number; t0: number; t1: number; ts: number[]; ls: number[]; a: Pt; b: Pt };

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
      const ends = 0.5 + 0.5 * smoothstep(0, 45, s) * smoothstep(0, 45, L - s);
      const speed = ends / (1 + 60 * curv);
      t += ds / speed;
      ts.push(t);
      ls.push(s);
    }
    return { path, L, dur: t, ts, ls, a: pts[0], b: pts[n] };
  });
  const lifts = raw.map((r, i) => {
    const nx = raw[i + 1];
    if (!nx) return 0;
    const gap = Math.hypot(nx.a.x - r.b.x, nx.a.y - r.b.y);
    return gap < 30 ? 25 : 120 + gap * 0.9; // the pen travels in the air, not teleports
  });
  const total = raw.reduce((acc, r, i) => acc + r.dur + lifts[i], 0);
  const k = WRITE_DUR / total;
  let clock = T_WRITE0;
  return raw.map((r, i) => {
    const t0 = clock;
    const t1 = t0 + r.dur * k;
    clock = t1 + lifts[i] * k;
    return { path: r.path, L: r.L, t0, t1, ts: r.ts.map((v) => t0 + v * k), ls: r.ls, a: r.a, b: r.b };
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

export default function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGPathElement | null)[]>([]);
  const pctRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    const svg = svgRef.current;
    const fill = fillRef.current;
    const pct = pctRef.current;
    const morph = morphRef.current;
    const grid = gridRef.current;
    if (!loader || !svg || !fill || !pct || !morph || !grid) return;

    const heroMedia = () => document.getElementById("heroMedia");
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
    plan.forEach((p) => {
      p.path.style.strokeDasharray = `${p.L} ${p.L}`;
      p.path.style.strokeDashoffset = String(p.L);
    });

    const C0 = LOGO_DOT_CENTERS[0];
    const C1 = LOGO_DOT_CENTERS[1];
    const nib = dotRefs.current[0]!;
    const twin = dotRefs.current[1]!;

    function put(el: SVGPathElement, c: Pt, p: Pt, sx: number, sy: number, op: number) {
      el.setAttribute(
        "transform",
        `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-c.x} ${-c.y})`
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
          const u = smoothstep(prev.t1, s.t0, t);
          const gap = Math.hypot(s.a.x - prev.b.x, s.a.y - prev.b.y);
          return {
            p: { x: lerp(prev.b.x, s.a.x, u), y: lerp(prev.b.y, s.a.y, u) - Math.sin(Math.PI * u) * Math.min(70, gap * 0.25) },
            air: Math.sin(Math.PI * u),
          };
        }
        if (t <= s.t1) {
          const q = s.path.getPointAtLength(lengthAt(s, t));
          return { p: { x: q.x, y: q.y }, air: 0 };
        }
      }
      return { p: plan[plan.length - 1].b, air: 0 };
    }

    function tick(ts: number) {
      if (t0 === null) t0 = ts;
      const t = (ts - t0) / 1000;

      // ink
      let written = 0;
      plan.forEach((s) => {
        const len = lengthAt(s, t);
        s.path.style.visibility = t >= s.t0 ? "visible" : "hidden";
        s.path.style.strokeDashoffset = (s.L - len).toFixed(1);
        written += len;
      });
      if (!unmasked && t >= T_WRITE1 + 0.05) {
        fill!.removeAttribute("mask"); // crisp final edges
        unmasked = true;
      }

      // the nib
      if (t < T_WRITE0) {
        put(nib, C0, plan[0].a, 0.9, 0.9, 0);
      } else if (t <= T_WRITE1) {
        const { p, air } = penAt(t);
        const fadeIn = smoothstep(T_WRITE0, T_WRITE0 + 0.12, t);
        put(nib, C0, p, 0.86 + air * 0.08, 0.86 + air * 0.08, fadeIn);
        nib.classList.add("nib");
      } else if (t < T_LAND) {
        // flies up from the end of the r and lands on the ü
        const u = (t - T_WRITE1) / NIB_FLY;
        const e = inOutCubic(u);
        const from = plan[plan.length - 1].b;
        const p = { x: lerp(from.x, C0.x, e), y: lerp(from.y, C0.y, e) - Math.sin(Math.PI * u) * 230 };
        put(nib, C0, p, lerp(0.86, 1, e), lerp(0.86, 1, e), 1);
      } else {
        nib.classList.remove("nib");
        const sq = squash(t - T_LAND, LAND, 0.42);
        put(nib, C0, C0, sq.sx, sq.sy, 1);
      }

      // the second dot splits out of the first and hops to its place
      if (t < T_SPLIT) {
        put(twin, C1, C0, 1, 1, 0);
      } else if (t < T_SPLIT + SPLIT) {
        const u = (t - T_SPLIT) / SPLIT;
        const e = inOutCubic(u);
        const p = { x: lerp(C0.x, C1.x, e), y: lerp(C0.y, C1.y, e) - Math.sin(Math.PI * u) * 46 };
        put(twin, C1, p, 0.94, 1.06, smoothstep(0, 0.2, u));
      } else {
        const sq = squash(t - T_SPLIT - SPLIT, SPLIT_LAND, 0.3);
        put(twin, C1, C1, sq.sx, sq.sy, 1);
      }

      const pc = Math.round(clamp01(written / totalLen) * 100);
      if (pc !== lastPct) {
        pct!.firstChild!.nodeValue = String(pc);
        lastPct = pc;
      }

      if (t < T_END) raf = requestAnimationFrame(tick);
      else handOff();
    }
    // Returning in the same session: the name is already written — show the
    // finished mark for a beat and go straight to the capsule → video handoff.
    // The full writing plays once per session.
    let quick = false;
    try {
      quick = sessionStorage.getItem("muller-intro") === "1";
      sessionStorage.setItem("muller-intro", "1");
    } catch {}
    let quickTimer: ReturnType<typeof setTimeout> | undefined;
    if (quick) {
      plan.forEach((st) => {
        st.path.style.visibility = "visible";
        st.path.style.strokeDashoffset = "0";
      });
      fill.removeAttribute("mask");
      put(nib, C0, C0, 1, 1, 1);
      put(twin, C1, C1, 1, 1, 1);
      pct.firstChild!.nodeValue = "100";
      quickTimer = setTimeout(handOff, 380);
    } else {
      raf = requestAnimationFrame(tick);
    }

    // ── 3. capsule → hero card ──────────────────────────────────────
    function handOff() {
      if (finished) return;
      const sr = svg!.getBoundingClientRect();
      const s = sr.width / VB.w;
      // capsule = the lowercase band of the wordmark
      const cap = {
        left: sr.left + (173 - VB.x) * s,
        top: sr.top + (REST_Y - VB.y) * s,
        width: (1854 - 173) * s,
        height: (1186 - REST_Y) * s,
      };
      Object.assign(morph!.style, {
        left: cap.left + "px",
        top: cap.top + "px",
        width: cap.width + "px",
        height: cap.height + "px",
        borderRadius: cap.height / 2 + "px",
        opacity: "1",
      });

      const ease = "cubic-bezier(.16,1,.3,1)";
      const swallow = morph!.animate(
        [{ clipPath: "inset(0 50% 0 50% round 999px)" }, { clipPath: "inset(0 0% 0 0% round 999px)" }],
        { duration: F * 8, easing: ease, fill: "forwards" }
      );
      svg!.animate([{ opacity: 1, transform: "scaleX(1)" }, { opacity: 0, transform: "scaleX(.94)" }], {
        duration: 260,
        delay: 90,
        easing: ease,
        fill: "forwards",
      });
      pct!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });

      swallow.onfinish = () => {
        morph!.style.clipPath = "none";
        swallow.cancel();
        const hm = heroMedia();
        const hr = hm?.getBoundingClientRect();
        const onScreen =
          hr && hr.width > 0 && hr.bottom > 0 && hr.top < window.innerHeight && hr.right > 0 && hr.left < window.innerWidth;

        // the site starts arriving underneath while the capsule travels
        document.body.classList.add("site-ready");
        loader!.animate([{ backgroundColor: "rgba(14,16,12,1)" }, { backgroundColor: "rgba(14,16,12,0)" }], {
          duration: 760,
          easing: ease,
          fill: "forwards",
        });
        grid!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 640, easing: ease, fill: "forwards" });

        if (!onScreen || !hm || !hr) {
          morph!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).onfinish = () => {
            clearTimeout(failsafe);
            finishPlain();
          };
          return;
        }

        const fly = morph!.animate(
          [
            { left: cap.left + "px", top: cap.top + "px", width: cap.width + "px", height: cap.height + "px", borderRadius: cap.height / 2 + "px" },
            { left: hr.left + "px", top: hr.top + "px", width: hr.width + "px", height: hr.height + "px", borderRadius: "20px" },
          ],
          { duration: F * 18, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" }
        );
        fly.onfinish = () => {
          // card is exactly under the capsule now: reveal the video, dissolve the capsule
          document.body.classList.add("media-ready");
          morph!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: F * 10, easing: ease, fill: "forwards" }).onfinish =
            () => {
              finished = true;
              clearTimeout(failsafe);
              loader!.remove();
            };
        };
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
      if (quickTimer) clearTimeout(quickTimer);
    };
  }, []);

  return (
    <div id="loader" ref={loaderRef} aria-hidden="true">
      <div id="ld-grid" ref={gridRef} />
      <div id="ld-center">
        <svg
          id="ld-logo"
          ref={svgRef}
          viewBox="160 720 1700 480"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="ld-soft" x="-5%" y="-10%" width="110%" height="120%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <filter id="ld-glow" x="-100%" y="-200%" width="300%" height="500%">
              <feGaussianBlur stdDeviation="14" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <mask id="ld-write" maskUnits="userSpaceOnUse" x="80" y="640" width="1860" height="620">
              <g filter="url(#ld-soft)">
              {WRITE_STROKES.map((st, i) => (
                <path
                  key={i}
                  d={st.d}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={st.w}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ visibility: "hidden" }}
                  ref={(el) => {
                    strokeRefs.current[i] = el;
                  }}
                />
              ))}
              </g>
            </mask>
          </defs>
          <path id="ld-logo-fill" ref={fillRef} d={LOGO_BODY} mask="url(#ld-write)" />
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
    </div>
  );
}
