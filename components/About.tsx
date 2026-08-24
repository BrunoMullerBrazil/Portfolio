"use client";

import { useEffect, useRef } from "react";
import { withBasePath } from "@/lib/basePath";
import { useLanguage, t as tr } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";

const LOGOS = [
  { file: "TOYOTA.png", alt: "Toyota" },
  { file: "STALEKS.png", alt: "Staleks" },
  { file: "AEMFLOCDL.png", alt: "AEMFLO CDL" },
  { file: "GLOSSCOMPANY.png", alt: "Gloss Company" },
];

function ac(el: HTMLElement, t: number, s: string, d: number) {
  let st: number | null = null;
  function step(ts: number) {
    if (st === null) st = ts;
    const p = Math.min((ts - st) / d, 1);
    el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * t)) + s;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export default function About() {
  const { lang } = useLanguage();
  const statsWrapRef = useRef<HTMLDivElement>(null);
  const para3 = tr(dict.aboutPara3, lang);

  useEffect(() => {
    const statsWrap = statsWrapRef.current;
    if (!statsWrap) return;

    let triggered = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !triggered) {
          triggered = true;
          io.disconnect();
          statsWrap.querySelectorAll<HTMLElement>(".stat-num").forEach((el, i) => {
            setTimeout(() => {
              if (el.dataset.count) ac(el, +el.dataset.count, el.dataset.suffix || "", 1000);
              el.classList.add("popped");
              const lbl = el.parentElement?.querySelector<HTMLElement>(".stat-lbl");
              if (lbl) setTimeout(() => lbl.classList.add("visible"), 180);
            }, i * 170);
          });
        }
      },
      { threshold: 0.35 }
    );
    io.observe(statsWrap);

    return () => io.disconnect();
  }, []);

  return (
    <>
      <section id="about">
        <div>
          <div className="about-eyebrow reveal">{tr(dict.aboutEyebrow, lang)}</div>
          <div className="about-text reveal reveal-d2">{tr(dict.aboutPara1, lang)}</div>
          <div className="about-text reveal reveal-d3">{tr(dict.aboutPara2, lang)}</div>
          {/* No .reveal here: this block mounts on a language switch, not
              a route change, and RevealObserver only re-scans on pathname
              change — an element with .reveal that appears afterwards would
              never get observed and would stay stuck at opacity:0. */}
          {para3 && <div className="about-text">{para3}</div>}
        </div>
        <div className="about-stats" ref={statsWrapRef}>
          <div className="stat reveal reveal-d1">
            <div className="stat-num" data-count="5" data-suffix="+">
              0
            </div>
            <div className="stat-accent" />
            <div className="stat-lbl">{tr(dict.statYears, lang)}</div>
          </div>
          <div className="stat reveal reveal-d2">
            <div className="stat-num">{tr(dict.statRemoteValue, lang)}</div>
            <div className="stat-accent" />
            <div className="stat-lbl">{tr(dict.statRemote, lang)}</div>
          </div>
        </div>
      </section>

      {/* eslint-disable @next/next/no-img-element */}
      <div className="client-marquee" aria-label="Clientes">
        <div className="client-track">
          <div className="client-group">
            {LOGOS.map((l) => (
              <img key={l.file} src={withBasePath(`/assets/logos/${l.file}`)} alt={l.alt} />
            ))}
          </div>
          <div className="client-group" aria-hidden="true">
            {LOGOS.map((l) => (
              <img key={l.file} src={withBasePath(`/assets/logos/${l.file}`)} alt="" />
            ))}
          </div>
        </div>
      </div>
      {/* eslint-enable @next/next/no-img-element */}
    </>
  );
}
