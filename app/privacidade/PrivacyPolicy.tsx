"use client";

import Link from "next/link";
import { useLanguage, t } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { openCookieSettings } from "@/components/CookieConsent";

const EMAIL = "contato@aue.productions";
const UPDATED = { pt: "9 de novembro de 2026", en: "November 9, 2026" };

const COOKIES = [
  {
    name: "cookie-consent",
    who: { pt: "Este site (armazenamento local)", en: "This site (local storage)" },
    why: { pt: "Lembra a sua escolha sobre cookies", en: "Remembers your cookie choice" },
    ttl: { pt: "Até você limpar o navegador", en: "Until you clear your browser" },
  },
  {
    name: "_ga",
    who: { pt: "Google Analytics", en: "Google Analytics" },
    why: { pt: "Distingue visitantes", en: "Tells visitors apart" },
    ttl: { pt: "2 anos", en: "2 years" },
  },
  {
    name: "_ga_CL9DR6S172",
    who: { pt: "Google Analytics", en: "Google Analytics" },
    why: { pt: "Mantém o estado da visita", en: "Keeps the visit's state" },
    ttl: { pt: "2 anos", en: "2 years" },
  },
  {
    name: "_clck",
    who: { pt: "Microsoft Clarity", en: "Microsoft Clarity" },
    why: { pt: "Reconhece quem volta ao site", en: "Recognizes returning visitors" },
    ttl: { pt: "1 ano", en: "1 year" },
  },
  {
    name: "_clsk",
    who: { pt: "Microsoft Clarity", en: "Microsoft Clarity" },
    why: { pt: "Agrupa as páginas de uma mesma visita", en: "Groups the pages of one visit" },
    ttl: { pt: "1 dia", en: "1 day" },
  },
];

const Mail = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

function Pt() {
  return (
    <>
      <p className="legal-lead">
        Este site só usa ferramentas de análise se você aceitar. Os dados servem pra entender quais páginas e projetos
        interessam, nunca pra anúncios ou venda.
      </p>

      <h2>Quem é o responsável</h2>
      <p>
        Bruno Müller, Florianópolis, Brasil, é o controlador dos dados tratados neste site. Qualquer pedido ou dúvida:{" "}
        <Mail />.
      </p>

      <h2>O que é coletado</h2>
      <p>
        <strong>Sem o seu consentimento</strong>, nenhuma ferramenta de análise é carregada. A hospedagem do site (Vercel)
        registra dados técnicos de cada acesso, como endereço IP e navegador, pra manter o site funcionando e seguro.
      </p>
      <p>
        <strong>Se você clicar em Aceitar</strong>, entram duas ferramentas:
      </p>
      <ul>
        <li>
          <strong>Google Analytics:</strong> páginas vistas, de onde veio a visita, cidade e país aproximados, dispositivo,
          navegador, até onde você rolou a página, cliques em links externos e quais projetos da galeria você viu ou deu
          play.
        </li>
        <li>
          <strong>Microsoft Clarity:</strong> cliques, rolagem e movimentos do mouse, usados em mapas de calor e em
          gravações da navegação. O site não tem formulários, e o Clarity não registra o que é digitado.
        </li>
      </ul>
      <p>
        <strong>Se você entrar em contato</strong> por e-mail, WhatsApp, LinkedIn ou Instagram, uso o que você me mandar
        só pra responder e conduzir a conversa.
      </p>
      <p>
        Os vídeos são exibidos pelo player do Vimeo, configurado pra não usar cookies de rastreamento.
      </p>

      <h2>Base legal</h2>
      <ul>
        <li>Ferramentas de análise: o seu consentimento (LGPD, art. 7º, I), que pode ser retirado a qualquer momento.</li>
        <li>Registros da hospedagem: legítimo interesse em manter o site seguro e no ar (art. 7º, IX).</li>
        <li>Mensagens de contato: atender o seu pedido (art. 7º, V).</li>
      </ul>

      <h2>Com quem os dados são compartilhados</h2>
      <p>
        Com Google (Analytics), Microsoft (Clarity), Vercel (hospedagem) e Vimeo (vídeos), que processam os dados em meu
        nome. Essas empresas podem tratar os dados fora do Brasil, inclusive nos Estados Unidos, sob as suas próprias
        garantias contratuais. Não vendo nem repasso dados a mais ninguém.
      </p>

      <h2>Cookies</h2>
      <CookieTable lang="pt" />
      <p>O Clarity também pode gravar cookies no próprio domínio dele (clarity.ms).</p>

      <h2>Por quanto tempo</h2>
      <ul>
        <li>Google Analytics: até 14 meses.</li>
        <li>Microsoft Clarity: gravações por 30 dias; dados agregados por até 13 meses.</li>
        <li>Mensagens de contato: enquanto durar a conversa ou a relação profissional.</li>
      </ul>

      <h2>Os seus direitos</h2>
      <p>
        Pela LGPD (art. 18) você pode confirmar se trato dados seus, acessá-los, corrigi-los, pedir que sejam apagados,
        saber com quem foram compartilhados e retirar o seu consentimento. Os pedidos vão por e-mail pra <Mail />. Você
        também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>
      <p>
        <button type="button" className="legal-btn" data-cursor="click" onClick={openCookieSettings}>
          Mudar minha escolha de cookies
        </button>
      </p>

      <h2>Mudanças nesta política</h2>
      <p>Quando algo mudar, esta página é atualizada e a data abaixo também.</p>
    </>
  );
}

function En() {
  return (
    <>
      <p className="legal-lead">
        This site only runs analytics tools if you accept them. The data is used to understand which pages and projects
        people care about, never for ads or for sale.
      </p>

      <h2>Who is responsible</h2>
      <p>
        Bruno Müller, Florianópolis, Brazil, is the controller of the data handled on this site. Any request or question:{" "}
        <Mail />.
      </p>

      <h2>What is collected</h2>
      <p>
        <strong>Without your consent</strong>, no analytics tool is loaded. The site&apos;s host (Vercel) logs technical
        data about each request, such as IP address and browser, to keep the site running and secure.
      </p>
      <p>
        <strong>If you click Accept</strong>, two tools come in:
      </p>
      <ul>
        <li>
          <strong>Google Analytics:</strong> pages viewed, where the visit came from, approximate city and country,
          device, browser, how far you scrolled, clicks on external links and which gallery projects you viewed or
          played.
        </li>
        <li>
          <strong>Microsoft Clarity:</strong> clicks, scrolling and mouse movement, used for heatmaps and session
          recordings. The site has no forms, and Clarity does not record what is typed.
        </li>
      </ul>
      <p>
        <strong>If you get in touch</strong> by email, WhatsApp, LinkedIn or Instagram, what you send is used only to
        reply and carry on the conversation.
      </p>
      <p>Videos play through the Vimeo player, set up not to use tracking cookies.</p>

      <h2>Legal basis</h2>
      <ul>
        <li>Analytics tools: your consent (Brazil&apos;s LGPD, art. 7, I), which you can withdraw at any time.</li>
        <li>Hosting logs: legitimate interest in keeping the site secure and online (art. 7, IX).</li>
        <li>Contact messages: handling your request (art. 7, V).</li>
      </ul>

      <h2>Who the data is shared with</h2>
      <p>
        Google (Analytics), Microsoft (Clarity), Vercel (hosting) and Vimeo (videos), which process the data on my behalf.
        These companies may process data outside Brazil, including in the United States, under their own contractual
        safeguards. I don&apos;t sell or pass data on to anyone else.
      </p>

      <h2>Cookies</h2>
      <CookieTable lang="en" />
      <p>Clarity may also set cookies on its own domain (clarity.ms).</p>

      <h2>How long it is kept</h2>
      <ul>
        <li>Google Analytics: up to 14 months.</li>
        <li>Microsoft Clarity: recordings for 30 days; aggregated data for up to 13 months.</li>
        <li>Contact messages: for as long as the conversation or working relationship lasts.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Under the LGPD (art. 18) you can confirm whether I hold data about you, access it, correct it, ask for it to be
        deleted, learn who it was shared with and withdraw your consent. Requests go by email to <Mail />. You can also
        complain to Brazil&apos;s data protection authority (ANPD).
      </p>
      <p>
        <button type="button" className="legal-btn" data-cursor="click" onClick={openCookieSettings}>
          Change my cookie choice
        </button>
      </p>

      <h2>Changes to this policy</h2>
      <p>When something changes, this page is updated along with the date below.</p>
    </>
  );
}

function CookieTable({ lang }: { lang: "pt" | "en" }) {
  const head =
    lang === "pt" ? ["Nome", "De quem", "Para quê", "Duração"] : ["Name", "Set by", "Purpose", "Duration"];
  return (
    <div className="legal-table-wrap">
      <table className="legal-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COOKIES.map((c) => (
            <tr key={c.name}>
              <td>
                <code>{c.name}</code>
              </td>
              <td>{t(c.who, lang)}</td>
              <td>{t(c.why, lang)}</td>
              <td>{t(c.ttl, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  return (
    <main className="legal">
      <div className="legal-inner">
        <div className="legal-top">
          <Link href="/" className="legal-back" data-cursor="click">
            ← {lang === "pt" ? "Voltar" : "Back"}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="legal-eyebrow">{lang === "pt" ? "Privacidade" : "Privacy"}</div>
        <h1>{lang === "pt" ? "Política de privacidade" : "Privacy policy"}</h1>
        {lang === "pt" ? <Pt /> : <En />}
        <p className="legal-updated">
          {lang === "pt" ? "Última atualização: " : "Last updated: "}
          {t(UPDATED, lang)}
        </p>
      </div>
    </main>
  );
}
