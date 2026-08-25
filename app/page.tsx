import NavDark from "@/components/NavDark";
import Hero from "@/components/Hero";
import WorkIntro from "@/components/WorkIntro";
// import FormatLinks from "@/components/FormatLinks"; // paused — see the <FormatLinks /> note below
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
      {/* <FormatLinks /> — Design entry tile taken off the live homepage for
          now, back to just this note. The component and /design page are
          untouched; uncomment the import above and this line to bring it
          back once there's real content to send people to. */}
      <About />
      <Services />
      <Contact />
      <Footer />
    </>
  );
}
