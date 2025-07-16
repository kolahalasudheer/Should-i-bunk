import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import PersonalizedPlanner from "@/components/PersonalizedPlanner";

export default function PlannerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      <main className="w-full max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-8">
        <PersonalizedPlanner />
      </main>
      <BottomNavigation currentPage="planner" />
    </div>
  );
} 