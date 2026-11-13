import type { Metadata } from "next";
import styles from "./briefing.module.css";
import { caveat } from "../fonts";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PDF = `${BASE}/briefing/briefing-de-direcao-muller.pdf`;

const PAGE_TITLE = "Briefing de Direção";
const PAGE_DESCRIPTION =
  "O documento que eu usei pra comandar a IA num motion de 36 segundos, com as referências que mandei e as decisões que ela não tomou sozinha. PDF gratuito.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: `${PAGE_TITLE} — Bruno Müller`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/briefing/`,
    images: [{ url: "/briefing/capa.jpg", width: 637, height: 900, alt: PAGE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} — Bruno Müller`,
    description: PAGE_DESCRIPTION,
    images: ["/briefing/capa.jpg"],
  },
};

const INDICE = [
  ["p. 02", "A tese", "Por que o vídeo só ficou meu quando o material e as notas ficaram meus."],
  ["p. 03", "A IA não inventa o que você não mostrou", "Nove trocas reais: o que a IA inventou, o que eu mandei e o que mudou."],
  ["p. 04", "Kit de referências", "O que mandar (vídeo, print, foto, textura, identidade, voz) e como mandar."],
  ["p. 05", "2D, 2.5D ou Blender", "Quando cada um compensa, quanto custa de render e como pedir."],
  ["p. 06", "O método em 7 etapas", "Da referência decupada ao render em partes, com a narração antes."],
  ["p. 07–08", "Gramática de estilo e prompt de plano", "Os modelos que você copia e preenche no próximo vídeo."],
  ["p. 09", "Diário de direção", "As 11 notas que eu dei, na ordem, e o que cada uma mudou."],
  ["p. 10", "Checklist do diretor", "O que revisar antes de aprovar qualquer render."],
];

const FRAMES = [
  ["frame1.jpg", "Abertura: pôster laranja com Todo mundo a mesma IA", "a abertura"],
  ["frame2.jpg", "Celular na mesa de nogueira com a tela de bloqueio na praia", "minha madeira, minha praia"],
  ["frame3.jpg", "Efeito de marca-texto em Deixa gerarem", "a referência que eu mandei"],
  ["frame4.jpg", "Card com o cavaleiro em chamas e a palavra FOGO", "a minha ilustração"],
];

export default function Briefing() {
  return (
    <main className={`${styles.page} ${caveat.variable}`}>
      <div className={styles.wrap}>
        <header className={styles.top}>
          <a href={`${BASE}/`} aria-label="Bruno Müller — início">
            <img className={styles.logo} src={`${BASE}/assets/muller-logo.svg`} alt="Müller" />
          </a>
          <span className={styles.kicker}>Material gratuito · PDF · 11 páginas</span>
        </header>

        <div className={styles.hero}>
          <div>
            <h1 className={styles.h1}>Briefing de direção</h1>
            <p className={styles.lead}>
              O documento que eu usei pra comandar a IA num motion de 36 segundos, com as referências que mandei e as
              decisões que ela não tomou sozinha.
            </p>
            <p className={styles.mao}>
              ferramenta se copia. <span className={styles.hl}>direção, não.</span>
            </p>
            <div className={styles.cta}>
              <a className={styles.baixar} href={PDF} download="Briefing de Direcao - Muller.pdf">
                Baixar o PDF grátis
              </a>
              <span className={styles.meta}>PDF · 480 KB</span>
            </div>
          </div>
          <div className={styles.folha}>
            <span className={styles.fita} aria-hidden="true" />
            <img
              className={styles.capa}
              src={`${BASE}/briefing/capa.jpg`}
              alt="Capa do Briefing de Direção: título em laranja sobre fundo escuro"
              width={637}
              height={900}
            />
          </div>
        </div>

        <section className={styles.section} aria-labelledby="dentro">
          <h2 id="dentro" className={styles.h2}>O que tem dentro</h2>
          <ol className={styles.indice}>
            {INDICE.map(([pg, t, d]) => (
              <li key={t}>
                <span className={styles.pg}>{pg}</span>
                <div>
                  <b>{t}</b>
                  <span>{d}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="video">
          <h2 id="video" className={styles.h2}>O vídeo que gerou o briefing</h2>
          <p className={styles.nota}>
            Feito com IA do roteiro ao render. Fotos, texturas, prints e peças da minha identidade substituíram tudo o
            que a IA tinha inventado no lugar.
          </p>
          <div className={styles.prova}>
            {FRAMES.map(([src, alt, cap]) => (
              <figure key={src}>
                <img src={`${BASE}/briefing/${src}`} alt={alt} width={360} height={640} loading="lazy" />
                <figcaption>{cap}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <footer className={styles.fim}>
          <a className={styles.baixar} href={PDF} download="Briefing de Direcao - Muller.pdf">
            Baixar o PDF grátis
          </a>
          <p className={styles.meta}>Usou o briefing num vídeo seu? Me marca no Instagram.</p>
        </footer>
      </div>
    </main>
  );
}
