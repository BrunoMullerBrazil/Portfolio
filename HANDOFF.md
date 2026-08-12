# AUÊ / Portfólio Müller — Handoff para Next.js

## O que já está pronto neste pacote
Assets extraídos do `index.html` (base64 → arquivos), prontos para `/public`:

/public
  /fonts
    franie.woff2      (display / headlines)
    gcgrind.woff2     (wordmark + numeração)
  /assets
    window-shadow.png (sombra de janela — hero + contato)
    signature.png     (assinatura do hero)
    muller-logo.svg   (logotipo vetorial — loader / nav / footer)

## Fontes no Next.js (next/font/local) — cole em app/fonts.ts
```ts
import localFont from 'next/font/local'

export const franie = localFont({
  src: '../public/fonts/franie.woff2',
  variable: '--font-franie',
  display: 'swap',
})
export const gcgrind = localFont({
  src: '../public/fonts/gcgrind.woff2',
  variable: '--font-gcgrind',
  display: 'swap',
})
```
IMPORTANTE: a Franie tem eixo `wght` de 0–100 (não 1–1000) e `ital` 0–100.
Não use font-weight nomeado (300/400) — use valores diretos (24, 44) ou
`font-variation-settings: 'wght' 24, 'ital' 100` para o itálico real.

## Caminhos a corrigir no CSS ao portar
- @font-face base64 → removido (usar next/font acima)
- `--winshadow: url('data:...')` → `url('/assets/window-shadow.png')`
- assinatura base64 → `/assets/signature.png`
- logo do loader/nav → componente a partir de `/assets/muller-logo.svg`

## Ordem de port sugerida (seção por seção, com dev server rodando)
1. Scaffold: create-next-app (App Router, TS, Tailwind) + next/font
2. globals.css: colar o CSS do index.html, trocar os caminhos acima
3. Componentes: Loader → CustomCursor → SmoothScroll(Lenis) → Hero →
   Work(cinema) → About → Services → Contact → Footer
4. JS vanilla (cursor, Lenis, loader-fill, cinema) → useEffect em client components
5. Vídeos: trocar os placeholders de gradiente por embeds Vimeo
