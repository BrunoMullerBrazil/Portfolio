"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict } from "./translations";

export type Lang = "pt" | "en";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const STORAGE_KEY = "site-lang";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "pt" || stored === "en") setLangState(stored);
  }, []);

  // Keep <html lang> in sync for accessibility/SEO — the static export
  // ships "pt-BR" for the no-JS/first-paint case, this updates it once
  // the visitor's stored (or chosen) language is known.
  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    document.title = dict.siteTitle[lang];
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleLang() {
    setLang(lang === "pt" ? "en" : "pt");
  }

  return <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export type Translated = { pt: string; en: string };

export function t(entry: Translated, lang: Lang) {
  return entry[lang];
}
