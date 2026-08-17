"use client";

import { Logo } from "./Logo";
import { useLanguage, t } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavDark() {
  const { lang } = useLanguage();
  return (
    <nav id="nav-dark">
      <div className="nav-dark-logo">
        <Logo />
      </div>
      <div className="nav-dark-links">
        <a href="#work-intro">{t(dict.navWork, lang)}</a>
        <a href="#about">{t(dict.navAbout, lang)}</a>
        <a href="#contact">{t(dict.navContact, lang)}</a>
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
