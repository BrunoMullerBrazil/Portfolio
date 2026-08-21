"use client";

import { useEffect, useRef } from "react";

const HOVER_SELECTOR = "a,.svc,.cine-filter,.cine-arrow";
// Bigger "Click!" circle for card/media-style elements that open or play
// something, as opposed to plain links/buttons (small ring only). A data
// attribute survives CSS Modules' class-name hashing on /design and
// /trajetoria, where a plain ".foo" selector wouldn't match.
const CLICK_SELECTOR = '[data-cursor="click"],.work-card';

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cur = dotRef.current;
    const ring = ringRef.current;
    const lbl = labelRef.current;
    if (!cur || !ring || !lbl) return;

    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0,
      pvx = 0,
      pvy = 0,
      curAng = 0;

    function onMouseMove(e: MouseEvent) {
      pvx = e.clientX - mx;
      pvy = e.clientY - my;
      mx = e.clientX;
      my = e.clientY;
      lbl!.style.left = mx + "px";
      lbl!.style.top = my + "px";
    }
    document.addEventListener("mousemove", onMouseMove);

    let raf: number;
    function animate() {
      cur!.style.left = mx + "px";
      cur!.style.top = my + "px";
      const spd = Math.sqrt(pvx * pvx + pvy * pvy);
      pvx *= 0.76;
      pvy *= 0.76;
      const str = Math.min(1 + spd * 0.12, 2.8);
      const sq = Math.max(1 / str, 0.36);
      if (spd > 0.6) curAng = (Math.atan2(pvy, pvx) * 180) / Math.PI;
      cur!.style.transform =
        "translate(-50%,-50%) rotate(" +
        curAng.toFixed(1) +
        "deg) scaleX(" +
        str.toFixed(2) +
        ") scaleY(" +
        sq.toFixed(2) +
        ")";
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring!.style.left = rx + "px";
      ring!.style.top = ry + "px";
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
              Click! &#8226; Click! &#8226; Click! &#8226; Click! &#8226;{" "}
            </textPath>
          </text>
        </svg>
      </div>
    </>
  );
}
