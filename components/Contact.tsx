"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/basePath";
import { useLanguage, t } from "@/lib/LanguageContext";

const EMAIL = "contato@aue.productions";

const LINKS = [
  { href: "mailto:" + EMAIL, label: { pt: "Email", en: "Email" }, value: EMAIL, external: false, isEmail: true },
  {
    href: "https://instagram.com/aue.produ",
    label: { pt: "Instagram", en: "Instagram" },
    value: "@aue.produ",
    external: true,
    isEmail: false,
  },
  {
    href: "https://linkedin.com/in/bpmuller",
    label: { pt: "LinkedIn", en: "LinkedIn" },
    value: "bpmuller",
    external: true,
    isEmail: false,
  },
];

const COPIED_LABEL = { pt: "Copiado!", en: "Copied!" };

export default function Contact() {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  // mailto: links fail silently on phones with no mail client configured —
  // copy the address too so there's always a visible fallback.
  function handleEmailClick() {
    navigator.clipboard?.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section id="contact">
      <div className="reveal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="contact-hl-img"
          src={withBasePath("/assets/logos/vamos.png")}
          alt="Vamos trabalhar juntos."
        />
      </div>
      <div>
        <div className="contact-links">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener" : undefined}
              className={"clink reveal reveal-d" + (i + 1)}
              onClick={l.isEmail ? handleEmailClick : undefined}
            >
              <span className="clink-lbl">{t(l.label, lang)}</span>
              <span className="clink-val">{l.isEmail && copied ? t(COPIED_LABEL, lang) : l.value}</span>
              <span className="clink-arrow">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
