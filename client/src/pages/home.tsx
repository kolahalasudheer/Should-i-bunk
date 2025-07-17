import { useEffect, useState } from "react";
import { Moon, Sun, CloudSun, User, Sparkles, CalendarCheck2, CalendarX2, CalendarDays } from "lucide-react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import BunkDecisionForm from "../components/BunkDecisionForm";
import BunkResult from "../components/BunkResult";
import FriendVoting from "../components/FriendVoting";
import BadgeSystem from "../components/BadgeSystem";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "../components/ui/card";

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
        <Card className="border-none shadow-2xl mb-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md animate-fade-in-down">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
            <div className="flex-shrink-0 relative">
              {avatarUrl ? (
                <span className="inline-block w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary via-fuchsia-500 to-purple-600 animate-gradient-x">
                  <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-lg" />
                </span>
              ) : (
                <span className="inline-block w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary via-fuchsia-500 to-purple-600 animate-gradient-x">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-gray-900 shadow-lg">
                    <User className="w-10 h-10" />
                  </div>
                </span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-2xl font-extrabold mb-1 animate-fade-in-down tracking-tight">
                Welcome, {displayName}!
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2 animate-fade-in-up">
                <Sparkles className="text-yellow-400 w-4 h-4" /> {FUN_FACTS[factIdx]}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-2 animate-fade-in-up">
          <button
            onClick={handleMarkAttended}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 hover:from-green-500 hover:to-emerald-600 active:from-green-600 active:to-emerald-700 text-white font-semibold py-3 rounded-2xl shadow-lg transition-all text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <CalendarCheck2 className="w-6 h-6" /> Mark Attended
          </button>
          <button
            onClick={handleMarkBunked}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 via-red-500 to-pink-500 hover:from-red-500 hover:to-pink-600 active:from-red-600 active:to-pink-700 text-white font-semibold py-3 rounded-2xl shadow-lg transition-all text-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <CalendarX2 className="w-6 h-6" /> Mark Bunked
          </button>
          <button
            onClick={handleViewPlanner}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 hover:from-blue-500 hover:to-purple-600 active:from-blue-600 active:to-purple-700 text-white font-semibold py-3 rounded-2xl shadow-lg transition-all text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <CalendarDays className="w-6 h-6" /> View Planner
          </button>
        </div>

        {/* Main Form and Results */}
        <div className="animate-fade-in-up">
          <BunkDecisionForm onDecisionMade={setCurrentDecision} weather={weather} weatherLoading={weatherLoading} weatherError={weatherError} />
          {currentDecision && (
            <div className="space-y-4 mt-4">
              <BunkResult decision={currentDecision} />
              <FriendVoting decisionId={currentDecision.id} />
            </div>
          )}
          <div className="mt-4">
            <BadgeSystem />
          </div>
        </div>
      </main>
      <BottomNavigation currentPage="home" />
    </div>
  );
}
