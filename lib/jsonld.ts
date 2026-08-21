import { SITE_URL, SITE_NAME } from "@/lib/seo";

interface PersonSchema {
  "@type": "Person";
  "@id": string;
  name: string;
  alternateName: string;
  jobTitle: string;
  url: string;
  // TODO: add `image: "<absolute URL>"` once a real headshot is available —
  // deliberately omitted rather than pointing it at the wordmark/OG image,
  // which isn't a photo of a person and would misrepresent the schema.
  sameAs: string[];
  address: {
    "@type": "PostalAddress";
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  knowsAbout: string[];
}

interface WebSiteSchema {
  "@type": "WebSite";
  name: string;
  url: string;
  publisher: { "@id": string };
}

interface JsonLdGraph {
  "@context": "https://schema.org";
  "@graph": [PersonSchema, WebSiteSchema];
}

const PERSON_ID = `${SITE_URL}/#person`;

export const jsonLd: JsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Bruno Müller",
      alternateName: "Bruno Padilha Müller Ferreira",
      jobTitle: "Diretor de brand film e motion",
      url: SITE_URL,
      sameAs: ["https://www.linkedin.com/in/bpmuller/", "https://www.instagram.com/aue.produ"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Florianópolis",
        addressRegion: "SC",
        addressCountry: "BR",
      },
      knowsAbout: [
        "Direção de brand film",
        "Motion design",
        "Edição de vídeo",
        "Produção audiovisual",
        "Direção de fotografia",
        "Storytelling de marca",
      ],
    },
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": PERSON_ID },
    },
  ],
};

// Script tags are raw-text elements — the browser does not HTML-decode
// entities inside them, so React's default text-child escaping (which
// turns `<` into `&lt;`) would corrupt the JSON rather than protect it.
// dangerouslySetInnerHTML is the correct tool here; the manual `<` escape
// below is the actual sanitization, guarding against a `</script>`
// breakout if any field ever contains that character.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
