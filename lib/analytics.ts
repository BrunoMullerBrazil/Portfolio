// Google tag (Tag Manager container). GA4 and Clarity are configured inside
// the container, not here, so tags can be added or changed without a deploy.
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
