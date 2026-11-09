"use client";

import { useLanguage, t } from "@/lib/LanguageContext";

/*
 * Timecode HUD — the page read as a film. Scroll position is mapped onto a
 * fixed runtime (data-runtime, seconds) at 24fps; the current scene comes
 * from the nearest [data-scene] section. MotionSystem writes the values;
 * this component only owns the markup. The dot pulses while you scrub and
 * holds still when you stop, like a paused playhead.
 */
const LABEL = { pt: "Cena", en: "Scene" };

export default function Timecode() {
  const { lang } = useLanguage();
  return (
    <div id="tc" data-runtime="96" data-state="pause" aria-hidden="true">
      <span className="tc-dot" />
      <span id="tc-time">00:00:00:00</span>
      <span className="tc-sep" />
      <span className="tc-scene">
        {t(LABEL, lang)} <span id="tc-num">01</span>
      </span>
      <span className="tc-label-wrap">
        <span id="tc-label" />
      </span>
    </div>
  );
}
