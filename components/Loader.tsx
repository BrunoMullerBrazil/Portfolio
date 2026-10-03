"use client";

import { useEffect, useRef } from "react";
import { LOGO_BODY, LOGO_DOTS, LOGO_DOT_CENTERS } from "./Logo";
import { WRITE_STROKES } from "./logoWriting";

/*
 * Loader — escrita + trema.
 *
 * Reference principle (Shimi Cohen's BOLD): continuity of shape — the mark
 * is built by a gesture, a small part of it becomes a character, and the
 * whole word turns into the next thing on screen.
 *
 * Translated to Müller:
 *   1. The name is written by hand: 11 centre-line strokes in writing order
 *      (components/logoWriting.ts) reveal the ink through an SVG mask, pen
 *      lifts between strokes, each stroke easing like a real hand.
 *   2. The ü is dotted last, as in handwriting: the two umlaut dots drop in
 *      and land with a squash. The mark is complete the moment they land.
 *   3. The name is swallowed into a capsule, and the capsule flies into
 *      the hero's video card, taking its exact size, position and radius.
 *      The loader's last frame is the site's first frame.
 *
 * The only place on the site with elastic physics (the dots' squash):
 * everything else stays on the house expo curve.
 */

const VB = { x: 160, y: 720, w: 1700, h: 480 };
const F = 1000 / 24; // one frame at 24fps, in ms
const REST_Y = 905; // top of the lowercase — capsule's upper edge
const LAG = 0.08; // second dot trails the first (s)

// timeline (seconds)
const T_WRITE0 = 0.15;
const WRITE_DUR = 32 / 24; // pen-on-paper time for the whole name (32 frames)
const LIFT = 0.025; // pen lift between strokes
const T_WRITE1 = T_WRITE0 + WRITE_DUR + LIFT * (WRITE_STROKES.length - 1);
const T_DOT0 = T_WRITE1 + 0.08;
const FALL = 0.26;
// land → rebound → land: the one real bounce on the site (the dots are a character)
const SQ1 = 0.07; // first contact squash
const HOP = 0.17; // rebound airtime
const HOP_H = 30; // rebound height (viewBox units)
const SQ2 = 0.12; // second, softer contact
const SETTLE = SQ1 + HOP + SQ2;
const T_DOTS_DONE = T_DOT0 + LAG + FALL + SETTLE;
const T_END = T_DOTS_DONE + 0.12; // hand over to the capsule (WAAPI)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

// squash right after a contact, decaying over `d` seconds
function squash(since: number, d: number, k = 0.4) {
  if (since < 0 || since > d) return { sx: 1, sy: 1 };
  const v = since / d;
  const a = Math.sin(Math.PI * v) * (1 - v * 0.4) * k;
  return { sx: 1 + a * 0.7, sy: 1 - a };
}

// one umlaut dot dropping onto the ü: gravity fall, then squash on landing
function dotPose(t: number) {
  if (t < 0) return { dy: -260, sx: 1, sy: 1, vis: 0 };
  if (t < FALL) {
    const u = t / FALL;
    return { dy: -260 * (1 - u * u), sx: 0.88, sy: 1.16, vis: 1 };
  }
  const tl = t - FALL;
  if (tl < SQ1) {
    const sq = squash(tl, SQ1, 0.42);
    return { dy: 0, sx: sq.sx, sy: sq.sy, vis: 1 };
  }
  if (tl < SQ1 + HOP) {
    const u = (tl - SQ1) / HOP;
    return { dy: -4 * HOP_H * u * (1 - u), sx: 0.94, sy: 1.07, vis: 1 };
  }
  const sq = squash(tl - SQ1 - HOP, SQ2, 0.18);
  return { dy: 0, sx: sq.sx, sy: sq.sy, vis: 1 };
}

export default function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGPathElement | null)[]>([]);
  const pctRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    const svg = svgRef.current;
    const pct = pctRef.current;
    const morph = morphRef.current;
    const grid = gridRef.current;
    if (!loader || !svg || !pct || !morph || !grid) return;

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

    // Writing schedule: each stroke's time share is its share of the total
    // length, so the pen keeps a constant average speed across the name.
    const strokes = strokeRefs.current.filter(Boolean) as SVGPathElement[];
    const lens = strokes.map((p) => p.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let acc = T_WRITE0;
    const sched = lens.map((L) => {
      const start = acc;
      const end = start + (L / total) * WRITE_DUR;
      acc = end + LIFT;
      return { start, end };
    });
    strokes.forEach((p, i) => {
      p.style.strokeDasharray = `${lens[i]} ${lens[i]}`;
      p.style.strokeDashoffset = String(lens[i]);
    });

    function writeDot(i: number, t: number) {
      const el = dotRefs.current[i];
      if (!el) return;
      const c = LOGO_DOT_CENTERS[i];
      const p = dotPose(t);
      el.setAttribute(
        "transform",
        `translate(${c.x} ${(c.y + p.dy).toFixed(1)}) scale(${p.sx.toFixed(3)} ${p.sy.toFixed(3)}) translate(${-c.x} ${-c.y})`
      );
      el.style.opacity = String(p.vis);
    }

    function tick(ts: number) {
      if (t0 === null) t0 = ts;
      const t = (ts - t0) / 1000;

      let written = 0;
      strokes.forEach((p, i) => {
        const { start, end } = sched[i];
        const u = clamp01((t - start) / (end - start));
        p.style.visibility = t >= start ? "visible" : "hidden";
        p.style.strokeDashoffset = (lens[i] * (1 - easeInOutSine(u))).toFixed(1);
        written += lens[i] * u;
      });
      writeDot(0, t - T_DOT0);
      writeDot(1, t - T_DOT0 - LAG);

      const pc = Math.round(clamp01(written / total) * 100);
      if (pc !== lastPct) {
        pct!.firstChild!.nodeValue = String(pc);
        lastPct = pc;
      }

      if (t < T_END) raf = requestAnimationFrame(tick);
      else handOff();
    }
    raf = requestAnimationFrame(tick);

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
            <mask id="ld-write" maskUnits="userSpaceOnUse" x="80" y="640" width="1860" height="620">
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
            </mask>
          </defs>
          <path id="ld-logo-fill" d={LOGO_BODY} mask="url(#ld-write)" />
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
