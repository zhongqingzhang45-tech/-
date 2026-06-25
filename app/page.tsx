import { ParticleBackground } from "@/components/ParticleBackground";
import { HeroDigitalLife } from "@/components/HeroDigitalLife";
import { SoulVisualizer } from "@/components/SoulVisualizer";
import { VoiceSection } from "@/components/VoiceSection";
import { GamingSection } from "@/components/GamingSection";
import { TechStackSection } from "@/components/TechStackSection";
import { PlatformSection } from "@/components/PlatformSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <HeroDigitalLife />
      <SoulVisualizer />
      <VoiceSection />
      <GamingSection />
      <TechStackSection />
      <PlatformSection />
      <Footer />
    </main>
  );
}
