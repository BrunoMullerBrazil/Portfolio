// Public IDs — they end up in every page's source anyway, so they live here
// rather than in build env vars. Leave one empty to switch that tool off.
export const GA_MEASUREMENT_ID = ""; // Google Analytics 4, "G-XXXXXXXXXX"
export const CLARITY_PROJECT_ID = ""; // Microsoft Clarity, e.g. "abcd1234ef"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, string | number> = {}) {
  window.gtag?.("event", name, params);
  window.clarity?.("event", name);
}
