import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import ConfessionWall from "../components/ConfessionWall";

export default function ConfessionsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      <main className="w-full max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Confession Wall</h2>
        <ConfessionWall />
      </main>
      <BottomNavigation currentPage="confessions" />
    </div>
  );
} 