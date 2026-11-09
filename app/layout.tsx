import type { Metadata } from "next";
import { franie, gcgrind, inter, anton, playfair, spaceMono } from "./fonts";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import MotionSystem from "@/components/MotionSystem";
import Timecode from "@/components/Timecode";
import FilmGrain from "@/components/FilmGrain";
import Guide from "@/components/Guide";
import WhatsAppButton from "@/components/WhatsAppButton";
import { withBasePath } from "@/lib/basePath";
import { LanguageProvider } from "@/lib/LanguageContext";
import { SITE_URL, SITE_NAME, TITLE_SUFFIX, DEFAULT_TITLE, DEFAULT_DESCRIPTION, OG_IMAGE } from "@/lib/seo";
import { jsonLd, serializeJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s — ${TITLE_SUFFIX}`,
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: "Bruno Müller", url: SITE_URL }],
  creator: "Bruno Müller",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [{ ...OG_IMAGE, alt: DEFAULT_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  // Live in search since Oct 2026 (approved by Bruno). /design stays out:
  // it's placeholder-only — see app/design/layout.tsx and app/robots.ts.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${franie.variable} ${gcgrind.variable} ${inter.variable} ${anton.variable} ${playfair.variable} ${spaceMono.variable}`}
    >
      <body
        style={
          {
            // Overrides globals.css's static `/assets/...` value so the
            // window-shadow asset still resolves under a GitHub Pages basePath.
            "--winshadow": `url(${withBasePath("/assets/window-shadow.webp")})`,
          } as React.CSSProperties
        }
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <LanguageProvider>
          <Loader />
          <Cursor />
          <SmoothScroll />
          <MotionSystem />
          <Timecode />
          <FilmGrain />
          <Guide />
          <WhatsAppButton />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
