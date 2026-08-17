"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage, t, type Translated } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";

type Project = {
  id: number;
  num: string;
  name: Translated;
  client: string;
  year: string;
  desc: Translated;
  tags: Translated;
  filter: "brand-film" | "bts" | "motion" | "institucional";
  vimeoId: string;
  orientation: "horizontal" | "vertical";
};

// Fixed card format (never vary): título, "Cliente • Ano", uma descrição
// curta (a decisão de direção + o que ela resolveu), créditos. Entries
// without copy yet are left blank on purpose.
//
// `name`/`client`/`year` aren't translated (real campaign titles and
// proper nouns/numbers) — only `desc`/`tags` have an English version.
const PROJECTS: Project[] = [
  {
    id: 1,
    num: "01",
    name: {
      pt: "Gloss na Estrada — Transição Floripa–Curitiba",
      en: "Gloss na Estrada — Transição Floripa–Curitiba",
    },
    client: "Gloss Express",
    year: "2025",
    desc: {
      pt: "Sistema de transições que transforma a viagem entre Florianópolis e Curitiba em passagem narrativa.",
      en: "A transition system that turns the trip between Florianópolis and Curitiba into a narrative passage.",
    },
    tags: {
      pt: "Motion design, composição, edição audiovisual",
      en: "Motion design, compositing, video editing",
    },
    filter: "motion",
    vimeoId: "1218890209",
    orientation: "horizontal",
  },
  {
    id: 2,
    num: "02",
    name: { pt: "Motion Outubro Gloss", en: "Motion Outubro Gloss" },
    client: "Gloss Express",
    year: "2025",
    desc: {
      pt: "Direção que transformou a bisnaga Gloss em Torre Eiffel, revelando a vencedora e seu prêmio: Paris.",
      en: "Direction that turned the Gloss tube into the Eiffel Tower, revealing the winner and her prize: Paris.",
    },
    tags: { pt: "Motion, storytelling, direção", en: "Motion, storytelling, direction" },
    filter: "motion",
    vimeoId: "1218434521",
    orientation: "horizontal",
  },
  {
    id: 3,
    num: "03",
    name: { pt: "Institucional Retenção Day Toyota", en: "Institucional Retenção Day Toyota" },
    client: "Hai Toyota",
    year: "2025",
    desc: {
      pt: "Direção que priorizou a mobilização real das equipes — e transformou a ação em prova institucional.",
      en: "Direction that prioritized the team's real mobilization — turning the initiative into institutional proof.",
    },
    tags: { pt: "Direção, montagem, cor, captação", en: "Direction, editing, color grading, filming" },
    filter: "institucional",
    vimeoId: "1218901316",
    orientation: "horizontal",
  },
  {
    id: 4,
    num: "04",
    name: { pt: "Vídeo Promo Gloss", en: "Vídeo Promo Gloss" },
    client: "",
    year: "",
    desc: { pt: "", en: "" },
    tags: { pt: "", en: "" },
    filter: "brand-film",
    vimeoId: "1218435106",
    orientation: "vertical",
  },
  {
    id: 5,
    num: "05",
    name: { pt: "Vídeo LP", en: "Vídeo LP" },
    client: "",
    year: "",
    desc: { pt: "", en: "" },
    tags: { pt: "", en: "" },
    filter: "brand-film",
    vimeoId: "1218435477",
    orientation: "horizontal",
  },
];

const GRADS = [
  "radial-gradient(120% 120% at 30% 18%,#232a2c 0%,#12161a 60%,#0a0b0d 100%)",
  "radial-gradient(120% 120% at 68% 22%,#2b2420 0%,#17110f 60%,#0b0908 100%)",
  "radial-gradient(120% 120% at 42% 28%,#232a1c 0%,#141a10 60%,#0a0c08 100%)",
  "radial-gradient(120% 120% at 58% 15%,#262327 0%,#16131a 60%,#0a090c 100%)",
];

const FILTERS: { label: Translated; value: "all" | Project["filter"] }[] = [
  { label: dict.filterAll, value: "all" },
  { label: dict.filterBrandFilm, value: "brand-film" },
  { label: dict.filterInstitucional, value: "institucional" },
  { label: dict.filterBts, value: "bts" },
  { label: dict.filterMotion, value: "motion" },
];

function pad(n: number) {
  return ("0" + n).slice(-2);
}

export default function WorkIntro() {
  const { lang } = useLanguage();
  const langRef = useRef(lang);
  const paintRef = useRef<(() => void) | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  const fullscreenBtnRef = useRef<HTMLButtonElement>(null);
  const fsPrevRef = useRef<HTMLButtonElement>(null);
  const fsNextRef = useRef<HTMLButtonElement>(null);
  const fsCurrRef = useRef<HTMLSpanElement>(null);
  const fsTotalRef = useRef<HTMLSpanElement>(null);

  // The main effect below only runs once (mount) — it reads the current
  // language through this ref (always fresh) instead of closing over the
  // `lang` value from that first render, then re-paints the currently
  // shown project whenever the language toggles.
  useEffect(() => {
    langRef.current = lang;
    paintRef.current?.();
  }, [lang]);

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
      const currentLang = langRef.current;
      unmountVideo();
      media!.style.background = GRADS[(p.id - 1) % GRADS.length];
      frame!.classList.toggle("vertical", p.orientation === "vertical");
      numEl!.textContent = p.num + t(dict.workIntroNumSuffix, currentLang);
      titleEl!.textContent = t(p.name, currentLang);
      clientEl!.textContent = [p.client, p.year].filter(Boolean).join(" • ");
      descEl!.textContent = t(p.desc, currentLang);
      tagsEl!.textContent = t(p.tags, currentLang);
      currEl!.textContent = pad(current + 1);
      totalEl!.textContent = pad(filtered.length);
      if (fsCurrRef.current) fsCurrRef.current.textContent = pad(current + 1);
      if (fsTotalRef.current) fsTotalRef.current.textContent = pad(filtered.length);
      if (inView) mountVideo(p.vimeoId);
    }
    paintRef.current = paint;

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

    // The overlay prev/next (shown only while the frame is fullscreen)
    // drive the same go() as the regular nav below the stage.
    const fsPrevBtn = fsPrevRef.current;
    const fsNextBtn = fsNextRef.current;
    fsNextBtn?.addEventListener("click", onNext);
    fsPrevBtn?.addEventListener("click", onPrev);

    // Fullscreen only ever expands the video's own iframe, which covers
    // the nav below it — request fullscreen on the frame itself instead,
    // so this overlay (prev/next/count) stays reachable inside it.
    const fullscreenBtn = fullscreenBtnRef.current;
    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        frame!.requestFullscreen?.().catch(() => {});
      }
    }
    fullscreenBtn?.addEventListener("click", toggleFullscreen);

    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === frame);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);

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
      fsNextBtn?.removeEventListener("click", onNext);
      fsPrevBtn?.removeEventListener("click", onPrev);
      fullscreenBtn?.removeEventListener("click", toggleFullscreen);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
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
        <div className="wi-eyebrow reveal">{t(dict.workIntroEyebrow, lang)}</div>
        <h2 className="wi-line reveal reveal-d1">{t(dict.workIntroHeading, lang)}</h2>

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
              {t(f.label, lang)}
            </button>
          ))}
        </div>

        <div className="cine-stage reveal reveal-d2">
          <div className="cine-frame" id="cineFrame" ref={frameRef}>
            <div className="cine-media" id="cineMedia" ref={mediaRef} />
            <button className="cine-play" aria-label={t(dict.ariaWatch, lang)} ref={playBtnRef}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 4L15 10L6 16V4Z" fill="rgba(255,255,255,.9)" />
              </svg>
            </button>
            <button
              className="cine-fullscreen-btn"
              aria-label={t(isFullscreen ? dict.ariaExitFullscreen : dict.ariaFullscreen, lang)}
              ref={fullscreenBtnRef}
            >
              {isFullscreen ? (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 2v3a1 1 0 0 1-1 1H2M10 2v3a1 1 0 0 0 1 1h3M6 14v-3a1 1 0 0 0-1-1H2M10 14v-3a1 1 0 0 1 1-1h3"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 6V3a1 1 0 0 1 1-1h3M11 2h3a1 1 0 0 1 1 1v3M14 10v3a1 1 0 0 1-1 1h-3M5 14H2a1 1 0 0 1-1-1v-3"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <div className="cine-fs-nav">
              <button className="cine-arrow" aria-label={t(dict.ariaPrev, lang)} ref={fsPrevRef}>
                <svg width="15" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="cine-count">
                <span ref={fsCurrRef}>01</span> / <span ref={fsTotalRef}>05</span>
              </div>
              <button className="cine-arrow" aria-label={t(dict.ariaNext, lang)} ref={fsNextRef}>
                <svg width="15" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
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
          <button className="cine-arrow" id="cinePrev" aria-label={t(dict.ariaPrev, lang)} ref={prevBtnRef}>
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
          <button className="cine-arrow" id="cineNext" aria-label={t(dict.ariaNext, lang)} ref={nextBtnRef}>
            <svg width="15" viewBox="0 0 14 14" fill="none">
              <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
