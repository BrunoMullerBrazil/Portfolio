"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/*
 * MotionSystem — the single motion engine for the whole page.
 *
 * Concept: the portfolio is watched like a film. Scrolling is scrubbing a
 * timeline — a timecode runs, scenes are named, cuts are directional, type
 * leans with camera speed, the page ends on credits that bookend the
 * loader. Every effect below is one of those ideas, nothing is decoration
 * for its own sake.
 *
 * One IntersectionObserver for reveals, one rAF loop for every scroll /
 * pointer-linked value. Transforms are written through the independent
 * `translate` / `scale` properties so they compose with the element's own
 * CSS `transform` (reveals, hovers, centering) instead of overwriting it.
 *
 *   foco      .reveal                    blur → sharp + short rise
 *   máscara   .m-head .mline             line/chars rise behind a frame edge
 *   corte     WorkIntro + CSS            directional wipe between projects
 *   depth     [data-depth="0.05"]        scroll parallax (+ slower, − faster)
 *   dolly     [data-dolly]               frame scales in as it enters
 *   scrub     [data-progress="a b"]      writes --prog 0→1 (top at a·vh →
 *                                        bottom at b·vh); CSS maps it
 *   kinetic   [data-kinetic]             Franie chars: weight follows the
 *                                        cursor, italic follows scroll speed
 *             [data-kinetic-block]       italic only (hero greeting)
 *   lens      [data-lens]                media drifts against the cursor
 *   spot      [data-spot]                --mx/--my under the pointer
 *   scenes    [data-scene]               timecode HUD + active nav link
 *
 * Everything is skipped under prefers-reduced-motion.
 */

const MAG_SELECTOR = ".about-traj, .svc-cta-btn, .cine-arrow, .cine-filter, .cine-play";
const MAG_DIST = 90;
const MAG_FORCE = 0.32;
const DEPTH_CLAMP = 90;
const DOLLY_FROM = 0.9;
const FPS = 24;

type Track = {
  el: HTMLElement;
  depth: number;
  dolly: boolean;
  y: number;
  s: number;
  prog: boolean;
  pa: number;
  pb: number;
  p: number;
  active: boolean;
};

type Kin = {
  el: HTMLElement;
  block: boolean;
  base: number;
  chars: HTMLElement[];
  cw: number[];
  dirty: boolean;
  ital: number;
  written: string;
  active: boolean;
};

type Mag = { el: HTMLElement; x: number; y: number; tx: number; ty: number };
type Lens = { el: HTMLElement; host: HTMLElement; x: number; y: number; s: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

function timecode(sec: number) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ff = Math.floor((s % 1) * FPS);
  return `${pad2(h)}:${pad2(m)}:${pad2(ss)}:${pad2(ff)}`;
}

export default function MotionSystem() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    root.classList.toggle("motion-reduced", reduced);

    // ── Reveals ───────────────────────────────────────────────────────
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

    // ── Registries ────────────────────────────────────────────────────
    const tracks = new Map<HTMLElement, Track>();
    const kins = new Map<HTMLElement, Kin>();
    const lenses = new Map<HTMLElement, Lens>();
    let scenes: HTMLElement[] = [];

    const activeIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          const t = tracks.get(el);
          if (t) t.active = e.isIntersecting;
          const k = kins.get(el);
          if (k) k.active = e.isIntersecting;
        });
      },
      { rootMargin: "25% 0px 25% 0px" }
    );

    function registerTrack(el: HTMLElement) {
      if (tracks.has(el)) return;
      const prog = el.hasAttribute("data-progress");
      if (reduced) {
        if (prog) el.style.setProperty("--prog", "1");
        return;
      }
      const dolly = el.hasAttribute("data-dolly");
      const [pa, pb] = (el.dataset.progress || "1 0").trim().split(/\s+/).map(Number);
      tracks.set(el, {
        el,
        depth: parseFloat(el.dataset.depth || "0") || 0,
        dolly,
        y: 0,
        s: dolly ? DOLLY_FROM : 1,
        prog,
        pa: Number.isFinite(pa) ? pa : 1,
        pb: Number.isFinite(pb) ? pb : 0,
        p: -1,
        active: false,
      });
      if (prog) el.style.setProperty("--prog", "0");
      activeIO.observe(el);
    }

    function registerKin(el: HTMLElement) {
      if (reduced || kins.has(el)) return;
      const block = el.hasAttribute("data-kinetic-block");
      const attr = parseFloat(el.dataset.kinetic || "");
      const base = Number.isFinite(attr) ? attr : parseFloat(getComputedStyle(el).fontWeight) || 40;
      kins.set(el, { el, block, base, chars: [], cw: [], dirty: true, ital: 0, written: "", active: false });
      activeIO.observe(el);
    }

    function registerLens(el: HTMLElement) {
      if (reduced || isTouch || lenses.has(el)) return;
      const host = (el.closest("[data-cursor]") as HTMLElement) || el.parentElement || el;
      lenses.set(el, { el, host, x: 0, y: 0, s: 1 });
    }

    function scan(scope: ParentNode) {
      const self = scope instanceof Element ? [scope] : [];
      const pick = (sel: string) => [
        ...self.filter((e) => e.matches(sel)),
        ...Array.from(scope.querySelectorAll(sel)),
      ] as HTMLElement[];
      pick(".reveal").forEach(observeReveal);
      pick("[data-depth],[data-dolly],[data-progress]").forEach(registerTrack);
      pick("[data-kinetic],[data-kinetic-block]").forEach(registerKin);
      pick("[data-lens]").forEach(registerLens);
      if (pick("[data-scene]").length) {
        scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
      }
    }
    scan(document);

    // Late nodes (language switch, project swaps, new routes). Text inside
    // a kinetic headline changing marks it dirty so its chars re-index.
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) scan(n as Element);
        });
        const host = (m.target as Element).closest?.("[data-kinetic]") as HTMLElement | null;
        if (host) {
          const k = kins.get(host);
          if (k) k.dirty = true;
        }
      }
      refreshMagnets();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // ── Pointer ───────────────────────────────────────────────────────
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
      const spot = (e.target as Element | null)?.closest?.("[data-spot]") as HTMLElement | null;
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${(px - r.left).toFixed(0)}px`);
        spot.style.setProperty("--my", `${(py - r.top).toFixed(0)}px`);
      }
    }
    function onLeave() {
      px = -9999;
      py = -9999;
      pointerDirty = true;
    }
    if (!reduced && !isTouch) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    // ── Anchor links glide through Lenis ──────────────────────────────
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

    // ── HUD / nav refs ────────────────────────────────────────────────
    const tc = document.getElementById("tc");
    const tcTime = document.getElementById("tc-time");
    const tcNum = document.getElementById("tc-num");
    const tcLabel = document.getElementById("tc-label");
    const runtime = parseFloat(tc?.dataset.runtime || "96") || 96;
    const nav = document.getElementById("nav-dark");
    const navInd = nav?.querySelector<HTMLElement>(".nav-ind") || null;
    let sceneKey = "";
    let navTarget: HTMLElement | null = null;

    function placeNavInd() {
      if (!nav || !navInd) return;
      if (!navTarget) {
        navInd.style.opacity = "0";
        return;
      }
      const nr = nav.getBoundingClientRect();
      const lr = navTarget.getBoundingClientRect();
      navInd.style.opacity = "1";
      navInd.style.transform = `translateX(${(lr.left - nr.left + lr.width / 2).toFixed(1)}px)`;
    }

    function updateScene(vh: number, force: boolean) {
      if (!scenes.length) return;
      let cur: HTMLElement | null = null;
      for (const s of scenes) {
        if (s.getBoundingClientRect().top <= vh * 0.5) cur = s;
      }
      if (!cur) cur = scenes[0];
      const num = cur.dataset.scene || "";
      const label = cur.dataset.sceneLabel || "";
      const key = num + "|" + label;
      if (key === sceneKey && !force) return;
      sceneKey = key;
      if (tcNum) tcNum.textContent = num;
      if (tcLabel) {
        tcLabel.textContent = label;
        tcLabel.classList.remove("roll");
        void tcLabel.offsetWidth;
        tcLabel.classList.add("roll");
      }
      if (nav) {
        const links = nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']");
        navTarget = null;
        links.forEach((a) => {
          const on = a.getAttribute("href") === "#" + cur!.id;
          a.classList.toggle("active", on);
          if (on) navTarget = a;
        });
        placeNavInd();
      }
    }

    function onResize() {
      placeNavInd();
      kins.forEach((k) => (k.dirty = true));
    }
    window.addEventListener("resize", onResize);

    if (reduced) {
      updateScene(window.innerHeight, true);
      const onScrollReduced = () => {
        updateScene(window.innerHeight, false);
        if (tcTime) {
          const max = root.scrollHeight - window.innerHeight;
          tcTime.textContent = timecode((max > 0 ? window.scrollY / max : 0) * runtime);
        }
      };
      window.addEventListener("scroll", onScrollReduced, { passive: true });
      return () => {
        revealIO.disconnect();
        activeIO.disconnect();
        mo.disconnect();
        document.removeEventListener("click", onAnchorClick);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScrollReduced);
      };
    }

    // ── Marquee ───────────────────────────────────────────────────────
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
    let playing = false;
    let frameNo = 0;
    updateScene(window.innerHeight, true);

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      frameNo++;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const sy = window.scrollY;
      const dt = Math.max(1, now - lastT);
      const dy = sy - lastY;
      lastT = now;
      lastY = sy;
      velocity = lerp(velocity, dy / dt, 0.2); // px/ms, signed
      const speed = Math.abs(velocity);
      const small = vw <= 768;
      const fs = document.fullscreenElement;
      const scrolled = dy !== 0;

      // Progress → nav hairline + timecode
      const max = root.scrollHeight - vh;
      const p = max > 0 ? clamp(sy / max, 0, 1) : 0;
      if (Math.abs(p - lastP) > 0.0002) {
        root.style.setProperty("--scroll-p", p.toFixed(4));
        if (tcTime) tcTime.textContent = timecode(p * runtime);
        lastP = p;
      }
      const isPlaying = speed > 0.03;
      if (tc && isPlaying !== playing) {
        playing = isPlaying;
        tc.dataset.state = playing ? "play" : "pause";
      }
      if (scrolled || frameNo % 30 === 0) updateScene(vh, false);

      // ── Tracks: depth / dolly / scrub (reads, then writes)
      const writes: [Track, number, number][] = [];
      const progWrites: [Track, number][] = [];
      tracks.forEach((t) => {
        if (!t.active) return;
        if (fs && (fs === t.el || fs.contains(t.el))) {
          writes.push([t, 0, 1]);
          return;
        }
        const r = t.el.getBoundingClientRect();
        if (t.prog) {
          const span = vh * (t.pa - t.pb) + r.height;
          const pv = span > 0 ? clamp((vh * t.pa - (r.top - t.y)) / span, 0, 1) : 1;
          if (Math.abs(pv - t.p) > 0.0008) progWrites.push([t, pv]);
          if (!t.depth && !t.dolly) return;
        }
        const cy = r.top + r.height / 2 - t.y;
        let ty = 0;
        if (t.depth) {
          const d = small ? t.depth * 0.5 : t.depth;
          ty = clamp((vh / 2 - cy) * d, -DEPTH_CLAMP, DEPTH_CLAMP);
        }
        let ts = 1;
        if (t.dolly) {
          const h0 = r.height / t.s;
          const top0 = cy - h0 / 2;
          const prog = clamp((vh - top0) / (vh * 0.75), 0, 1);
          ts = DOLLY_FROM + (1 - DOLLY_FROM) * easeOut(prog);
        }
        writes.push([t, ty, ts]);
      });

      // ── Kinetic type: reads
      const italTarget = clamp(speed * 34, 0, 100);
      type KinRead = { k: Kin; rects: DOMRect[] | null };
      const kinReads: KinRead[] = [];
      kins.forEach((k) => {
        if (!k.active) return;
        if (k.dirty) {
          k.chars = k.block ? [] : Array.from(k.el.querySelectorAll<HTMLElement>(".ch"));
          k.cw = k.chars.map(() => k.base);
          k.chars.forEach((c) => c.style.removeProperty("font-variation-settings"));
          k.written = "";
          k.dirty = false;
        }
        let rects: DOMRect[] | null = null;
        if (!k.block && !isTouch && k.chars.length) {
          const r = k.el.getBoundingClientRect();
          const R = clamp(r.height * 1.6, 90, 220);
          const near = px > r.left - R && px < r.right + R && py > r.top - R && py < r.bottom + R;
          const unsettled = k.cw.some((w) => Math.abs(w - k.base) > 0.4);
          if (near || unsettled) rects = k.chars.map((c) => c.getBoundingClientRect());
        }
        kinReads.push({ k, rects });
      });

      // ── Lens: reads
      const lensReads: [Lens, number, number, number][] = [];
      if (lenses.size && (pointerDirty || scrolled || frameNo % 4 === 0)) {
        lenses.forEach((l) => {
          if (!l.el.isConnected) {
            lenses.delete(l.el);
            return;
          }
          if (fs && fs.contains(l.el)) {
            lensReads.push([l, 0, 0, 1]);
            return;
          }
          const r = l.host.getBoundingClientRect();
          const inside = px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
          if (inside) {
            const nx = (px - (r.left + r.width / 2)) / r.width;
            const ny = (py - (r.top + r.height / 2)) / r.height;
            lensReads.push([l, -nx * 18, -ny * 12, 1.05]);
          } else lensReads.push([l, 0, 0, 1]);
        });
      }

      // ── Magnets: reads
      let magRects: DOMRect[] | null = null;
      if (magnets.length && (pointerDirty || scrolled || magnets.some((m) => m.x || m.y))) {
        magRects = magnets.map((m) => m.el.getBoundingClientRect());
      }
      pointerDirty = false;

      // ════════ writes ════════
      progWrites.forEach(([t, pv]) => {
        t.p = pv;
        t.el.style.setProperty("--prog", pv.toFixed(4));
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

      kinReads.forEach(({ k, rects }) => {
        // fast attack, slow release — type leans in as you push, settles after
        k.ital = lerp(k.ital, italTarget, italTarget > k.ital ? 0.22 : 0.07);
        if (k.ital < 0.15 && italTarget === 0) k.ital = 0;
        const it = k.ital.toFixed(1);
        const elVal = k.block ? (k.ital ? `'ital' ${it}` : "") : `'wght' ${k.base}, 'ital' ${it}`;
        if (elVal !== k.written) {
          if (elVal) k.el.style.setProperty("font-variation-settings", elVal);
          else k.el.style.removeProperty("font-variation-settings");
          k.written = elVal;
        }
        if (!rects) return;
        const R = clamp((rects[0]?.height || 60) * 2.2, 90, 240);
        k.chars.forEach((c, i) => {
          const r = rects[i];
          const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
          const prox = d < R ? easeOut(1 - d / R) : 0;
          const target = k.base + (100 - k.base) * prox;
          const w = lerp(k.cw[i], target, 0.2);
          k.cw[i] = Math.abs(w - k.base) < 0.4 && !prox ? k.base : w;
          if (k.cw[i] === k.base) c.style.removeProperty("font-variation-settings");
          else c.style.setProperty("font-variation-settings", `'wght' ${k.cw[i].toFixed(1)}, 'ital' ${it}`);
        });
      });

      lensReads.forEach(([l, tx, ty, ts]) => {
        l.x = lerp(l.x, tx, 0.08);
        l.y = lerp(l.y, ty, 0.08);
        l.s = lerp(l.s, ts, 0.08);
        if (Math.abs(l.x) < 0.02 && Math.abs(l.y) < 0.02 && Math.abs(l.s - 1) < 0.0005 && ts === 1) {
          l.x = l.y = 0;
          l.s = 1;
          l.el.style.removeProperty("translate");
          l.el.style.removeProperty("scale");
        } else {
          l.el.style.setProperty("translate", `${l.x.toFixed(2)}px ${l.y.toFixed(2)}px`);
          l.el.style.setProperty("scale", l.s.toFixed(4));
        }
      });

      if (magRects) {
        magnets.forEach((m, i) => {
          const r = magRects![i];
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

      // Marquee speeds up with scroll velocity
      if (marquee) {
        const target = 1 + Math.min(speed * 2.4, 5);
        const nr = lerp(rate, target, 0.06);
        if (Math.abs(nr - rate) > 0.005) {
          rate = nr;
          marquee.updatePlaybackRate(rate);
        }
      } else if (frameNo % 60 === 0) {
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
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("resize", onResize);
      tracks.forEach((t) => {
        t.el.style.removeProperty("translate");
        t.el.style.removeProperty("scale");
      });
      kins.forEach((k) => {
        k.el.style.removeProperty("font-variation-settings");
        k.chars.forEach((c) => c.style.removeProperty("font-variation-settings"));
      });
      lenses.forEach((l) => {
        l.el.style.removeProperty("translate");
        l.el.style.removeProperty("scale");
      });
      magnets.forEach((m) => m.el.style.removeProperty("translate"));
      marquee?.updatePlaybackRate(1);
    };
  }, [pathname]);

  return null;
}
