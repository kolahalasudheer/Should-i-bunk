import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, XCircle, Quote, Lightbulb, Calendar, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type TimetableEntry = { day: string; periods: number; enabled: boolean };
interface BunkResultProps {
  decision: {
    id?: number;
    bunkScore?: number;
    decision?: string;
    aiExcuse?: string;
    aiAnalysis?: string;
    weather?: {
      condition: string;
      temperature: number;
      location: string;
    };
    attendancePercentage: number;
    mood: string;
    daysUntilExam: number;
    professorStrictness: string;
    timetable?: TimetableEntry[];
    attendedSoFar?: number; // Added for accurate attendance calculation
    daysSoFar?: number; // Added for accurate attendance calculation
  };
}

export default function BunkResult({ decision }: BunkResultProps) {
  const getDecisionConfig = () => {
    switch (decision.decision) {
      case 'bunk':
        return {
          title: "Yes, Bunk It!",
          icon: CheckCircle,
          color: "text-secondary",
          bgColor: "bg-secondary",
          borderColor: "border-secondary",
        };
      case 'risky':
        return {
          title: "Risky, Your Call",
          icon: AlertCircle,
          color: "text-warning",
          bgColor: "bg-warning",
          borderColor: "border-warning",
        };
      case 'attend':
        return {
          title: "Don't Bunk Today",
          icon: XCircle,
          color: "text-danger",
          bgColor: "bg-danger",
          borderColor: "border-danger",
        };
      default:
        return {
          title: "Decision Made",
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-600",
          borderColor: "border-gray-600",
        };
    }
  };

  const config = getDecisionConfig();
  const Icon = config.icon;
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [excuse, setExcuse] = useState(decision.aiExcuse);
  const [excuseLoading, setExcuseLoading] = useState(false);

  // Ensure excuse updates if decision.aiExcuse changes (e.g., on navigation)
  useEffect(() => {
    setExcuse(decision.aiExcuse);
  }, [decision.aiExcuse]);

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    retry: false,
  });
  const { data: votes } = useQuery({
    queryKey: ["/api/friend-votes", decision.id],
    retry: false,
  });
  const analyticsData: any = analytics && typeof analytics === 'object' ? analytics : {};
  const votesList = Array.isArray(votes) ? votes : [];
  const totalBunks = analyticsData.totalBunks ?? 0;
  // Serial Bunker badge: 5 consecutive bunks
  const bunksToSerial = Math.max(0, 5 - totalBunks % 5);
  const friendsBunking = votesList.filter((v: any) => v.vote === "bunk").length;
  // Projected attendance after bunking
  const projectedAttendance = Math.max(0, decision.attendancePercentage - 1); // Example logic
  // Weather Bunk Index (simple: 8/10 if weather is 'rain', else 5/10)
  let weatherIndex = 5;
  if (decision.weather?.condition?.toLowerCase().includes("rain")) weatherIndex = 8;
  if (decision.weather?.condition?.toLowerCase().includes("storm")) weatherIndex = 9;
  if (decision.weather?.condition?.toLowerCase().includes("sunny")) weatherIndex = 3;

  // --- Attendance Advice Logic ---
  const minAttendance = 0.75;
  const currentAttendance = decision.attendancePercentage / 100;
  const daysLeft = decision.daysUntilExam;
  const timetable = decision.timetable || [
    { day: "Mon", periods: 5, enabled: true },
    { day: "Tue", periods: 5, enabled: true },
    { day: "Wed", periods: 5, enabled: true },
    { day: "Thu", periods: 5, enabled: true },
    { day: "Fri", periods: 5, enabled: true },
    { day: "Sat", periods: 0, enabled: false },
    { day: "Sun", periods: 0, enabled: false },
  ];
  // Helper: get weekday index (0=Sun, 1=Mon, ...)
  function getWeekdayIndex(day: string) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
  }
  // Calculate total classes left until exam
  function getClassesLeft(daysLeft: number, timetable: TimetableEntry[]) {
    const today = new Date();
    let total = 0;
    for (let i = 0; i < daysLeft; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const weekday = d.getDay(); // 0=Sun, 1=Mon, ...
      const entry = timetable[weekday];
      if (entry && entry.enabled) {
        total += entry.periods;
      }
    }
    return total;
  }
  // Calculate total hours/classes conducted so far using timetable and daysSoFar (like the planner)
  // Use a default if daysSoFar is missing or 0
  const daysSoFar = decision.daysSoFar && decision.daysSoFar > 0 ? decision.daysSoFar : 100; // Default to 100 if not provided
  let showDaysWarning = !decision.daysSoFar || decision.daysSoFar === 0;
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let totalConductedSoFar = 0;
  const today = new Date();
  for (let i = 0; i < daysSoFar; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const weekday = d.getDay();
    if (weekDays[weekday] === "Sun") continue;
    if (weekDays[weekday] === "Sat") {
      const satEntry = timetable[6];
      if (!satEntry.enabled || satEntry.periods === 0) continue;
    }
    const entry = timetable[weekday];
    if (entry && entry.enabled && entry.periods > 0) {
      totalConductedSoFar += entry.periods;
    }
  }
  const attendedSoFar = decision.attendedSoFar ?? Math.round((decision.attendancePercentage / 100) * totalConductedSoFar);
  const accurateAttendance = totalConductedSoFar > 0 ? (attendedSoFar / totalConductedSoFar) * 100 : 0;

  // Calculate remainingBunks and mustAttend using updated values
  const totalClasses = totalConductedSoFar + getClassesLeft(daysLeft, timetable);
  const maxAllowedAbsences = Math.floor(totalClasses * (1 - minAttendance));
  const currentAbsences = totalConductedSoFar - attendedSoFar;
  const remainingBunks = Math.max(0, maxAllowedAbsences - currentAbsences);
  const mustAttend = Math.max(0, totalClasses - (currentAbsences + remainingBunks));

  // Calculate how many more classes needed to reach 75% if below threshold
  let classesToSeventyFive = 0;
  if (accurateAttendance < minAttendance * 100) {
    const a = attendedSoFar;
    const t = totalConductedSoFar;
    classesToSeventyFive = Math.ceil((0.75 * t - a) / 0.25);
  }

  // Handler for 'I will go to class'
  const handleGoToClass = async () => {
    setLoading(true);
    try {
      await fetch("/api/class-attended", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendancePercentage: decision.attendancePercentage,
          mood: decision.mood,
          daysUntilExam: decision.daysUntilExam,
          professorStrictness: decision.professorStrictness,
        }),
      });
      // Invalidate queries so history and analytics update
      await queryClient.invalidateQueries({ queryKey: ["/api/attended-history"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setLoading(false);
      navigate("/attended-history");
    } catch (err) {
      setLoading(false);
      alert("Failed to log attended class. Please try again.");
    }
  };

  // Handler for 'I will bunk today'
  const handleBunkToday = async () => {
    setLoading(true);
    try {
      // Invalidate queries so history and analytics update
      await queryClient.invalidateQueries({ queryKey: ["/api/bunk-history"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setLoading(false);
      navigate("/history");
    } catch (err) {
      setLoading(false);
      alert("Failed to update history. Please try again.");
    }
  };

  // Handler for 'Ask my friends'
  const handleAskFriends = () => {
    const shareData = {
      title: 'Should I Bunk?',
      text: `Help me decide: Should I bunk today's class? Vote here!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert("Share link copied to clipboard!");
    }
  };

  // Handler for 'Set a reminder'
  const handleSetReminder = () => {
    alert("Reminder set for your next class! (Demo)");
  };

  // Regenerate Excuse Handler
  const handleRegenerateExcuse = async () => {
    setExcuseLoading(true);
    try {
      const response = await apiRequest("POST", "/api/bunk-decision", {
        attendancePercentage: decision.attendancePercentage,
        mood: decision.mood,
        daysUntilExam: decision.daysUntilExam,
        professorStrictness: decision.professorStrictness,
      });
      const data = await response.json();
      setExcuse(data.aiExcuse);
    } catch (err) {
      setExcuse("Failed to generate a new excuse. Please try again.");
    }
    setExcuseLoading(false);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-4 sm:p-6">
        {/* Decision Summary Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
            <span className={`inline-block ${config.color}`}>{config.title}</span>
            <span className="inline-block bg-white dark:bg-background border rounded-full px-3 py-1 text-lg font-bold shadow-sm ml-2">{decision.bunkScore}</span>
          </h2>
          {/* Bunk Meter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Bunk Meter</label>
            <div className="w-full h-6 rounded-full bg-muted flex items-center relative overflow-hidden">
              <div
                className={`h-6 rounded-full transition-all duration-500 ${
                  (decision.bunkScore ?? 0) >= 70
                    ? 'bg-green-500'
                    : (decision.bunkScore ?? 0) >= 40
                    ? 'bg-yellow-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${decision.bunkScore ?? 0}%` }}
              ></div>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow">
                {decision.bunkScore ?? 0}/100
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 bg-gradient-to-r ${config.bgColor} to-${config.color.replace('text-', '')}-400 rounded-full flex items-center justify-center mb-2`}>
              <Icon className="text-white text-2xl" />
            </div>
            <div className="text-gray-600 text-center">
              <b>Projected Attendance:</b> <span className="text-lg font-semibold">{projectedAttendance}%</span>
            </div>
            <div className="text-gray-600 text-center">
              Your bunk score is <b>{decision.bunkScore}/100</b>. {decision.decision === 'bunk' ? "It’s safe to bunk today," : decision.decision === 'risky' ? "It’s risky to bunk today," : "You should attend today,"}
            </div>
          </div>
        </div>
        <hr className="my-4 border-muted-foreground/30" />
        {/* Attendance Advice Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><Lightbulb className="inline text-blue-500" /> Attendance Advice</h3>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-blue-900 dark:text-blue-200">
            <div className="mb-2 text-sm">
              {showDaysWarning && (
                <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
                  ⚠️ Number of class days so far not provided. Using default of 100 days. For best accuracy, enter your real value in the planner.
                </div>
              )}
              <b>You've attended {attendedSoFar} out of {totalConductedSoFar} classes/hours so far.</b><br />
              Your current attendance is <b>{accurateAttendance.toFixed(2)}%</b>.<br />
              {accurateAttendance < minAttendance * 100 && classesToSeventyFive > 0 && (
                <span className="text-red-600 font-semibold">You need to attend at least {classesToSeventyFive} more classes in a row to reach 75% attendance.</span>
              )}
            </div>
            {(() => {
              if (remainingBunks <= 0) {
                return (
                  <>
                    <b>Your attendance is close to the minimum.</b> To stay safe, attend all remaining classes until your exam.<br />
                    <span className="text-xs text-muted-foreground">(Estimates assume 180 days of classes so far. Adjust in settings for more accuracy.)</span>
                  </>
                );
              } else if (currentAttendance < minAttendance + 0.03) {
                // If attendance is just above minimum, recommend attending a few days, then bunking
                const safeAttendDays = Math.ceil(mustAttend / timetable.reduce((a, b) => a + (b.enabled ? b.periods : 0), 0));
                return (
                  <>
                    <b>Plan:</b> Attend the next <b>{safeAttendDays}</b> days to boost your attendance.<br />
                    After that, you can safely bunk up to <b>{remainingBunks}</b> classes before your exam for revision or rest.<br />
                    <span className="text-xs text-muted-foreground">(Estimates assume 180 days of classes so far. Adjust in settings for more accuracy.)</span>
                  </>
                );
              } else {
                // Attendance is comfortably above minimum
                return (
                  <>
                    <b>Good job!</b> With <b>{decision.attendancePercentage}%</b> attendance and <b>{decision.daysUntilExam}</b> days left, you can safely bunk <b>{remainingBunks}</b> more classes and still meet the 75% minimum.<br />
                    If you want to maximize your exam prep, you can attend now and bunk the last <b>{Math.min(remainingBunks, getClassesLeft(daysLeft, timetable))}</b> classes before your exam for revision.<br />
                    <span className="text-xs text-muted-foreground">(Estimates assume 180 days of classes so far. Adjust in settings for more accuracy.)</span>
                  </>
                );
              }
            })()}
          </div>
        </div>
        <hr className="my-4 border-muted-foreground/30" />
        {/* Timetable Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2"><Calendar className="inline text-purple-500" /> Your Timetable</h3>
          <table className="w-full text-xs bg-muted/30 rounded-lg overflow-hidden">
            <thead>
              <tr>
                {timetable.filter(e => e.enabled).map(e => (
                  <th key={e.day} className="px-2 py-1 font-semibold text-muted-foreground">{e.day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {timetable.filter(e => e.enabled).map(e => (
                  <td key={e.day} className="px-2 py-1 text-center">{e.periods}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <hr className="my-4 border-muted-foreground/30" />
        {/* AI Excuse Section */}
        {excuse && (
          <div className="mb-6">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2"><Quote className="inline text-green-500" /> AI Generated Excuse</h3>
            <blockquote className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-green-900 dark:text-green-200 italic border-l-4 border-green-400">
              “{excuse}”
            </blockquote>
            <Button
              variant="outline"
              className="mt-2"
              onClick={handleRegenerateExcuse}
              disabled={excuseLoading}
            >
              {excuseLoading ? "Regenerating..." : "Regenerate Excuse"}
            </Button>
          </div>
        )}
        {/* Smart Analysis Section */}
        {decision.aiAnalysis && (
          <div className="mb-6">
            <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2 flex items-center gap-2"><Lightbulb className="inline text-yellow-500" /> Smart Analysis</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 text-yellow-900 dark:text-yellow-200">
              {decision.aiAnalysis}
            </div>
          </div>
        )}
        <hr className="my-4 border-muted-foreground/30" />
        {/* Extra Info Section */}
        <div className="mt-6 sm:mt-8 space-y-2 text-sm text-gray-700 dark:text-gray-200">
          <div>
            <Badge className="bg-yellow-100 text-yellow-800 mr-2">Serial Bunker</Badge>
            You’re <b>{bunksToSerial}</b> bunks away from the ‘Serial Bunker’ badge!
          </div>
          <div>
            <Badge className="bg-blue-100 text-blue-800 mr-2">Friends</Badge>
            <b>{friendsBunking}</b> of your friends are also planning to bunk today.
          </div>
          <div>
            <Badge className="bg-purple-100 text-purple-800 mr-2">Weather</Badge>
            Weather Bunk Index: <b>{weatherIndex}/10</b> (Perfect weather for a nap!)
          </div>
        </div>
        <hr className="my-4 border-muted-foreground/30" />
        {/* Action Buttons Section */}
        <div className="flex flex-col md:flex-row gap-4 mt-6 sm:mt-8">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            onClick={handleGoToClass}
            disabled={loading}
          >
            I will go to class
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleBunkToday}
          >
            I will bunk today
          </button>
          <Button
            variant="outline"
            className="w-full md:w-auto flex items-center justify-center"
            onClick={handleAskFriends}
          >
            <Share2 className="mr-2" /> Ask my friends
          </Button>
          <Button
            variant="outline"
            className="w-full md:w-auto flex items-center justify-center"
            onClick={handleSetReminder}
          >
            <Bell className="mr-2" /> Set a reminder for next class
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
