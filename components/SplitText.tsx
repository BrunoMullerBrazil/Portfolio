import type { CSSProperties } from "react";

/*
 * React-owned text splitting (no DOM surgery, so language switches and
 * re-renders stay safe). The readable copy lives in a visually-hidden
 * span; the split glyphs are aria-hidden.
 *
 *   <SplitText>  one span per character (.ch, with --i for stagger) —
 *                used by the kinetic Franie headlines. data-kinetic
 *                hands it to MotionSystem (weight follows the cursor,
 *                italic follows scroll speed).
 *
 * Words are wrapped in nowrap inline-blocks so a line can only break
 * between words, never inside one.
 */

export function SplitText({ text, w }: { text: string; w?: number }) {
  const words = text.split(" ");
  let i = 0;
  return (
    <span className="split" data-kinetic={w ?? ""}>
      <span className="sr-only">{text}</span>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true">
          {wi > 0 ? " " : null}
          <span className="sw">
            {Array.from(word).map((c, ci) => (
              <span className="ch" key={ci} style={{ "--i": i++ } as CSSProperties}>
                {c}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
