import Link from "next/link";

// Entry points into the format-specific galleries that live outside the
// video-first WorkIntro grid (each opens as its own page, not inline).
// Ilustração intentionally has no tile yet — that work isn't ready, so
// there's nothing to link to. Add a second .format-tile here (pointing at
// /ilustracao) once that page exists.
export default function FormatLinks() {
  return (
    <div id="format-links">
      <div className="format-links-wrap">
        <Link href="/design" className="format-tile reveal" data-cursor="click">
          <span className="format-tile-media" aria-hidden="true" />
          <span className="format-tile-label">Design</span>
        </Link>
      </div>
    </div>
  );
}
