const LINKS = [
  { href: "mailto:contato@aue.productions", label: "Email", value: "contato@aue.productions", external: false },
  { href: "https://instagram.com/aue.produ", label: "Instagram", value: "@aue.produ", external: true },
  { href: "https://linkedin.com/in/bpmuller", label: "LinkedIn", value: "bpmuller", external: true },
];

export default function Contact() {
  return (
    <section id="contact">
      <div className="reveal">
        <div className="contact-hl">
          Vamos
          <br />
          trabalhar
          <br />
          <em>juntos.</em>
        </div>
      </div>
      <div>
        <div className="contact-links">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener" : undefined}
              className={"clink reveal reveal-d" + (i + 1)}
            >
              <span className="clink-lbl">{l.label}</span>
              <span className="clink-val">{l.value}</span>
              <span className="clink-arrow">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
