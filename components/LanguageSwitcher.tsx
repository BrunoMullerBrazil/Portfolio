"use client";

import { useLanguage } from "@/lib/LanguageContext";

function FlagBR() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#189A4C" />
      <path d="M10 2.2L18 7L10 11.8L2 7Z" fill="#F6C519" />
      <circle cx="10" cy="7" r="3" fill="#1F4C9C" />
    </svg>
  );
}

function FlagUS() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#ffffff" />
      <g clipPath="url(#us-clip)">
        <rect width="20" height="14" fill="#B22234" />
        {[1, 3, 5, 7, 9, 11, 13].map((y) => (
          <rect key={y} y={y} width="20" height="1" fill="#ffffff" />
        ))}
        <rect width="9" height="7" fill="#3C3B6E" />
      </g>
      <defs>
        <clipPath id="us-clip">
          <rect width="20" height="14" rx="2" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function LanguageSwitcher() {
  const { lang, toggleLang } = useLanguage();
  const target = lang === "pt" ? "en" : "pt";

  return (
    <button
      className="lang-switch"
      onClick={toggleLang}
      aria-label={target === "en" ? "Switch to English" : "Mudar para português"}
      title={target === "en" ? "English" : "Português"}
    >
      {lang === "en" ? <FlagUS /> : <FlagBR />}
    </button>
  );
}
