"use client";

import { useLanguage, t } from "@/lib/LanguageContext";
import { dict } from "@/lib/translations";

const WHATSAPP_NUMBER = "5548991879579";

export default function WhatsAppButton() {
  const { lang } = useLanguage();
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t(dict.whatsappMessage, lang))}`;

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener" className="wa-float" aria-label="Falar no WhatsApp">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
          fill="currentColor"
        />
        <path
          d="M12.004 2C6.486 2 2 6.486 2 12.004c0 1.86.5 3.664 1.446 5.24L2 22l4.882-1.427a9.96 9.96 0 0 0 5.12 1.398h.004c5.518 0 10.004-4.487 10.004-10.005C22.01 6.486 17.523 2 12.004 2zm0 18.19h-.003a8.19 8.19 0 0 1-4.174-1.144l-.3-.178-3.104.907.916-3.025-.194-.31a8.18 8.18 0 0 1-1.256-4.436c0-4.522 3.68-8.201 8.204-8.201 2.19 0 4.25.854 5.798 2.404a8.14 8.14 0 0 1 2.399 5.8c0 4.523-3.68 8.183-8.286 8.183z"
          fill="currentColor"
        />
      </svg>
      <span className="wa-float-label">{t(dict.whatsappLabel, lang)}</span>
    </a>
  );
}
