"use client";

import { useEffect } from "react";

const MAG_SELECTOR = ".about-traj, .svc-cta-btn, .cine-arrow, .cine-filter, .cine-play, .clink";
const MAG_DIST = 90;
const MAG_FORCE = 0.38;

export default function MagneticCursor() {
  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;

    function onMouseMove(e: MouseEvent) {
      document.querySelectorAll<HTMLElement>(MAG_SELECTOR).forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAG_DIST) {
          const pull = (1 - dist / MAG_DIST) * MAG_FORCE;
          el.style.transform = "translate(" + dx * pull + "px," + dy * pull + "px)";
        } else {
          el.style.transform = "";
        }
      });
    }
    document.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  return null;
}
