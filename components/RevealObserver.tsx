"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RevealObserver() {
  const pathname = usePathname();

  // Re-scans on every route change — this layout-level component only
  // mounts once per session, so without the pathname dependency, .reveal
  // elements on a page reached via client-side navigation (e.g. the
  // "Minha trajetória" link) would never get observed.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
