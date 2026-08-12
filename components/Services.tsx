"use client";

import { useEffect, useRef } from "react";

const SERVICES = [
  { n: "01", name: "Brand Film", desc: "Produção audiovisual para marcas que precisam de presença com identidade." },
  {
    n: "02",
    name: "Making Of & BTS",
    desc: "Registro e edição de bastidores de projetos publicitários, séries, eventos e produções de grande porte.",
  },
  {
    n: "03",
    name: "Motion & Editorial",
    desc: "Edição criativa para plataformas digitais. Ritmo, narrativa e qualidade de acabamento em cada corte.",
  },
];

export default function Services() {
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

    function onScroll() {
      const vh = window.innerHeight;
      svcGrid!.querySelectorAll<HTMLElement>(".svc").forEach((card) => {
        const r = card.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const rel = (mid - vh / 2) / vh;
        const num = card.querySelector<HTMLElement>(".svc-n");
        if (num) num.style.transform = "translateY(" + rel * 18 + "px)";
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      sio.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section id="services">
      <div
        className="section-head reveal"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "80px 0 52px",
          borderTop: "1px solid rgba(255,255,255,.05)",
          margin: "0 0 0 0",
        }}
      >
        <div className="section-title">Serviços</div>
      </div>

      <div className="services-grid" ref={gridRef}>
        {SERVICES.map((s) => (
          <div className="svc" key={s.n}>
            <div className="svc-n">{s.n}</div>
            <div className="svc-name">{s.name}</div>
            <div className="svc-desc">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="svc-cta-wrap reveal">
        <a href="https://wa.me/5548991879579" target="_blank" rel="noopener" className="svc-cta-btn">
          Vamos conversar
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
