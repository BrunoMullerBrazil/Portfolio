import type { Metadata } from "next";
import { franie, gcgrind, inter, anton, playfair, spaceMono, montserrat } from "./fonts";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import RevealObserver from "@/components/RevealObserver";
import MagneticCursor from "@/components/MagneticCursor";
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
  // TEMPORARY — the site still has pending content (e.g. /trajetoria isn't
  // linked from anywhere yet), so indexing is intentionally off until Bruno
  // approves going live in search. To re-enable: delete this whole `robots`
  // block (Next.js defaults to index/follow without it) AND update
  // app/robots.ts to match — see the comment there.
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${franie.variable} ${gcgrind.variable} ${inter.variable} ${anton.variable} ${playfair.variable} ${spaceMono.variable} ${montserrat.variable}`}
    >
      <body
        style={
          {
            // Overrides globals.css's static `/assets/...` value so the
            // window-shadow asset still resolves under a GitHub Pages basePath.
            "--winshadow": `url(${withBasePath("/assets/window-shadow.png")})`,
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
          <RevealObserver />
          <MagneticCursor />
          <WhatsAppButton />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
