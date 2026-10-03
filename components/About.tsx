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

// Scroll-scrubbed reading: each word lights up as the paragraph travels
// through the viewport (MotionSystem writes --prog on the wrapper, CSS maps
// it against each word's --i). The real sentence lives in .sr-only for
// screen readers; the per-word spans are presentation only.
function Scrub({ text, className, range }: { text: string; className: string; range: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div className={className} data-progress={range} style={{ "--n": words.length } as React.CSSProperties}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} className="rw" aria-hidden="true" style={{ "--i": i } as React.CSSProperties}>
          {w}{" "}
        </span>
      ))}
    </div>
  );
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
      <section
        id="about"
        data-scene="03"
        data-scene-label={tr({ pt: "Sobre", en: "About" }, lang)}
      >
        <div>
          <div className="about-eyebrow reveal">{tr(dict.aboutEyebrow, lang)}</div>
          <Scrub className="about-lead" range=".88 .5" text={tr(dict.aboutPara1, lang)} />
          <Scrub className="about-text" range=".92 .5" text={tr(dict.aboutPara2, lang)} />
          {/* MotionSystem watches for nodes mounted later (this one only
              exists in one language), so late blocks get scrubbed too. */}
          {para3 && <Scrub className="about-text" range=".92 .5" text={para3} />}
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
