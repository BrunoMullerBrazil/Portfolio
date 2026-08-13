// GITHUB_PAGES_BUILD is set only by the deploy workflow (.github/workflows/deploy-pages.yml),
// so `npm run dev` / a plain `npm run build` locally are unaffected — basePath stays empty.
const isPagesBuild = process.env.GITHUB_PAGES_BUILD === "1";
const basePath = isPagesBuild ? "/Portfolio" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    // Plain <img> src strings and CSS url() references aren't rewritten by
    // Next's basePath the way next/image or next/link are, so components
    // that reference /public files directly read this at build time instead.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
