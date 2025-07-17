import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { isUnauthorizedError } from "../lib/authUtils";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import Analytics from "../components/Analytics";

export default function Stats() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      
      <main className="w-full max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Your Analytics</h2>
          <p className="text-muted-foreground">Insights into your bunking patterns</p>
        </div>

        <Analytics />
      </main>
      
      <BottomNavigation currentPage="stats" />
    </div>
  );
}
