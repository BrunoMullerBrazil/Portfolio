"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const HOVER_SELECTOR = "a,.svc,.cine-filter,.cine-arrow";
// Bigger "Click!" circle for card/media-style elements that open or play
// something, as opposed to plain links/buttons (small ring only). A data
// attribute survives CSS Modules' class-name hashing on /design and
// /trajetoria, where a plain ".foo" selector wouldn't match.
const CLICK_SELECTOR = '[data-cursor="click"],.work-card';

export default function Cursor() {
  const { lang } = useLanguage();
  const dotRef = useRef<SVGSVGElement>(null);
  const inkRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cur = dotRef.current;
    const ink = inkRef.current;
    const ring = ringRef.current;
    const lbl = labelRef.current;
    if (!cur || !ink || !ring || !lbl) return;

    /*
     * Both pieces are masses on springs following the pointer, integrated
     * on real time (same feel at 60, 120 or 144 Hz):
     *   dot  — stiff, near-critical: stays on the pointer, only rounds off
     *          the jitter of raw mouse events;
     *   ring — soft, a little underdamped: it trails on a curve, swings
     *          past on a sharp turn and settles back.
     *
     * The dot is drawn as the path it just travelled (the last TAIL ms), as
     * one round-capped stroke: still, it is a round dot; fast, it stretches
     * — and bends with the curve instead of being a straight dash.
     */
    const TAIL = 0.026; // seconds of path the dot drags behind it
    const MAX_LEN = 30; // px — longest the stretched dot gets
    const dot = { x: 0, y: 0, vx: 0, vy: 0 };
    const rng = { x: 0, y: 0, vx: 0, vy: 0 };
    const hist: { x: number; y: number; t: number }[] = [];
    let mx = 0,
      my = 0,
      seen = false,
      rAng = 0,
      size = 8,
      clock = 0,
      last = 0;

    function onMouseMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (!seen) {
        // first contact: start where the pointer is, not flying in from 0,0
        seen = true;
        dot.x = rng.x = mx;
        dot.y = rng.y = my;
        dot.vx = dot.vy = rng.vx = rng.vy = 0;
        hist.length = 0;
        cur!.style.opacity = "1";
      }
    }
    document.addEventListener("mousemove", onMouseMove);

    function step(b: typeof dot, w: number, z: number, h: number) {
      b.vx += (w * w * (mx - b.x) - 2 * z * w * b.vx) * h;
      b.vy += (w * w * (my - b.y) - 2 * z * w * b.vy) * h;
      b.x += b.vx * h;
      b.y += b.vy * h;
    }
    // ease an angle (deg) towards a target the short way round
    function turn(a: number, target: number, k: number) {
      const d = ((target - a + 540) % 360) - 180;
      return a + d * k;
    }
    // the dot grows on links and media, like the old CSS width transition did
    function targetSize() {
      const c = document.body.classList;
      if (c.contains("cursor-play")) return 13;
      if (c.contains("cursor-hover") && (c.contains("hero-mode") || c.contains("dark-mode"))) return 13;
      return 8;
    }

    // smooth path through the trail: straight to the first midpoint, then
    // quadratic curves through every midpoint
    function trailPath() {
      const n = hist.length;
      if (n < 2) return `M${dot.x.toFixed(2)} ${dot.y.toFixed(2)}l0.01 0`;
      let d = `M${hist[0].x.toFixed(2)} ${hist[0].y.toFixed(2)}`;
      for (let i = 1; i < n - 1; i++) {
        const mxp = (hist[i].x + hist[i + 1].x) / 2, myp = (hist[i].y + hist[i + 1].y) / 2;
        d += `Q${hist[i].x.toFixed(2)} ${hist[i].y.toFixed(2)} ${mxp.toFixed(2)} ${myp.toFixed(2)}`;
      }
      d += `L${hist[n - 1].x.toFixed(2)} ${hist[n - 1].y.toFixed(2)}`;
      return d;
    }

    let raf: number;
    function animate(ts: number) {
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      const H = 1 / 240;
      for (let t = 0; t < dt; t += H) {
        const h = Math.min(H, dt - t);
        step(dot, 55, 0.82, h);
        step(rng, 13, 0.58, h);
        clock += h;
        hist.push({ x: dot.x, y: dot.y, t: clock });
      }
      while (hist.length > 1 && hist[0].t < clock - TAIL) hist.shift();
      // cap the length from the head backwards
      let len = 0;
      for (let i = hist.length - 1; i > 0; i--) {
        len += Math.hypot(hist[i].x - hist[i - 1].x, hist[i].y - hist[i - 1].y);
        if (len > MAX_LEN) {
          hist.splice(0, i - 1);
          break;
        }
      }

      // the stroke thins a little as it stretches (the old squash)
      size += (targetSize() - size) * (1 - Math.exp(-dt * 16));
      const spd = Math.hypot(dot.vx, dot.vy);
      const thin = 1 - 0.35 * Math.min(1, spd / 1600);
      ink!.setAttribute("d", trailPath());
      ink!.setAttribute("stroke-width", (size * thin).toFixed(2));

      // ring: a soft, jelly stretch along its travel
      const rs = Math.hypot(rng.vx, rng.vy);
      const rst = Math.min(1 + rs * 0.00028, 1.22);
      if (rs > 30) rAng = turn(rAng, (Math.atan2(rng.vy, rng.vx) * 180) / Math.PI, 1 - Math.exp(-dt * 14));
      ring!.style.transform =
        `translate3d(${rng.x.toFixed(2)}px,${rng.y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${rAng.toFixed(1)}deg) scale(${rst.toFixed(3)},${(1 / Math.sqrt(rst)).toFixed(3)})`;

      lbl!.style.transform = `translate3d(${dot.x.toFixed(2)}px,${dot.y.toFixed(2)}px,0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const clickEl = target.closest(CLICK_SELECTOR);
      if (clickEl) {
        document.body.classList.remove("cursor-hover");
        document.body.classList.add("cursor-play");
        return;
      }
      if (target.closest(HOVER_SELECTOR)) {
        document.body.classList.add("cursor-hover");
      }
    }
    function onOut(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const related = e.relatedTarget as HTMLElement | null;
      const clickEl = target.closest(CLICK_SELECTOR);
      if (clickEl && (!related || !clickEl.contains(related))) {
        document.body.classList.remove("cursor-play");
      }
      const hoverEl = target.closest(HOVER_SELECTOR);
      if (hoverEl && (!related || !hoverEl.contains(related))) {
        document.body.classList.remove("cursor-hover");
      }
    }
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <>
      <svg id="cursor" ref={dotRef} aria-hidden="true">
        <path ref={inkRef} d="M0 0" />
      </svg>
      <div id="cursor-ring" ref={ringRef} />
      <div id="cursor-label" ref={labelRef}>
        <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
          <defs>
            <path id="cursorOrbitPath" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
          </defs>
          <text>
            <textPath href="#cursorOrbitPath">
              {lang === "en"
                ? "Watch \u2022 Watch \u2022 Watch \u2022 Watch \u2022 "
                : "Assistir \u2022 Assistir \u2022 Assistir \u2022 "}
            </textPath>
          </text>
        </svg>
      </div>
    </>
  );
}
