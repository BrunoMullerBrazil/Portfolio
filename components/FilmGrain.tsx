"use client";

import { useEffect, useRef } from "react";

/*
 * Film stock. A 160px noise tile is generated once on a canvas (no asset to
 * download) and stepped around at ~12fps so it reads as grain, not as a
 * moving texture. Pure compositor work: one fixed layer, transform only.
 * Static under prefers-reduced-motion (handled in CSS).
 */
export default function FilmGrain() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const size = 160;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 46;
    }
    ctx.putImageData(img, 0, 0);
    el.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
    el.classList.add("on");
  }, []);

  return <div className="film-grain" ref={ref} aria-hidden="true" />;
}
