"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-switch" role="group" aria-label="Language / Idioma">
      <button
        type="button"
        className={"lang-switch-opt" + (lang === "en" ? " active" : "")}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <span className="lang-switch-sep" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        className={"lang-switch-opt" + (lang === "pt" ? " active" : "")}
        onClick={() => setLang("pt")}
        aria-pressed={lang === "pt"}
      >
        PT
      </button>
    </div>
  );
}
