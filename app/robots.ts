import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Search indexing is on. /design is excluded: it only holds placeholder
// layout content for now (it also carries a noindex in app/design/layout.tsx).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/design/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
