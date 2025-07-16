import { useEffect, useState } from "react";
import { Moon, Sun, CloudSun, User, Sparkles, CalendarCheck2, CalendarX2, CalendarDays } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import BunkDecisionForm from "@/components/BunkDecisionForm";
import BunkResult from "@/components/BunkResult";
import FriendVoting from "@/components/FriendVoting";
import BadgeSystem from "@/components/BadgeSystem";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

const FUN_FACTS = [
  "Did you know? Students who track their attendance are 30% less likely to fall below 75%!",
  "Fun Fact: The word 'bunk' comes from 'bunkum', meaning nonsense!",
  "Motivation: Every class you attend is a step closer to your goals.",
  "Tip: Planning your bunks helps you stay safe and stress-free!",
  "Did you know? Consistent attendance can boost your grades by up to 15%!",
  "Fun Fact: The best weather for a nap is a rainy day—use the planner wisely!"
];

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentDecision, setCurrentDecision] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [factIdx] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported by your browser.");
      setWeatherLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch weather");
            return res.json();
          })
          .then((data) => {
            setWeather(data);
            setWeatherLoading(false);
          })
          .catch((err) => {
            setWeatherError("Could not fetch weather for your location.");
            setWeatherLoading(false);
          });
      },
      (geoError) => {
        setWeatherError("Location permission denied. Showing default weather.");
        fetch(`/api/weather`)
          .then((res) => res.json())
          .then((data) => {
            setWeather(data);
            setWeatherLoading(false);
          });
      }
    );
  }, []);

  if (isLoading || !isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen text-lg">Loading...</div>;
  }

  // Hero greeting
  type UserType = { firstName?: string; name?: string; email?: string; profileImageUrl?: string };
  const typedUser = (user || {}) as UserType;
  const displayName = typedUser.firstName || typedUser.name || (typedUser.email ? typedUser.email.split("@")[0] : undefined) || "Student";
  const avatarUrl = typedUser.profileImageUrl;

  // Quick actions
  const handleMarkAttended = () => {
    // Optionally, call backend to mark attended
    window.location.href = "/attended-history";
  };
  const handleMarkBunked = () => {
    // Optionally, call backend to mark bunked
    window.location.href = "/history";
  };
  const handleViewPlanner = () => {
    setLocation("/planner");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-foreground pb-20">
      <Header />
      <main className="w-full max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <Card className="border-none shadow-xl mb-2 bg-gradient-to-r from-white/90 to-blue-50/80 dark:from-gray-900/80 dark:to-gray-800/80">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border-4 border-primary shadow" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary shadow">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-2xl font-bold mb-1">Welcome, {displayName}!</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="text-yellow-400 w-4 h-4" /> {FUN_FACTS[factIdx]}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-2">
          <button
            onClick={handleMarkAttended}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-3 rounded-xl shadow transition-all text-lg"
          >
            <CalendarCheck2 className="w-6 h-6" /> Mark Attended
          </button>
          <button
            onClick={handleMarkBunked}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 rounded-xl shadow transition-all text-lg"
          >
            <CalendarX2 className="w-6 h-6" /> Mark Bunked
          </button>
          <button
            onClick={handleViewPlanner}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow transition-all text-lg"
          >
            <CalendarDays className="w-6 h-6" /> View Planner
          </button>
        </div>

        {/* Main Form and Results */}
        <BunkDecisionForm onDecisionMade={setCurrentDecision} weather={weather} weatherLoading={weatherLoading} weatherError={weatherError} />
        {currentDecision && (
          <>
            <BunkResult decision={currentDecision} />
            <FriendVoting decisionId={currentDecision.id} />
          </>
        )}
        <BadgeSystem />
      </main>
      <BottomNavigation currentPage="home" />
    </div>
  );
}
