"use client";

import { useEffect, useRef } from "react";
import { useLanguage, t } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";
import { SplitText } from "./SplitText";

const SERVICES = [
  {
    n: "01",
    name: { pt: "Brand Film", en: "Brand Film" },
    desc: {
      pt: "Produção audiovisual para marcas que precisam de presença com identidade.",
      en: "Audiovisual production for brands that need presence with identity.",
    },
  },
  {
    n: "02",
    name: { pt: "Making Of & BTS", en: "Making Of & BTS" },
    desc: {
      pt: "Registro e edição de bastidores de projetos publicitários, séries, eventos e produções de grande porte.",
      en: "Behind-the-scenes footage and editing for advertising projects, series, events and large-scale productions.",
    },
  },
  {
    n: "03",
    name: { pt: "Motion & Editorial", en: "Motion & Editorial" },
    desc: {
      pt: "Edição criativa para plataformas digitais. Ritmo, narrativa e qualidade de acabamento em cada corte.",
      en: "Creative editing for digital platforms. Pacing, narrative and finishing quality in every cut.",
    },
  },
];

export default function Services() {
  const { lang } = useLanguage();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svcGrid = gridRef.current;
    if (!svcGrid) return;

    const sio = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          svcGrid.querySelectorAll<HTMLElement>(".svc").forEach((card, i) => {
            setTimeout(() => card.classList.add("visible"), i * 110);
          });
          sio.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    sio.observe(svcGrid);

    // The service numbers' scroll drift now lives in MotionSystem
    // (data-depth on .svc-n) instead of a per-section scroll listener.
    return () => sio.disconnect();
  }, []);

  return (
    <section
      id="services"
      data-scene="04"
      data-scene-label={t({ pt: "Serviços", en: "Services" }, lang)}
    >
      <div
        className="section-head reveal m-head"
        data-guided
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "80px 0 52px",
          borderTop: "1px solid rgba(255,255,255,.05)",
          margin: "0 0 0 0",
        }}
      >
        <div className="section-title">
          <span className="gmark gmark-lg" data-guide-mark data-guide-reveal="#services .section-head" />
          <span className="mline">
            <SplitText text={t(dict.servicesEyebrow, lang)} />
          </span>
        </div>
      </div>

      <div className="services-grid" ref={gridRef}>
        {SERVICES.map((s) => (
          <div className="svc" key={s.n} data-spot>
            <div className="svc-n" data-depth="-0.02">
              {s.n}
            </div>
            <div className="svc-name">{t(s.name, lang)}</div>
            <div className="svc-desc">{t(s.desc, lang)}</div>
          </div>
        ))}
      </div>

      <div className="svc-cta-wrap reveal">
        <a href="https://wa.me/5548991879579" target="_blank" rel="noopener" className="svc-cta-btn">
          {t(dict.servicesCta, lang)}
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
