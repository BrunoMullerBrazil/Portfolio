"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/*
 * MotionSystem — the single motion engine for everything below the hero.
 *
 * Replaces RevealObserver + MagneticCursor and the per-section scroll
 * listeners. One IntersectionObserver for reveals, one rAF loop for every
 * scroll/pointer-linked value, transforms written through the independent
 * `translate` / `scale` CSS properties so they compose with whatever
 * `transform` the element's own CSS (reveals, hovers, centering) already
 * uses instead of overwriting it.
 *
 * Language (kept deliberately small, borrowed from the hero + loader):
 *   foco    — blur → sharp + short rise         (.reveal, default)
 *   máscara — line rises from behind a frame edge (.reveal.m-head .mline)
 *   corte   — directional wipe between projects  (WorkIntro + CSS)
 *   depth   — [data-depth="0.05"]  scroll parallax (+ slower, − faster)
 *   dolly   — [data-dolly]         frame scales in as it enters
 *
 * Everything is skipped under prefers-reduced-motion.
 */

const MAG_SELECTOR = ".about-traj, .svc-cta-btn, .cine-arrow, .cine-filter, .cine-play";
const MAG_DIST = 90;
const MAG_FORCE = 0.32;
const DEPTH_CLAMP = 90;
const DOLLY_FROM = 0.92;

type Track = {
  el: HTMLElement;
  depth: number;
  dolly: boolean;
  y: number; // current translateY (lerped)
  s: number; // current scale (lerped)
  active: boolean;
};

type Mag = { el: HTMLElement; x: number; y: number; tx: number; ty: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function MotionSystem() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    root.classList.toggle("motion-reduced", reduced);

    // ── 1. Reveals ────────────────────────────────────────────────────
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    function observeReveal(el: Element) {
      if (el.classList.contains("visible")) return;
      if (reduced) el.classList.add("visible");
      else revealIO.observe(el);
    }

    // ── 2. Scroll-linked tracks (depth / dolly) ───────────────────────
    const tracks = new Map<HTMLElement, Track>();
    const activeIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const t = tracks.get(e.target as HTMLElement);
          if (t) t.active = e.isIntersecting;
        });
      },
      { rootMargin: "25% 0px 25% 0px" }
    );

    function registerTrack(el: HTMLElement) {
      if (reduced || tracks.has(el)) return;
      const dolly = el.hasAttribute("data-dolly");
      tracks.set(el, {
        el,
        depth: parseFloat(el.dataset.depth || "0") || 0,
        dolly,
        y: 0,
        s: dolly ? DOLLY_FROM : 1,
        active: false,
      });
      activeIO.observe(el);
    }

    function scan(scope: ParentNode) {
      if (scope instanceof Element) {
        if (scope.matches(".reveal")) observeReveal(scope);
        if (scope.matches("[data-depth],[data-dolly]")) registerTrack(scope as HTMLElement);
      }
      scope.querySelectorAll(".reveal").forEach(observeReveal);
      scope.querySelectorAll<HTMLElement>("[data-depth],[data-dolly]").forEach(registerTrack);
    }
    scan(document);

    // Elements mounted after first paint (language switch, new routes)
    // get picked up here — the old RevealObserver only re-scanned on route
    // change, which left late `.reveal` blocks stuck at opacity 0.
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) scan(n as Element);
        });
      }
      refreshMagnets();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // ── 3. Magnetic controls (pointer devices only) ───────────────────
    let magnets: Mag[] = [];
    function refreshMagnets() {
      if (reduced || isTouch) return;
      const els = Array.from(document.querySelectorAll<HTMLElement>(MAG_SELECTOR));
      magnets = els.map((el) => magnets.find((m) => m.el === el) || { el, x: 0, y: 0, tx: 0, ty: 0 });
    }
    refreshMagnets();

    let px = -9999;
    let py = -9999;
    let pointerDirty = false;
    function onPointer(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      px = e.clientX;
      py = e.clientY;
      pointerDirty = true;
    }
    if (!reduced && !isTouch) window.addEventListener("pointermove", onPointer, { passive: true });

    // ── 4. Anchor links glide through Lenis instead of jumping ────────
    function onAnchorClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const target = id ? document.getElementById(id) : null;
      const lenis = window._lenis;
      if (!target || !lenis || reduced) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    }
    document.addEventListener("click", onAnchorClick);

    if (reduced) {
      return () => {
        revealIO.disconnect();
        activeIO.disconnect();
        mo.disconnect();
        document.removeEventListener("click", onAnchorClick);
      };
    }

    // ── 5. Client marquee: speeds up with scroll velocity ─────────────
    let marquee: Animation | null = null;
    let rate = 1;
    function findMarquee() {
      const track = document.querySelector<HTMLElement>(".client-track");
      marquee = track?.getAnimations?.()[0] ?? null;
    }
    findMarquee();

    // ── The loop ──────────────────────────────────────────────────────
    let raf = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let lastP = -1;
    let velocity = 0;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const vh = window.innerHeight;
      const sy = window.scrollY;
      const dt = Math.max(1, now - lastT);
      const dy = sy - lastY;
      lastT = now;
      lastY = sy;
      velocity = lerp(velocity, dy / dt, 0.2); // px per ms
      const small = window.innerWidth <= 768;
      const fs = document.fullscreenElement;

      // Reading progress → nav hairline
      const max = document.documentElement.scrollHeight - vh;
      const p = max > 0 ? clamp(sy / max, 0, 1) : 0;
      if (Math.abs(p - lastP) > 0.0005) {
        root.style.setProperty("--scroll-p", p.toFixed(4));
        lastP = p;
      }

      // Depth + dolly: batch reads, then writes
      const writes: [Track, number, number][] = [];
      tracks.forEach((t) => {
        if (!t.active) return;
        if (fs && (fs === t.el || fs.contains(t.el))) {
          writes.push([t, 0, 1]);
          return;
        }
        const r = t.el.getBoundingClientRect();
        const cy = r.top + r.height / 2 - t.y; // strip our own offset
        let ty = 0;
        if (t.depth) {
          const d = small ? t.depth * 0.5 : t.depth;
          ty = clamp((vh / 2 - cy) * d, -DEPTH_CLAMP, DEPTH_CLAMP);
        }
        let ts = 1;
        if (t.dolly) {
          const h0 = r.height / t.s;
          const top0 = cy - h0 / 2;
          const prog = clamp((vh - top0) / (vh * 0.7), 0, 1);
          ts = DOLLY_FROM + (1 - DOLLY_FROM) * easeOut(prog);
        }
        writes.push([t, ty, ts]);
      });
      writes.forEach(([t, ty, ts]) => {
        const ny = lerp(t.y, ty, 0.18);
        const ns = lerp(t.s, ts, 0.14);
        if (Math.abs(ny - t.y) > 0.01 || Math.abs(ns - t.s) > 0.0001) {
          t.y = ny;
          t.s = ns;
          if (t.depth) t.el.style.setProperty("translate", `0 ${ny.toFixed(2)}px`);
          if (t.dolly) t.el.style.setProperty("scale", ns.toFixed(4));
        }
      });

      // Magnets
      if (magnets.length && (pointerDirty || Math.abs(dy) > 0 || magnets.some((m) => m.x || m.y))) {
        pointerDirty = false;
        const rects = magnets.map((m) => m.el.getBoundingClientRect());
        magnets.forEach((m, i) => {
          const r = rects[i];
          const cx = r.left + r.width / 2 - m.x;
          const cyM = r.top + r.height / 2 - m.y;
          const dx = px - cx;
          const dyM = py - cyM;
          const dist = Math.hypot(dx, dyM);
          if (dist < MAG_DIST) {
            const pull = (1 - dist / MAG_DIST) * MAG_FORCE;
            m.tx = dx * pull;
            m.ty = dyM * pull;
          } else {
            m.tx = 0;
            m.ty = 0;
          }
          m.x = lerp(m.x, m.tx, 0.2);
          m.y = lerp(m.y, m.ty, 0.2);
          if (Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05 && !m.tx && !m.ty) {
            m.x = 0;
            m.y = 0;
            m.el.style.removeProperty("translate");
          } else {
            m.el.style.setProperty("translate", `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`);
          }
        });
      }

      // Marquee
      if (marquee) {
        const target = 1 + Math.min(Math.abs(velocity) * 2.4, 5);
        const nr = lerp(rate, target, 0.06);
        if (Math.abs(nr - rate) > 0.005) {
          rate = nr;
          marquee.updatePlaybackRate(rate);
        }
      } else if (now % 1000 < 17) {
        findMarquee();
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      revealIO.disconnect();
      activeIO.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("click", onAnchorClick);
      tracks.forEach((t) => {
        t.el.style.removeProperty("translate");
        t.el.style.removeProperty("scale");
      });
      magnets.forEach((m) => m.el.style.removeProperty("translate"));
      marquee?.updatePlaybackRate(1);
    };
  }, [pathname]);

  return null;
}
