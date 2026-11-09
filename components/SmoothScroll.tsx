"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    _lenis?: Lenis;
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      // a heavier glide: expo-out over 1.1s reads like a dolly with weight
      duration: 1.1,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.2,
      syncTouch: false,
    });
    window._lenis = lenis;

    let raf: number;
    function loop(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window._lenis = undefined;
    };
  }, []);

  return null;
}
