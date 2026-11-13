import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified },
    { url: `${SITE_URL}/trajetoria/`, lastModified },
    { url: `${SITE_URL}/briefing/`, lastModified },
    { url: `${SITE_URL}/privacidade/`, lastModified },
  ];
}
