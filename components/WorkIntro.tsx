"use client";

import { useEffect, useRef } from "react";

type Project = {
  id: number;
  num: string;
  name: string;
  client: string;
  year: string;
  desc: string;
  tags: string;
  filter: "brand-film" | "bts" | "motion" | "institucional";
  vimeoId: string;
  orientation: "horizontal" | "vertical";
};

// Fixed card format (never vary): título, "Cliente • Ano", uma descrição
// curta (a decisão de direção + o que ela resolveu), créditos. Entries
// without copy yet are left blank on purpose.
const PROJECTS: Project[] = [
  { id: 1, num: "01", name: "Projeto de Motion para Websérie de Viagem", client: "", year: "", desc: "", tags: "", filter: "motion", vimeoId: "1218890209", orientation: "horizontal" },
  {
    id: 2,
    num: "02",
    name: "Motion Outubro Gloss",
    client: "Gloss Express",
    year: "2025",
    desc: "Direção que transformou a bisnaga Gloss em Torre Eiffel, revelando a vencedora e seu prêmio: Paris.",
    tags: "Motion, storytelling, direção",
    filter: "motion",
    vimeoId: "1218434521",
    orientation: "horizontal",
  },
  {
    id: 3,
    num: "03",
    name: "Institucional Retenção Day Toyota",
    client: "Hai Toyota",
    year: "2025",
    desc: "Direção que priorizou a mobilização real das equipes — e transformou a ação em prova institucional.",
    tags: "Direção, montagem, cor, captação",
    filter: "institucional",
    vimeoId: "1218901316",
    orientation: "horizontal",
  },
  {
    id: 4,
    num: "04",
    name: "Gloss na Estrada — Transição Floripa–Curitiba",
    client: "Gloss Express",
    year: "2025",
    desc: "Sistema de transições que transforma a viagem entre Florianópolis e Curitiba em passagem narrativa.",
    tags: "Motion design, composição, edição audiovisual",
    filter: "brand-film",
    vimeoId: "1218435106",
    orientation: "vertical",
  },
  { id: 5, num: "05", name: "Vídeo LP", client: "", year: "", desc: "", tags: "", filter: "brand-film", vimeoId: "1218435477", orientation: "horizontal" },
];

const GRADS = [
  "radial-gradient(120% 120% at 30% 18%,#232a2c 0%,#12161a 60%,#0a0b0d 100%)",
  "radial-gradient(120% 120% at 68% 22%,#2b2420 0%,#17110f 60%,#0b0908 100%)",
  "radial-gradient(120% 120% at 42% 28%,#232a1c 0%,#141a10 60%,#0a0c08 100%)",
  "radial-gradient(120% 120% at 58% 15%,#262327 0%,#16131a 60%,#0a090c 100%)",
];

const FILTERS: { label: string; value: "all" | Project["filter"] }[] = [
  { label: "Todos", value: "all" },
  { label: "Brand Film", value: "brand-film" },
  { label: "Institucional", value: "institucional" },
  { label: "Making Of & BTS", value: "bts" },
  { label: "Motion", value: "motion" },
];

function pad(n: number) {
  return ("0" + n).slice(-2);
}

export default function WorkIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const numRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const clientRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLSpanElement>(null);
  const totalRef = useRef<HTMLSpanElement>(null);
  const filterBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const meta = metaRef.current;
    const media = mediaRef.current;
    const playBtn = playBtnRef.current;
    const numEl = numRef.current;
    const titleEl = titleRef.current;
    const clientEl = clientRef.current;
    const descEl = descRef.current;
    const tagsEl = tagsRef.current;
    const currEl = currRef.current;
    const totalEl = totalRef.current;
    if (
      !frame ||
      !meta ||
      !media ||
      !playBtn ||
      !numEl ||
      !titleEl ||
      !clientEl ||
      !descEl ||
      !tagsEl ||
      !currEl ||
      !totalEl
    )
      return;

    let activeFilter: "all" | Project["filter"] = "all";
    let filtered = PROJECTS.slice();
    let current = 0;
    let inView = false;

    function unmountVideo() {
      media!.querySelector("iframe")?.remove();
      playBtn!.style.removeProperty("display");
    }

    // muted=1 is required for the iframe to autoplay without a prior user
    // gesture (browser autoplay policy) — native Vimeo controls still let
    // the visitor unmute.
    function mountVideo(vimeoId: string) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&title=0&byline=0&portrait=0`;
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;";
      media!.appendChild(iframe);
      playBtn!.style.display = "none";
    }

    function paint() {
      const p = filtered[current];
      unmountVideo();
      media!.style.background = GRADS[(p.id - 1) % GRADS.length];
      frame!.classList.toggle("vertical", p.orientation === "vertical");
      numEl!.textContent = p.num + " — Projeto";
      titleEl!.textContent = p.name;
      clientEl!.textContent = [p.client, p.year].filter(Boolean).join(" • ");
      descEl!.textContent = p.desc;
      tagsEl!.textContent = p.tags;
      currEl!.textContent = pad(current + 1);
      totalEl!.textContent = pad(filtered.length);
      if (inView) mountVideo(p.vimeoId);
    }

    let swapTimer: ReturnType<typeof setTimeout>;
    function render() {
      if (filtered.length === 0) return;
      unmountVideo();
      frame!.classList.add("cine-swap");
      meta!.classList.add("cine-swap");
      swapTimer = setTimeout(() => {
        paint();
        frame!.classList.remove("cine-swap");
        meta!.classList.remove("cine-swap");
      }, 210);
    }

    function go(d: number) {
      const N = filtered.length;
      if (!N) return;
      current = (current + d + N) % N;
      render();
    }

    function onNext() {
      go(1);
    }
    function onPrev() {
      go(-1);
    }
    const nextBtn = nextBtnRef.current;
    const prevBtn = prevBtnRef.current;
    nextBtn?.addEventListener("click", onNext);
    prevBtn?.addEventListener("click", onPrev);

    function onPlayClick() {
      const p = filtered[current];
      if (p) mountVideo(p.vimeoId);
    }
    playBtn.addEventListener("click", onPlayClick);

    const filterButtons = filterBtnRefs.current.filter(Boolean) as HTMLButtonElement[];
    function makeFilterHandler(btn: HTMLButtonElement, value: "all" | Project["filter"]) {
      return () => {
        filterButtons.forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = value;
        filtered = activeFilter === "all" ? PROJECTS.slice() : PROJECTS.filter((p) => p.filter === activeFilter);
        current = 0;
        render();
      };
    }
    const filterHandlers = filterButtons.map((btn, i) => makeFilterHandler(btn, FILTERS[i].value));
    filterButtons.forEach((btn, i) => btn.addEventListener("click", filterHandlers[i]));

    function onKeydown(e: KeyboardEvent) {
      if (!inView) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKeydown);

    let sx: number | null = null;
    function onTouchStart(e: TouchEvent) {
      sx = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (dx < -40) go(1);
      else if (dx > 40) go(-1);
      sx = null;
    }
    frame!.addEventListener("touchstart", onTouchStart, { passive: true });
    frame!.addEventListener("touchend", onTouchEnd);

    let sectionObserver: IntersectionObserver | null = null;
    const sec = sectionRef.current;
    if (sec && "IntersectionObserver" in window) {
      sectionObserver = new IntersectionObserver(
        (entries) => {
          const wasInView = inView;
          inView = entries[0].isIntersecting;
          if (inView && !wasInView) {
            const p = filtered[current];
            if (p) mountVideo(p.vimeoId);
          } else if (!inView && wasInView) {
            unmountVideo();
          }
        },
        { threshold: 0.2 }
      );
      sectionObserver.observe(sec);
    }

    paint();

    return () => {
      clearTimeout(swapTimer);
      nextBtn?.removeEventListener("click", onNext);
      prevBtn?.removeEventListener("click", onPrev);
      playBtn.removeEventListener("click", onPlayClick);
      filterButtons.forEach((btn, i) => btn.removeEventListener("click", filterHandlers[i]));
      document.removeEventListener("keydown", onKeydown);
      frame!.removeEventListener("touchstart", onTouchStart);
      frame!.removeEventListener("touchend", onTouchEnd);
      sectionObserver?.disconnect();
    };
  }, []);

  return (
    <section id="work-intro" ref={sectionRef}>
      <div className="cine-wrap">
        <div className="wi-eyebrow reveal">Portfólio</div>
        <h2 className="wi-line reveal reveal-d1">Veja o trabalho.</h2>

        <div className="cine-filters reveal reveal-d1">
          {FILTERS.map((f, i) => (
            <button
              key={f.value}
              ref={(el) => {
                filterBtnRefs.current[i] = el;
              }}
              className={"cine-filter" + (f.value === "all" ? " active" : "")}
              data-filter={f.value}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="cine-stage reveal reveal-d2">
          <div className="cine-frame" id="cineFrame" ref={frameRef}>
            <div className="cine-media" id="cineMedia" ref={mediaRef} />
            <button className="cine-play" aria-label="Assistir" ref={playBtnRef}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 4L15 10L6 16V4Z" fill="rgba(255,255,255,.9)" />
              </svg>
            </button>
          </div>

          <div className="cine-meta" id="cineMeta" ref={metaRef}>
            <div className="cine-num" id="cineNum" ref={numRef}>
              01 — Projeto
            </div>
            <h3 className="cine-title" id="cineTitle" ref={titleRef}>
              Projeto 01
            </h3>
            <div className="cine-client" id="cineClient" ref={clientRef} />
            <p className="cine-desc" id="cineDesc" ref={descRef} />
            <div className="cine-tags" id="cineTags" ref={tagsRef} />
          </div>
        </div>

        <div className="cine-nav reveal reveal-d2">
          <button className="cine-arrow" id="cinePrev" aria-label="Anterior" ref={prevBtnRef}>
            <svg width="15" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="cine-count">
            <span id="cineCurr" ref={currRef}>
              01
            </span>{" "}
            / <span id="cineTotal" ref={totalRef}>05</span>
          </div>
          <button className="cine-arrow" id="cineNext" aria-label="Próximo" ref={nextBtnRef}>
            <svg width="15" viewBox="0 0 14 14" fill="none">
              <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
