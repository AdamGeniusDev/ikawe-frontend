import Navbar    from "@/components/Navbar";
import HeroGlobe from "@/components/HeroGlobe";
import Features  from "@/components/Features";
import DataTypes from "@/components/DataTypes";
import Benefits  from "@/components/Benefits";
import CTA       from "@/components/CTA";
import Footer    from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen dark:bg-black">
      <Navbar />
      <HeroGlobe />
      <Features />
      <DataTypes />
      <Benefits />
      <CTA />
      <Footer />
    </div>
  );
}