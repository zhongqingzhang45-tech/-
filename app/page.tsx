import { ParticleBackground } from "@/components/ParticleBackground";
import { Hero } from "@/components/Hero";
import { ControlCenter } from "@/components/ControlCenter";
import { Departments } from "@/components/Departments";
import { Scenarios } from "@/components/Scenarios";
import { AgentGrid } from "@/components/AgentGrid";
import { Workflow } from "@/components/Workflow";
import { BusinessModules } from "@/components/BusinessModules";
import { Pricing } from "@/components/Pricing";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { PageProviders } from "@/components/PageProviders";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <PageProviders />

      <Hero />
      <ControlCenter />
      <Departments />
      <Scenarios />
      <AgentGrid />
      <Workflow />
      <BusinessModules />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
