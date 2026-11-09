// GA4 is loaded here directly — don't also add a Google tag with this ID in
// the GTM container, or every hit is counted twice. The container carries
// everything else (Clarity, future pixels), editable without a deploy.
export const GA_MEASUREMENT_ID = "G-CL9DR6S172";
// Clarity too is loaded here, not through the container (same double-count rule).
export const CLARITY_PROJECT_ID = "zb4spt7so8";
export const GTM_ID = "GTM-PVCZGJDN";

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
