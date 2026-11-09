import Script from "next/script";
import { GA_MEASUREMENT_ID, GTM_ID } from "@/lib/analytics";

// Production builds only, so `npm run dev` sessions don't pollute the data.
const enabled = process.env.NODE_ENV === "production";

export default function Analytics() {
  if (!enabled) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} strategy="afterInteractive" />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
