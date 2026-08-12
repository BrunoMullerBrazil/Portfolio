import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="reveal">
      <div className="footer-copy">© 2025 Bruno Müller</div>
      <div className="footer-logo">
        <Logo style={{ height: 20, opacity: 0.65 }} />
      </div>
    </footer>
  );
}
