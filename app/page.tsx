import { ParticleBackground } from "@/components/ParticleBackground";
import { Hero } from "@/components/Hero";
import { ControlCenter } from "@/components/ControlCenter";
import { Departments } from "@/components/Departments";
import { Scenarios } from "@/components/Scenarios";
import { AgentGrid } from "@/components/AgentGrid";
import { PersonaLab } from "@/components/PersonaLab";
import { Workflow } from "@/components/Workflow";
import { BusinessModules } from "@/components/BusinessModules";
import { Pricing } from "@/components/Pricing";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticleBackground />

      <Hero />
      <ControlCenter />
      <Departments />
      <Scenarios />
      <AgentGrid />
      <PersonaLab />
      <Workflow />
      <BusinessModules />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
