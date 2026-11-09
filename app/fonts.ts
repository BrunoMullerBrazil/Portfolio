import localFont from "next/font/local";
import { Inter, Anton, Playfair_Display, Space_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
});

// Used only on /trajetoria — a deliberately different, rawer register
// from the rest of the site (Weingart-style typewriter/highlighter
// editorial concept, approved by the client).
export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
  preload: false, // subpages only — the home never downloads it
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: false, // subpages only
});

export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
  preload: false, // subpages + editors only
});

export const franie = localFont({
  src: "../public/fonts/franie.woff2",
  variable: "--font-franie",
  display: "swap",
});

export const gcgrind = localFont({
  src: "../public/fonts/gcgrind.woff2",
  variable: "--font-gcgrind",
  display: "swap",
});
