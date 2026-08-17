"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/basePath";

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
  const statsWrapRef = useRef<HTMLDivElement>(null);

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
          <div className="about-eyebrow reveal">Sobre</div>
          <div className="about-text reveal reveal-d2">
            <strong>Direção, câmera e edição</strong> para marcas, empresas e projetos que precisam de presença
            audiovisual com critério.
            <br />
            <br />
            Trabalho em Florianópolis e de forma remota em projetos de <strong>brand film</strong>, making of, motion
            e editorial — do briefing à entrega final.
          </div>
          <Link href="/trajetoria" className="about-traj reveal reveal-d3">
            Minha trajetória
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className="about-stats" ref={statsWrapRef}>
          <div className="stat reveal reveal-d1">
            <div className="stat-num" data-count="5" data-suffix="+">
              0
            </div>
            <div className="stat-accent" />
            <div className="stat-lbl">Anos de experiência</div>
          </div>
          <div className="stat reveal reveal-d2">
            <div className="stat-num" data-count="40" data-suffix="+">
              0
            </div>
            <div className="stat-accent" />
            <div className="stat-lbl">Projetos entregues</div>
          </div>
          <div className="stat reveal reveal-d3">
            <div className="stat-num">BR</div>
            <div className="stat-accent" />
            <div className="stat-lbl">Remoto disponível</div>
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
