import NavDark from "@/components/NavDark";
import Hero from "@/components/Hero";
import WorkIntro from "@/components/WorkIntro";
import About from "@/components/About";
import Services from "@/components/Services";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <NavDark />
      <Hero />
      <WorkIntro />
      <About />
      <Services />
      <Contact />
      <Footer />
    </>
  );
}
