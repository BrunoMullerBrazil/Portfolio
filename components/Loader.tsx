"use client";

import { useEffect, useRef } from "react";
import { LOGO_BODY, LOGO_DOTS, LOGO_DOT_CENTERS } from "./Logo";

/*
 * Loader — "o trema".
 *
 * Reference principle (Shimi Cohen's BOLD): continuity of shape — one
 * small element of the wordmark becomes a character, travels, and lands
 * where it belongs; then the whole word is swallowed by a capsule that
 * becomes the next thing on screen.
 *
 * Translated to Müller:
 *   1. The two umlaut dots drop in alone and hop across the baseline as a
 *      pair. The ink follows them — they "paint" the name as they go.
 *   2. They flip back in one long arc and land on the ü with a squash.
 *      The mark is complete the moment the dots land.
 *   3. The name is swallowed into a capsule, and the capsule flies into
 *      the hero's video card, taking its exact size, position and radius.
 *      The loader's last frame is the site's first frame.
 *
 * The only place on the site with elastic physics (squash/stretch): the
 * dots are a character, everything else stays on the house expo curve.
 */

const VB = { x: 160, y: 720, w: 1700, h: 480 };
const REST_Y = 905; // contact line: top of the lowercase
const HOPS = [230, 560, 900, 1230, 1560, 1830]; // leader contact x's
const PAIR = LOGO_DOT_CENTERS[1].x - LOGO_DOT_CENTERS[0].x;
const LAG = 0.07; // follower dot trails the leader (s)
const ARC = 150;

// timeline (seconds)
const T_DROP0 = 0.25;
const T_DROP1 = 0.62;
const HOP_D = 0.19;
const T_HOP0 = T_DROP1;
const T_HOP1 = T_HOP0 + HOP_D * (HOPS.length - 1);
const T_RET0 = T_HOP1 + 0.08;
const T_RET1 = T_RET0 + 0.5;
const SETTLE = 0.16;
const T_SWALLOW = T_RET1 + SETTLE + 0.22;
const T_END = T_SWALLOW + 0.1; // hand over to the capsule (WAAPI)

type Pose = { x: number; y: number; rot: number; sx: number; sy: number; vis: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// squash right after a contact, decaying over `d` seconds
function squash(since: number, d = 0.12, k = 0.34) {
  if (since < 0 || since > d) return { sx: 1, sy: 1 };
  const v = since / d;
  const a = Math.sin(Math.PI * v) * (1 - v * 0.4) * k;
  return { sx: 1 + a * 0.7, sy: 1 - a };
}

// Leader dot pose at time t (follower = same path, +PAIR in x, LAG later)
function pose(t: number): Pose {
  const end = LOGO_DOT_CENTERS[0];
  if (t < T_DROP0) return { x: HOPS[0], y: REST_Y - 360, rot: 0, sx: 1, sy: 1, vis: 0 };
  if (t < T_DROP1) {
    const u = (t - T_DROP0) / (T_DROP1 - T_DROP0);
    return { x: HOPS[0], y: lerp(REST_Y - 360, REST_Y, u * u), rot: 0, sx: 0.9, sy: 1.12, vis: 1 };
  }
  if (t < T_HOP1) {
    const i = Math.min(HOPS.length - 2, Math.floor((t - T_HOP0) / HOP_D));
    const local = t - T_HOP0 - i * HOP_D;
    const u = local / HOP_D;
    const sq = squash(local, 0.1);
    return {
      x: lerp(HOPS[i], HOPS[i + 1], u),
      y: REST_Y - 4 * ARC * u * (1 - u),
      rot: lerp(-14, 14, u),
      sx: sq.sx,
      sy: sq.sy,
      vis: 1,
    };
  }
  if (t < T_RET0) {
    const sq = squash(t - T_HOP1);
    return { x: HOPS[HOPS.length - 1], y: REST_Y, rot: 0, sx: sq.sx, sy: sq.sy, vis: 1 };
  }
  if (t < T_RET1) {
    const ul = (t - T_RET0) / (T_RET1 - T_RET0);
    const u = inOut(ul);
    return {
      x: lerp(HOPS[HOPS.length - 1], end.x, u),
      y: lerp(REST_Y, end.y, u) - 4 * 320 * ul * (1 - ul),
      rot: -360 * u,
      sx: 1,
      sy: 1,
      vis: 1,
    };
  }
  const sq = squash(t - T_RET1, SETTLE, 0.4);
  return { x: end.x, y: end.y, rot: 0, sx: sq.sx, sy: sq.sy, vis: 1 };
}

export default function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const dotRefs = useRef<(SVGPathElement | null)[]>([]);
  const pctRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    const svg = svgRef.current;
    const rect = rectRef.current;
    const pct = pctRef.current;
    const morph = morphRef.current;
    const grid = gridRef.current;
    if (!loader || !svg || !rect || !pct || !morph || !grid) return;

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
    let inkX = VB.x;
    let lastPct = -1;

    function writeDot(i: number, p: Pose) {
      const el = dotRefs.current[i];
      if (!el) return;
      const c = LOGO_DOT_CENTERS[i];
      const x = p.x + (i === 1 ? PAIR : 0);
      const y = p.y + (i === 1 ? c.y - LOGO_DOT_CENTERS[0].y : 0);
      el.setAttribute(
        "transform",
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${p.rot.toFixed(1)}) scale(${p.sx.toFixed(3)} ${p.sy.toFixed(3)}) translate(${-c.x} ${-c.y})`
      );
      el.style.opacity = String(p.vis);
    }

    function tick(ts: number) {
      if (t0 === null) t0 = ts;
      const t = (ts - t0) / 1000;
      const lead = pose(t);
      const follow = pose(t - LAG);
      writeDot(0, lead);
      writeDot(1, follow);

      // ink follows the front dot; once they turn back, the name completes
      if (t < T_RET0) inkX = Math.max(inkX, follow.vis ? follow.x + PAIR + 40 : VB.x);
      else inkX = lerp(inkX, VB.x + VB.w, 0.25);
      rect!.setAttribute("width", Math.max(0, inkX - VB.x).toFixed(1));
      const p = Math.round(clamp01((inkX - VB.x) / VB.w) * 100);
      if (p !== lastPct) {
        pct!.firstChild!.nodeValue = String(p);
        lastPct = p;
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
        { duration: 360, easing: ease, fill: "forwards" }
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
          { duration: 820, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" }
        );
        fly.onfinish = () => {
          // card is exactly under the capsule now: reveal the video, dissolve the capsule
          document.body.classList.add("media-ready");
          morph!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: ease, fill: "forwards" }).onfinish =
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
            <clipPath id="ld-fill-clip">
              <rect ref={rectRef} id="ld-fill-rect" x="160" y="600" width="0" height="700" />
            </clipPath>
          </defs>
          <path id="ld-logo-ghost" d={LOGO_BODY} />
          <path id="ld-logo-fill" d={LOGO_BODY} clipPath="url(#ld-fill-clip)" />
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
