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
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cur = dotRef.current;
    const ring = ringRef.current;
    const lbl = labelRef.current;
    if (!cur || !ring || !lbl) return;

    /*
     * Both pieces are masses on springs following the pointer, integrated
     * on real time (same feel at 60, 120 or 144 Hz):
     *   dot  — stiff, near-critical: stays on the pointer, only rounds off
     *          the jitter of raw mouse events;
     *   ring — soft, a little underdamped: it trails on a curve, swings
     *          past on a sharp turn and settles back.
     * The dot's squash/stretch and angle come from its own smooth velocity,
     * and the angle turns the short way round, so it never snaps.
     */
    const dot = { x: 0, y: 0, vx: 0, vy: 0 };
    const rng = { x: 0, y: 0, vx: 0, vy: 0 };
    let mx = 0,
      my = 0,
      seen = false,
      ang = 0,
      rAng = 0,
      last = 0;

    function onMouseMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (!seen) {
        // first contact: start where the pointer is, not flying in from 0,0
        seen = true;
        dot.x = rng.x = mx;
        dot.y = rng.y = my;
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

    let raf: number;
    function animate(ts: number) {
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      const H = 1 / 240;
      for (let t = 0; t < dt; t += H) {
        const h = Math.min(H, dt - t);
        step(dot, 55, 0.82, h);
        step(rng, 13, 0.58, h);
      }

      // dot: stretch along its travel, squash across it
      const spd = Math.hypot(dot.vx, dot.vy);
      const str = Math.min(1 + spd * 0.0019, 2.6);
      const sq = Math.max(1 / str, 0.38);
      if (spd > 40) ang = turn(ang, (Math.atan2(dot.vy, dot.vx) * 180) / Math.PI, 1 - Math.exp(-dt * 22));
      cur!.style.transform =
        `translate3d(${dot.x.toFixed(2)}px,${dot.y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${ang.toFixed(1)}deg) scale(${str.toFixed(3)},${sq.toFixed(3)})`;

      // ring: a softer, jelly version of the same
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
      <div id="cursor" ref={dotRef} />
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
