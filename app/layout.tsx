import type { Metadata } from "next";
import { franie, gcgrind, inter } from "./fonts";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import RevealObserver from "@/components/RevealObserver";
import MagneticCursor from "@/components/MagneticCursor";
import { withBasePath } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "Bruno Müller — Videomaker & Editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${franie.variable} ${gcgrind.variable} ${inter.variable}`}>
      <body
        style={
          {
            // Overrides globals.css's static `/assets/...` value so the
            // window-shadow asset still resolves under a GitHub Pages basePath.
            "--winshadow": `url(${withBasePath("/assets/window-shadow.png")})`,
          } as React.CSSProperties
        }
      >
        <Loader />
        <Cursor />
        <SmoothScroll />
        <RevealObserver />
        <MagneticCursor />
        {children}
      </body>
    </html>
  );
}
