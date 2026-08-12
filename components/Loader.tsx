"use client";

import { useEffect, useRef } from "react";
import { LOGO_PATH } from "./Logo";

function easePct(t: number) {
  if (t < 0.45) {
    const a = t / 0.45;
    return 0.4 * (1 - Math.pow(1 - a, 2.2));
  }
  const b = (t - 0.45) / 0.55;
  const e = b < 0.5 ? 4 * b * b * b : 1 - Math.pow(-2 * b + 2, 3) / 2;
  return 0.4 + 0.6 * e;
}

export default function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const pctSpanRef = useRef<HTMLSpanElement>(null);
  const pctTextRef = useRef<Text | null>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    const rect = rectRef.current;
    const pctSpan = pctSpanRef.current;
    if (!loader || !rect || !pctSpan) return;

    const pctText = pctSpan.previousSibling as Text | null;
    pctTextRef.current = pctText;

    function finish() {
      document.body.classList.add("site-ready");
      const hm = document.getElementById("heroMedia");
      if (hm) {
        hm.style.transition =
          "opacity .8s .1s cubic-bezier(.22,1,.36,1),filter .8s .1s cubic-bezier(.22,1,.36,1)";
        hm.style.opacity = "1";
        hm.style.filter = "blur(0px)";
      }
    }

    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) {
      loader.remove();
      finish();
      return;
    }

    const VBW = 1700;
    const DURATION = 2400;
    let done = false;
    let t0: number | null = null;
    let raf: number;

    function fadeOut() {
      if (!loader) {
        finish();
        return;
      }
      loader.classList.add("fadeout");
      function onFO() {
        loader!.removeEventListener("animationend", onFO);
        if (loader!.parentNode) loader!.remove();
        finish();
      }
      loader.addEventListener("animationend", onFO);
    }

    function tick(ts: number) {
      if (t0 === null) t0 = ts;
      const t = Math.min((ts - t0) / DURATION, 1);
      const pr = easePct(t);
      if (rect) rect.setAttribute("width", (VBW * pr).toFixed(1));
      if (pctTextRef.current) pctTextRef.current.nodeValue = String(Math.round(pr * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!done) {
        done = true;
        setTimeout(fadeOut, 300);
      }
    }
    raf = requestAnimationFrame(tick);

    const failsafe = setTimeout(() => {
      if (!done) {
        done = true;
        if (loader && loader.parentNode) loader.remove();
        finish();
      }
    }, 7000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
  }, []);

  return (
    <div id="loader" ref={loaderRef} aria-hidden="true">
      <div id="ld-grid" />
      <div id="ld-center">
        <svg
          id="ld-logo"
          viewBox="160 720 1700 480"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="ld-fill-clip">
              <rect ref={rectRef} id="ld-fill-rect" x="160" y="720" width="0" height="480" />
            </clipPath>
          </defs>
          <path id="ld-logo-ghost" d={LOGO_PATH} />
          <path id="ld-logo-fill" d={LOGO_PATH} clipPath="url(#ld-fill-clip)" />
        </svg>
        <div id="ld-pct">
          0<span ref={pctSpanRef}>%</span>
        </div>
      </div>
    </div>
  );
}
