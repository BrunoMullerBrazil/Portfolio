import { Logo } from "./Logo";

export default function NavDark() {
  return (
    <nav id="nav-dark">
      <div className="nav-dark-logo">
        <Logo />
      </div>
      <div className="nav-dark-links">
        <a href="#work-intro">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contato</a>
      </div>
    </nav>
  );
}
