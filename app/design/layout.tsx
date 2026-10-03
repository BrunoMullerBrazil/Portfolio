import type { Metadata } from "next";

// /design is placeholder-only for now: keep it out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
