import { useState } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import BunkDecisionForm from "@/components/BunkDecisionForm";
import BunkResult from "@/components/BunkResult";
import FriendVoting from "@/components/FriendVoting";
import ConfessionWall from "@/components/ConfessionWall";
import BadgeSystem from "@/components/BadgeSystem";
import Analytics from "@/components/Analytics";

export default function Home() {
  const [currentDecision, setCurrentDecision] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <BunkDecisionForm onDecisionMade={setCurrentDecision} />
        
        {currentDecision && (
          <>
            <BunkResult decision={currentDecision} />
            <FriendVoting decisionId={currentDecision.id} />
          </>
        )}
        
        <ConfessionWall />
        <BadgeSystem />
        <Analytics />
      </main>
      
      <BottomNavigation currentPage="home" />
    </div>
  );
}
