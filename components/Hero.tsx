"use client";

import { useEffect, useRef } from "react";
import { Logo } from "./Logo";
import { withBasePath } from "@/lib/basePath";

function eic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Base (pre-scroll) size of the hero media card. The desktop floor (200x280)
// is too wide for phones — it collides with the greeting/signature text — so
// mobile gets its own, smaller floor.
function baseMediaSize(vw: number, vh: number) {
  if (vw <= 768) {
    return {
      W0: Math.min(Math.max(80, vw * 0.22), 150),
      H0: Math.min(Math.max(160, vh * 0.3), 280),
    };
  }
  return {
    W0: Math.min(Math.max(200, vw * 0.28), 370),
    H0: Math.min(Math.max(280, vh * 0.54), 640),
  };
}

export default function Hero() {
  const heroMediaRef = useRef<HTMLDivElement>(null);
  const heroTextsRef = useRef<HTMLDivElement>(null);
  const heroRoleRef = useRef<HTMLDivElement>(null);
  const heroScrollCueRef = useRef<HTMLDivElement>(null);
  const heroNavRef = useRef<HTMLDivElement>(null);
  const heroStickyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hm = heroMediaRef.current;
    const ht = heroTextsRef.current;
    const hr = heroRoleRef.current;
    const hsc = heroScrollCueRef.current;
    const hn = heroNavRef.current;
    const hs = heroStickyRef.current;
    if (!hm || !ht || !hr || !hsc || !hn || !hs) return;

    document.body.classList.add("hero-mode");

    // ── Hero word reveal, triggered once the loader marks body.site-ready ──
    function doHeroReveal() {
      const words = rootRef.current?.querySelectorAll<HTMLElement>(".hg-w");
      words?.forEach((el, i) => {
        setTimeout(() => {
          el.style.transform = "translateY(0)";
          el.style.opacity = "1";
          el.style.filter = "blur(0px)";
        }, i * 130);
      });
    }
    let revealObserver: MutationObserver | null = null;
    if (document.body.classList.contains("site-ready")) {
      doHeroReveal();
    } else {
      revealObserver = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          if ((m.target as HTMLElement).classList.contains("site-ready")) {
            revealObserver?.disconnect();
            setTimeout(doHeroReveal, 80);
          }
        });
      });
      revealObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }

    // ── Mouse / scroll parallax on hero text ──
    let heroMX = 0,
      heroMY = 0,
      heroLX = 0,
      heroLY = 0,
      heroScrollY = 0;

    function applyHeroTransform() {
      ht!.style.transform =
        "translateY(" + heroScrollY.toFixed(1) + "px) translateX(" + (heroLX * -10).toFixed(1) + "px)";
      hr!.style.transform =
        "translateY(" + (heroScrollY * 0.6).toFixed(1) + "px) translateX(" + (heroLX * -5).toFixed(1) + "px)";
    }

    function onMouseMove(e: MouseEvent) {
      heroMX = e.clientX / window.innerWidth - 0.5;
      heroMY = e.clientY / window.innerHeight - 0.5;
    }
    document.addEventListener("mousemove", onMouseMove);

    let raf: number;
    function parallaxLoop() {
      heroLX += (heroMX - heroLX) * 0.07;
      heroLY += (heroMY - heroLY) * 0.07;
      if (document.body.classList.contains("hero-mode")) applyHeroTransform();
      raf = requestAnimationFrame(parallaxLoop);
    }
    raf = requestAnimationFrame(parallaxLoop);

    // ── Sticky hero media resize + scroll-driven state ──
    function setM(w: number, h: number, r: number, top: number) {
      const vw = window.innerWidth;
      const isMobile = vw <= 768;
      let leftVal: string, txVal: string;
      if (isMobile) {
        const { W0 } = baseMediaSize(vw, window.innerHeight);
        const expansion = Math.max(0, Math.min((w - W0) / (vw - W0), 1));
        const rightGap = 12 * (1 - expansion);
        // Interpolate from right-anchored (small card, expansion 0) to
        // truly horizontally centered (expansion 1) — the old formula
        // (vw - rightGap - w + w*0.5*expansion) only converged to vw/2
        // at full width instead of 0, leaving the card stuck off-screen
        // to the right once it grew to fill the viewport.
        const rightAnchoredLeft = vw - rightGap - w;
        const centeredLeft = (vw - w) / 2;
        const centerX = rightAnchoredLeft + (centeredLeft - rightAnchoredLeft) * expansion;
        leftVal = Math.max(0, centerX) + "px";
        txVal = "none";
      } else {
        leftVal = "50%";
        txVal = "translateX(-50%)";
      }
      hm!.style.cssText =
        "position:absolute;overflow:hidden;cursor:none;z-index:5;" +
        "will-change:width,height,border-radius,top,left,transform;" +
        "width:" + w + "px;height:" + h + "px;border-radius:" + r + "px;top:" + top + "px;" +
        "left:" + leftVal + ";transform:" + txVal + ";";

      const iframe = hm!.querySelector<HTMLIFrameElement>("iframe");
      if (iframe) {
        const videoRatio = 16 / 9;
        const containerRatio = w / h;
        const scale = containerRatio < videoRatio ? videoRatio / containerRatio : containerRatio / videoRatio;
        iframe.style.setProperty("width", "100%", "important");
        iframe.style.setProperty("height", "100%", "important");
        iframe.style.setProperty("top", "0", "important");
        iframe.style.setProperty("left", "0", "important");
        iframe.style.setProperty("transform", "scale(" + scale + ")", "important");
        iframe.style.setProperty("transform-origin", "center center", "important");
      }
    }

    function initM() {
      const vh = window.innerHeight,
        vw = window.innerWidth;
      const { W0: W, H0: H } = baseMediaSize(vw, vh);
      setM(W, H, 20, (vh - H) / 2);
      hm!.style.opacity = "0";
      hm!.style.filter = "blur(16px)";
    }
    initM();
    window.addEventListener("resize", initM);

    function updH() {
      const sy = window.scrollY,
        vh = window.innerHeight,
        vw = window.innerWidth;
      const { W0, H0 } = baseMediaSize(vw, vh);
      const t1 = Math.min(sy / (vh * 3), 1),
        e1 = eic(t1);
      const cW = W0 + (vw - W0) * e1,
        cH = H0 + (vh - H0) * e1,
        cR = 20 * (1 - e1);
      const t2 = Math.max(0, Math.min((sy - vh * 3) / vh, 1)),
        e2 = eic(t2);
      setM(cW, cH, cR, (vh - cH) / 2 - e2 * (vh + cH / 2));
      const uiF = Math.max(0, 1 - (t1 - 0.15) / 0.3);
      ht!.style.opacity = String(uiF);
      hr!.style.opacity = String(uiF);
      heroScrollY = -(sy * 0.18);
      applyHeroTransform();
      hsc!.style.opacity = t1 < 0.02 ? "1" : t1 > 0.28 ? "0" : String(Math.max(0, 1 - (t1 - 0.02) / 0.26));
      hn!.style.opacity = String(uiF);
      hs!.style.backgroundColor = "rgba(245,243,239," + (1 - e2) + ")";

      const nd = document.getElementById("nav-dark");
      if (sy >= vh * 3.8) {
        document.body.classList.remove("hero-mode");
        document.body.classList.add("dark-mode");
        nd?.classList.add("visible");
      } else {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("hero-mode");
        nd?.classList.remove("visible");
      }
    }
    window.addEventListener("scroll", updH, { passive: true });
    updH();

    return () => {
      cancelAnimationFrame(raf);
      revealObserver?.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", initM);
      window.removeEventListener("scroll", updH);
    };
  }, []);

  return (
    <section id="hero" ref={rootRef}>
      <div id="hero-sticky" ref={heroStickyRef}>
        <div className="hero-nav" id="heroNav" ref={heroNavRef}>
          <div className="hero-nav-logo">
            <Logo />
          </div>
          <div className="hero-nav-links">
            <a href="#work-intro">Work</a>
            <a href="#about">About</a>
            <a href="#contact">Contato</a>
          </div>
        </div>

        <div className="hero-text-wrap" id="heroTexts" ref={heroTextsRef}>
          <div className="hero-greeting" aria-label="Oi, eu sou Bruno.">
            <div className="hg-line">
              <span className="hg-w">Oi,</span>
            </div>
            <div className="hg-line">
              <span className="hg-w" style={{ transitionDelay: ".12s" }}>
                eu sou
              </span>
            </div>
            <div className="hg-line">
              <span className="hg-w" style={{ transitionDelay: ".24s" }}>
                Bruno<em>.</em>
              </span>
            </div>
          </div>
          <div className="hero-signature">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBasePath("/assets/signature.png")} alt="" />
          </div>
        </div>

        <div className="hero-role" id="heroRole" ref={heroRoleRef}>
          <div className="hero-role-line">Florianópolis · Brasil</div>
          <div className="hero-role-name">
            <em>Brand film for all</em>
          </div>
        </div>

        <div id="heroMedia" ref={heroMediaRef}>
          <div className="hero-media-inner">
            <iframe
              src="https://player.vimeo.com/video/1213900059?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
            />
          </div>
        </div>

        <div className="hero-scroll-cue" id="heroScrollCue" ref={heroScrollCueRef}>
          <div className="scroll-mouse">
            <div className="scroll-dot" />
          </div>
          <span className="scroll-txt">scroll</span>
        </div>
      </div>
    </section>
  );
}
