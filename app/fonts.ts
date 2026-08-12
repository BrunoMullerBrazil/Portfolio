import localFont from "next/font/local";
import { Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
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
