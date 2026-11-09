"use client";

import { useEffect, useRef } from "react";
import { Logo } from "./Logo";
import { withBasePath } from "@/lib/basePath";
import { useLanguage, t } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";
import LanguageSwitcher from "./LanguageSwitcher";

function eic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const DESKTOP_VIMEO_ID = "1213900059";
const MOBILE_VIMEO_ID = "1218888270";
const DESKTOP_VIDEO_RATIO = 16 / 9;
const MOBILE_VIDEO_RATIO = 9 / 16;

function vimeoSrc(id: string) {
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0`;
}

// Base (pre-scroll) size of the hero media card. The desktop floor (200x280)
// is too wide for phones — it collides with the greeting/signature text — so
// mobile gets its own, smaller floor.
function baseMediaSize(vw: number, vh: number) {
  if (vw <= 768) {
    // Same fix as the desktop branch below: W0 used to come from an
    // independent vw * 0.22 formula, which only coincidentally matched the
    // intended 80x160 (1:2) ratio at the clamp floor/ceiling — across real
    // phone sizes (which vary a lot more in height than in width) the
    // container ratio actually drifted from ~0.33 to ~0.46, shifting the
    // 9:16 video's crop device to device. Deriving W0 from H0 keeps it
    // constant.
    const H0 = Math.min(Math.max(160, vh * 0.3), 280);
    return { W0: H0 * 0.5, H0 };
  }
  // W0 used to be computed independently from vw (Math.min(Math.max(200,
  // vw * 0.28), 370)). Since H0 is computed independently from vh, the two
  // formulas only coincidentally matched the intended 200x280 (5:7) card
  // ratio on tall-viewport screens like MacBooks — on shorter-viewport
  // "smaller notebook" panels (1366x768, 1280x720 etc.) the container came
  // out noticeably more square, which changed how the 16:9 video gets
  // cropped to cover it and broke the designed composition. Deriving W0
  // from H0 keeps the card's ratio (and therefore the video crop) constant
  // across every desktop screen size.
  const H0 = Math.min(Math.max(280, vh * 0.54), 640);
  return { W0: H0 * (200 / 280), H0 };
}

export default function Hero() {
  const { lang } = useLanguage();
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
    // Mouse parallax: pointer devices only, and the loop only runs while the
    // hero is on screen and the text is still easing — it used to spin every
    // frame forever, on phones too.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let raf = 0;
    let looping = false;
    function parallaxLoop() {
      heroLX += (heroMX - heroLX) * 0.07;
      heroLY += (heroMY - heroLY) * 0.07;
      const inHero = document.body.classList.contains("hero-mode");
      if (inHero) applyHeroTransform();
      if (inHero && (Math.abs(heroMX - heroLX) > 0.0005 || Math.abs(heroMY - heroLY) > 0.0005)) {
        raf = requestAnimationFrame(parallaxLoop);
      } else looping = false;
    }
    function kickParallax() {
      if (looping || !finePointer) return;
      looping = true;
      raf = requestAnimationFrame(parallaxLoop);
    }
    function onMouseMoveKick(e: MouseEvent) {
      onMouseMove(e);
      kickParallax();
    }
    if (finePointer) document.addEventListener("mousemove", onMouseMoveKick);

    // ── Sticky hero media resize + scroll-driven state ──
    let lastCss = "";
    let lastScale = "";
    // write a style only when its value changes — repeated identical writes
    // still invalidate style on every scroll frame
    const lastVals = new Map<string, string>();
    function put(el: HTMLElement, key: string, prop: string, v: string) {
      if (lastVals.get(key) === v) return;
      lastVals.set(key, v);
      // important: the cue and the role line have entrance animations that
      // fill forwards, and a filling animation beats a plain inline style —
      // they never faded out (the scroll cue sat on top of the full video)
      el.style.setProperty(prop, v, "important");
    }
    let mode = "";

    /*
     * Desktop composition (measured, so it holds at any width / language):
     *   - the signature sits on the baseline of "Bruno." — it closes the
     *     sentence instead of floating in the right third;
     *   - the card is centred in the free space between the text block and
     *   the signature (not on the viewport, where the wide headline crowded
     *     it), and glides to the viewport centre as it grows to full screen.
     * Layout offsets, not rects: they ignore the text's parallax transform
     * and the entrance animations.
     */
    let cardCx: number | null = null;
    function relBox(el: HTMLElement) {
      let x = 0, y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== ht) {
        x += n.offsetLeft;
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    }
    function layoutDesktop() {
      const vw = window.innerWidth;
      const sig = ht!.querySelector<HTMLElement>(".hero-signature");
      const img = sig?.querySelector<HTMLElement>("img");
      const greet = ht!.querySelector<HTMLElement>(".hero-greeting");
      const base = ht!.querySelector<HTMLElement>(".hg-base");
      if (vw <= 768 || !sig || !img || !greet || !base) {
        if (sig) {
          sig.style.translate = "";
          sig.classList.remove("sig-off");
        }
        cardCx = null;
        return;
      }
      // the body of the signature (its arches) sits ~78% down the image
      const b = relBox(base), im = relBox(img);
      sig.style.translate = "0 " + (b.y - (im.y + im.h * 0.78)).toFixed(1) + "px";
      const g = relBox(greet);
      const free0 = g.x + g.w;
      const { W0 } = baseMediaSize(vw, window.innerHeight);
      const need = W0 + 96; // the card plus a breath on each side
      if (im.x - free0 >= need) {
        sig.classList.remove("sig-off");
        cardCx = (free0 + im.x) / 2;
      } else if (vw - 48 - free0 >= need) {
        // narrow desktops / tablets: no room for all three — the signature
        // is the one that steps out, the card takes its space
        sig.classList.add("sig-off");
        cardCx = (free0 + vw - 48) / 2;
      } else {
        sig.classList.remove("sig-off");
        cardCx = null;
      }
    }

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
      } else if (cardCx !== null) {
        const { W0 } = baseMediaSize(vw, window.innerHeight);
        const expansion = Math.max(0, Math.min((w - W0) / (vw - W0), 1));
        const cx = cardCx + (vw / 2 - cardCx) * expansion;
        leftVal = (cx - w / 2).toFixed(1) + "px";
        txVal = "none";
      } else {
        leftVal = "50%";
        txVal = "translateX(-50%)";
      }
      const css =
        "position:absolute;overflow:hidden;cursor:none;z-index:5;" +
        "will-change:width,height,border-radius,top,left,transform;" +
        "width:" + w.toFixed(1) + "px;height:" + h.toFixed(1) + "px;border-radius:" + r.toFixed(2) + "px;top:" + top.toFixed(1) + "px;" +
        "left:" + leftVal + ";transform:" + txVal + ";";
      // Every write here relayouts the card and the Vimeo iframe inside it:
      // skip frames where nothing moved (most of the page, once the hero is
      // behind us).
      if (css === lastCss) return;
      lastCss = css;
      hm!.style.cssText = css;

      const iframe = hm!.querySelector<HTMLIFrameElement>("iframe");
      if (iframe) {
        const videoRatio = isMobile ? MOBILE_VIDEO_RATIO : DESKTOP_VIDEO_RATIO;
        const containerRatio = w / h;
        const scale = containerRatio < videoRatio ? videoRatio / containerRatio : containerRatio / videoRatio;
        const scaleStr = scale.toFixed(4);
        if (scaleStr === lastScale && iframe.style.width) return;
        lastScale = scaleStr;
        iframe.style.setProperty("width", "100%", "important");
        iframe.style.setProperty("height", "100%", "important");
        iframe.style.setProperty("top", "0", "important");
        iframe.style.setProperty("left", "0", "important");
        iframe.style.setProperty("transform", "scale(" + scaleStr + ")", "important");
        iframe.style.setProperty("transform-origin", "center center", "important");
      }
    }

    // Only touch the iframe's src when isMobile actually flips (e.g. a phone
    // rotating past the 768px breakpoint) — resize fires continuously while
    // dragging a window, and resetting src on every tick would restart
    // playback each time.
    // The hero video (Vimeo player — the heaviest thing on the page) starts
    // loading only once the page itself has finished loading. The loader is
    // still on screen then, so it's ready by the time the capsule lands.
    let videoAllowed = false;
    function allowVideo() {
      if (videoAllowed) return;
      videoAllowed = true;
      lastIsMobile = null;
      syncVideoSrc();
    }
    const onLoad = () => setTimeout(allowVideo, 150);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    let lastIsMobile: boolean | null = null;
    function syncVideoSrc() {
      if (!videoAllowed) return;
      const isMobile = window.innerWidth <= 768;
      if (isMobile === lastIsMobile) return;
      lastIsMobile = isMobile;
      const iframe = hm!.querySelector<HTMLIFrameElement>("iframe");
      if (iframe) iframe.src = vimeoSrc(isMobile ? MOBILE_VIMEO_ID : DESKTOP_VIMEO_ID);
    }

    function initM() {
      const vh = window.innerHeight,
        vw = window.innerWidth;
      const { W0: W, H0: H } = baseMediaSize(vw, vh);
      syncVideoSrc();
      layoutDesktop();
      setM(W, H, 20, (vh - H) / 2);
      // Visibility before the loader hands over is gated in CSS
      // (body:not(.media-ready)). Setting opacity inline here used to hide
      // the video again on every window resize after load.
    }
    initM();
    window.addEventListener("resize", initM);

    function updH() {
      const sy = window.scrollY,
        vh = window.innerHeight,
        vw = window.innerWidth;
      // Desktop's 3x-viewport expansion distance felt like too much
      // scrolling to reach the fullscreen video on a phone (reported by a
      // friend testing the deployed site) — shrink it on mobile only.
      const expandVh = vw <= 768 ? 1.8 : 3;
      const { W0, H0 } = baseMediaSize(vw, vh);
      const t1 = Math.min(sy / (vh * expandVh), 1),
        e1 = eic(t1);
      const cW = W0 + (vw - W0) * e1,
        cH = H0 + (vh - H0) * e1,
        cR = 20 * (1 - e1);
      const t2 = Math.max(0, Math.min((sy - vh * expandVh) / vh, 1)),
        e2 = eic(t2);
      setM(cW, cH, cR, (vh - cH) / 2 - e2 * (vh + cH / 2));
      const uiF = Math.max(0, 1 - (t1 - 0.15) / 0.3);
      const uiS = uiF.toFixed(3);
      put(ht!, "ht", "opacity", uiS);
      put(hr!, "hr", "opacity", uiS);
      // the hero text is gone past ~45% of the expansion: stop moving it
      const hsy = -(Math.min(sy, vh * expandVh) * 0.18);
      if (hsy !== heroScrollY) {
        heroScrollY = hsy;
        applyHeroTransform();
      }
      put(hsc!, "hsc", "opacity", t1 < 0.02 ? "1" : t1 > 0.28 ? "0" : Math.max(0, 1 - (t1 - 0.02) / 0.26).toFixed(3));
      put(hn!, "hn", "opacity", uiS);
      put(hs!, "hs", "background-color", "rgba(245,243,239," + (1 - e2).toFixed(3) + ")");

      // Class changes on <body> restyle the whole page: only on a real flip
      // (it used to remove + re-add them on every scroll frame).
      const next = sy >= vh * (expandVh + 0.8) ? "dark" : "hero";
      if (next !== mode) {
        mode = next;
        const nd = document.getElementById("nav-dark");
        document.body.classList.toggle("hero-mode", next === "hero");
        document.body.classList.toggle("dark-mode", next === "dark");
        nd?.classList.toggle("visible", next === "dark");
      }
    }
    // Coalesce scroll events into one recompute per frame — updH() does
    // several style writes (including !important ones on the video iframe),
    // and running it once per raw 'scroll' event (which can fire many times
    // per frame during fast or reversed/momentum scrolling, especially on
    // mobile) was saturating the main thread and making the video visibly
    // stutter/freeze instead of resizing smoothly.
    let scrollRaf: number | null = null;
    function onScroll() {
      if (scrollRaf !== null) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        updH();
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    updH();
    // re-measure once the display font and the signature have their real size
    function relayout() {
      initM();
      updH();
    }
    document.fonts?.ready.then(relayout);
    // the text block changes width with the language and the display font
    const greetEl = ht.querySelector<HTMLElement>(".hero-greeting");
    let roW = 0;
    const ro = new ResizeObserver(() => {
      const w = greetEl?.offsetWidth || 0;
      if (w && w !== roW) {
        roW = w;
        relayout();
      }
    });
    if (greetEl) ro.observe(greetEl);
    // late font swaps can move things without changing the block's width
    window.addEventListener("load", relayout);
    const sigImg = ht.querySelector<HTMLImageElement>(".hero-signature img");
    if (sigImg && !sigImg.complete) sigImg.addEventListener("load", relayout, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", onScroll);
      revealObserver?.disconnect();
      document.removeEventListener("mousemove", onMouseMoveKick);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", initM);
      ro.disconnect();
      window.removeEventListener("load", relayout);
    };
  }, []);

  return (
    <section
      id="hero"
      ref={rootRef}
      data-scene="01"
      data-scene-label={t({ pt: "Abertura", en: "Opening" }, lang)}
    >
      <div id="hero-sticky" ref={heroStickyRef}>
        <div className="hero-nav" id="heroNav" ref={heroNavRef}>
          <div className="hero-nav-logo">
            <Logo />
          </div>
          <div className="hero-nav-links">
            <a href="#work-intro">{t(dict.navWork, lang)}</a>
            <a href="#about">{t(dict.navAbout, lang)}</a>
            <a href="#contact">{t(dict.navContact, lang)}</a>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="hero-text-wrap" id="heroTexts" ref={heroTextsRef}>
          <div
            className="hero-greeting"
            data-kinetic-block
            aria-label={`${t(dict.heroGreeting1, lang)} ${t(dict.heroGreeting2, lang)} ${t(dict.heroGreeting3, lang)}. ${t(dict.heroSubtitle, lang)}`}
          >
            <div className="hg-line">
              <span className="hg-w">{t(dict.heroGreeting1, lang)}</span>
            </div>
            <div className="hg-line">
              <span className="hg-w" style={{ transitionDelay: ".12s" }}>
                {t(dict.heroGreeting2, lang)}
              </span>
            </div>
            <div className="hg-line">
              <span className="hg-w" style={{ transitionDelay: ".24s" }}>
                {t(dict.heroGreeting3, lang)}
                <em>.</em>
                <span className="hg-base" aria-hidden="true" />
              </span>
            </div>
            <div className="hg-line hg-line-subtitle">
              <span className="hg-w hero-subtitle" style={{ transitionDelay: ".36s" }}>
                {t(dict.heroSubtitle, lang)}
              </span>
            </div>
          </div>
          <div className="hero-signature">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBasePath("/assets/signature-bruno.webp")} alt="" />
          </div>
        </div>

        <div className="hero-role" id="heroRole" ref={heroRoleRef}>
          <div className="hero-role-line">{t(dict.heroRoleLine, lang)}</div>
        </div>

        <div id="heroMedia" ref={heroMediaRef}>
          <div className="hero-media-inner">
            <iframe
              title="Showreel"
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
          <span className="scroll-txt">{t(dict.heroScrollCue, lang)}</span>
        </div>
      </div>
    </section>
  );
}
