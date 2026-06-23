import { Hero } from '@/components/home/Hero';
import { LearningOverview } from '@/components/home/LearningOverview';
import { PopularCourses } from '@/components/home/PopularCourses';
import { Features } from '@/components/home/Features';
import { Highlights } from '@/components/home/Highlights';
import { CommunityPreview } from '@/components/home/CommunityPreview';

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <Hero />
      <LearningOverview />
      <PopularCourses />
      <Features />
      <Highlights />
      <CommunityPreview />
    </main>
  );
}
