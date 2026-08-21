import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// TEMPORARY — mirrors the `robots: { index: false, follow: false }` block
// in app/layout.tsx. The site still has pending content (e.g. /trajetoria
// isn't linked from anywhere yet), so crawling is blocked entirely for now.
//
// To go live in search once approved: replace the `disallow: "/"` rule
// below with `allow: "/"`, and delete the `robots` block in
// app/layout.tsx (Next.js defaults to index/follow without it).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
