"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/*
 * Guide — o ponto que conduz.
 *
 * One umlaut dot (the loader's character) carries the eye through the page,
 * the way the spark carries a motion film from scene to scene:
 *
 *   baton   when a section's marker ([data-guide-mark]) comes into frame,
 *           the dot flies there in an arc from wherever it last landed —
 *           stretched along its velocity, leaving a light trail — and
 *           becomes that marker. Landing reveals the heading named in
 *           data-guide-reveal (those headings carry [data-guided] and wait).
 *   cut     on a project change (WorkIntro dispatches "guide:cut") it rides
 *           the edge of the incoming wipe, drawing the new frame in.
 *   end     the last marker sits after "Fim": the dot ends as the full stop.
 *
 * rAF runs only while something moves. Off under prefers-reduced-motion
 * (markers are simply shown, headings reveal on their own).
 */

const F = 1000 / 24;
const TRAIL = 18;
const COLOR = "200,207,168";

type Pt = { x: number; y: number };
type Flight = { mark: HTMLElement; from: Pt; t0: number; dur: number; bend: number };
type Sweep = { t0: number; dur: number; rect: DOMRect; dir: "next" | "prev" };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a: number, b: number, t: number) => {
  const u = clamp((t - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};

// CSS cubic-bezier as a JS easing (to ride the wipe that uses --ease)
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(clamp(t, 0, 1));
  };
}
const easeHouse = cubicBezier(0.16, 1, 0.3, 1);

export default function Guide() {
  const dotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const dot = dotRef.current;
    const canvas = canvasRef.current;
    if (!dot || !canvas) return;
    const marks = Array.from(document.querySelectorAll<HTMLElement>("[data-guide-mark]"));
    if (!marks.length) return;

    const reveal = (mark: HTMLElement) => {
      mark.classList.add("on");
      const sel = mark.dataset.guideReveal;
      if (sel) document.querySelector(sel)?.classList.add("visible");
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      marks.forEach(reveal);
      return;
    }

    const ctx = canvas.getContext("2d");
    let dpr = 1;
    function sizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(window.innerWidth * dpr);
      canvas!.height = Math.round(window.innerHeight * dpr);
    }
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    let pos: Pt | null = null;
    let lastMark: HTMLElement | null = null;
    let flight: Flight | null = null;
    let sweep: Sweep | null = null;
    let trail: Pt[] = [];
    let raf = 0;
    let running = false;
    let prev: Pt | null = null;
    let landT = -1;
    const done = new WeakSet<HTMLElement>();

    const center = (el: HTMLElement): Pt => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    function startPoint(): Pt {
      const vw = window.innerWidth, vh = window.innerHeight;
      const p = lastMark ? center(lastMark) : pos;
      if (!p) return { x: vw * 0.5, y: -30 };
      return { x: clamp(p.x, 12, vw - 12), y: p.y < -20 ? -30 : p.y > vh + 20 ? vh + 30 : p.y };
    }

    function land(f: Flight) {
      reveal(f.mark);
      lastMark = f.mark;
      pos = center(f.mark);
      landT = performance.now();
    }

    function fly(mark: HTMLElement) {
      if (done.has(mark)) return;
      done.add(mark);
      if (flight) land(flight); // a newer scene wins: settle the old one now
      const from = startPoint();
      const to = center(mark);
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const dur = Math.round(clamp(380 + dist * 0.55, 13 * F, 26 * F) / F) * F;
      flight = { mark, from, t0: performance.now(), dur, bend: to.x > from.x ? -1 : 1 };
      sweep = null;
      kick();
    }

    function onCut(e: Event) {
      if (flight) return;
      const d = (e as CustomEvent<{ rect: DOMRect; dir: "next" | "prev" }>).detail;
      if (!d?.rect) return;
      sweep = { t0: performance.now(), dur: 18 * F, rect: d.rect, dir: d.dir };
      kick();
    }
    window.addEventListener("guide:cut", onCut);

    // a marker is "in frame" once it clears the bottom fifth of the viewport
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && fly(en.target as HTMLElement)),
      { rootMargin: "0px 0px -22% 0px", threshold: 1 }
    );
    marks.forEach((m) => io.observe(m));

    function kick() {
      if (running) return;
      running = true;
      prev = null;
      raf = requestAnimationFrame(frame);
    }

    function place(p: Pt, w: number, h: number, ang: number, sx: number, sy: number, op: number, glow: number) {
      dot!.style.width = w.toFixed(1) + "px";
      dot!.style.height = h.toFixed(1) + "px";
      dot!.style.opacity = op.toFixed(3);
      dot!.style.boxShadow = `0 0 ${(14 * glow).toFixed(1)}px rgba(${COLOR},${(0.65 * glow).toFixed(2)})`;
      dot!.style.transform =
        `translate(${(p.x - w / 2).toFixed(1)}px,${(p.y - h / 2).toFixed(1)}px) rotate(${ang.toFixed(1)}deg) ` +
        `scale(${sx.toFixed(3)},${sy.toFixed(3)}) skewX(-21deg)`;
    }

    function frame(now: number) {
      let p: Pt | null = null;
      let w = 16, h = 6.5, op = 1, glow = 1, settle = false;

      if (flight) {
        const f = flight;
        const u = clamp((now - f.t0) / f.dur, 0, 1);
        const e = inOutCubic(u);
        const to = center(f.mark);
        const mx = (f.from.x + to.x) / 2, my = (f.from.y + to.y) / 2;
        const dx = to.x - f.from.x, dy = to.y - f.from.y;
        const len = Math.hypot(dx, dy) || 1;
        const k = Math.min(len * 0.28, 220) * f.bend;
        const cx = mx + (-dy / len) * k, cy = my + (dx / len) * k;
        p = {
          x: (1 - e) * (1 - e) * f.from.x + 2 * (1 - e) * e * cx + e * e * to.x,
          y: (1 - e) * (1 - e) * f.from.y + 2 * (1 - e) * e * cy + e * e * to.y,
        };
        const mr = f.mark.getBoundingClientRect();
        w = lerp(16, mr.width, smooth(0.72, 1, u));
        h = lerp(6.5, mr.height, smooth(0.72, 1, u));
        glow = 1 - smooth(0.8, 1, u);
        op = smooth(0, 0.06, u);
        if (u >= 1) {
          land(f);
          flight = null;
          p = to;
        }
      } else if (sweep) {
        const s = sweep;
        const u = clamp((now - s.t0) / s.dur, 0, 1);
        const e = easeHouse(u);
        const r = s.rect;
        // in-wipe edge: "next" grows from the right edge leftward, "prev" the reverse
        const x = s.dir === "next" ? r.right - r.width * e : r.left + r.width * e;
        p = { x, y: r.top + r.height / 2 };
        op = smooth(0, 0.08, u) * (1 - smooth(0.82, 1, u));
        if (u >= 1) {
          sweep = null;
          pos = p;
          op = 0;
        }
      }

      // landing squash on the marker, then the marker takes over
      if (!p && landT > 0 && lastMark) {
        const t = (now - landT) / (5 * F);
        if (t < 1) {
          p = center(lastMark);
          const r = lastMark.getBoundingClientRect();
          w = r.width;
          h = r.height;
          const a = Math.sin(Math.PI * t) * 0.35;
          place(p, w, h, 0, 1 + a, 1 - a * 0.8, 1, 0);
          settle = true;
        } else {
          landT = -1;
          op = 0;
        }
      }

      if (p && !settle) {
        let ang = 0, sx = 1, sy = 1;
        if (prev) {
          const vx = p.x - prev.x, vy = p.y - prev.y;
          const sp = Math.hypot(vx, vy);
          if (sp > 0.5) {
            ang = (Math.atan2(vy, vx) * 180) / Math.PI;
            sx = 1 + Math.min(sp * 0.06, 2.4);
            sy = Math.max(1 / sx, 0.55);
          }
        }
        place(p, w, h, ang, sx, sy, op, glow);
        trail.push(p);
      } else if (!settle) {
        dot!.style.opacity = "0";
      }
      if (trail.length > TRAIL || (!flight && !sweep && trail.length)) trail.shift();
      prev = p;

      // trail: tapering light streak
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        ctx.lineCap = "round";
        for (let i = 1; i < trail.length; i++) {
          const a = i / trail.length;
          ctx.strokeStyle = `rgba(${COLOR},${(a * a * 0.55).toFixed(3)})`;
          ctx.lineWidth = 1 + a * 4;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
      }

      if (flight || sweep || trail.length || landT > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        dot!.style.opacity = "0";
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", sizeCanvas);
      window.removeEventListener("guide:cut", onCut);
    };
  }, [pathname]);

  return (
    <>
      <canvas className="guide-trail" ref={canvasRef} aria-hidden="true" />
      <div id="guide" ref={dotRef} aria-hidden="true" />
    </>
  );
}
