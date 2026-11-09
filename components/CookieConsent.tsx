"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage, t } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";
import Analytics from "./Analytics";

type Choice = "granted" | "denied";

const KEY = "cookie-consent";
const OPEN_EVENT = "cookie-consent:open";
const ANALYTICS_COOKIE = /^(_ga|_ga_.+|_gid|_clck|_clsk)$/;

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function saveChoice(c: Choice) {
  try {
    localStorage.setItem(KEY, c);
  } catch {}
}

// GA sets its cookies on the parent domain, so try every variant.
function clearAnalyticsCookies() {
  const host = location.hostname;
  const domains = ["", host, "." + host.replace(/^www\./, "")];
  document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => ANALYTICS_COOKIE.test(name))
    .forEach((name) =>
      domains.forEach((d) => {
        document.cookie = `${name}=; Max-Age=0; path=/${d ? "; domain=" + d : ""}`;
      })
    );
}

export default function CookieConsent() {
  const { lang } = useLanguage();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = readChoice();
    setChoice(saved);
    if (!saved) setOpen(true);
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  function decide(c: Choice) {
    saveChoice(c);
    setOpen(false);
    // Scripts already running can't be unloaded — revoking needs a fresh page.
    if (c === "denied" && choice === "granted") {
      clearAnalyticsCookies();
      location.reload();
      return;
    }
    setChoice(c);
  }

  return (
    <>
      {choice === "granted" && <Analytics />}
      {open && (
        <div className="cookie-banner" role="dialog" aria-label={t(dict.cookieLabel, lang)}>
          <p>
            {t(dict.cookieText, lang)}{" "}
            <Link href="/privacidade" data-cursor="click">
              {t(dict.privacyPolicy, lang)}
            </Link>
          </p>
          <div className="cookie-actions">
            <button type="button" className="cookie-btn" data-cursor="click" onClick={() => decide("denied")}>
              {t(dict.cookieDecline, lang)}
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-accept"
              data-cursor="click"
              onClick={() => decide("granted")}
            >
              {t(dict.cookieAccept, lang)}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
