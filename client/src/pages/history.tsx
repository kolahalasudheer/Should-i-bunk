import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { isUnauthorizedError } from "../lib/authUtils";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Calendar, Clock, TrendingUp, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function History() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: decisions, isLoading: decisionsLoading } = useQuery({
    queryKey: ["/api/bunk-history"],
    enabled: isAuthenticated,
    retry: false,
  });

  // --- New state for filters and search ---
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // --- Helper: group by date ---
  function groupByDate(list: any[]) {
    return list.reduce((acc, item) => {
      const date = new Date(item.createdAt).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }

  // --- Filter, search, and group decisions ---
  const filteredDecisions = useMemo(() => {
    let list = Array.isArray(decisions) ? decisions : [];
    if (filter !== "all") list = list.filter((d) => d.decision === filter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((d) =>
        d.mood?.toLowerCase().includes(s) ||
        d.weatherCondition?.toLowerCase().includes(s) ||
        d.professorStrictness?.toLowerCase().includes(s) ||
        d.createdAt?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [decisions, filter, search]);
  const grouped = useMemo(() => groupByDate(filteredDecisions), [filteredDecisions]);

  // --- Summary counts ---
  const summary = useMemo(() => {
    const list = Array.isArray(decisions) ? decisions : [];
    const now = new Date();
    return {
      bunk: list.filter(d => d.decision === "bunk" && new Date(d.createdAt).getMonth() === now.getMonth()).length,
      attend: list.filter(d => d.decision === "attend" && new Date(d.createdAt).getMonth() === now.getMonth()).length,
      risky: list.filter(d => d.decision === "risky" && new Date(d.createdAt).getMonth() === now.getMonth()).length,
    };
  }, [decisions]);

  // --- Export to CSV ---
  function exportCSV() {
    const list = Array.isArray(filteredDecisions) ? filteredDecisions : [];
    const header = ["Date", "Decision", "Attendance", "Mood", "Exam in", "Professor", "Weather", "Predicted", "AI Excuse"];
    const rows = list.map(d => [
      new Date(d.createdAt).toLocaleString(),
      d.decision,
      d.attendancePercentage,
      d.mood,
      d.daysUntilExam,
      d.professorStrictness,
      d.weatherCondition,
      d.bunkScore,
      d.aiExcuse
    ]);
    const csv = [header, ...rows].map(r => r.map(x => `"${x ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bunk_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'bunk':
        return <CheckCircle className="w-5 h-5 text-secondary" />;
      case 'risky':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'attend':
        return <XCircle className="w-5 h-5 text-danger" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'bunk':
        return 'bg-secondary/10 text-secondary';
      case 'risky':
        return 'bg-warning/10 text-warning';
      case 'attend':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (decisionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header />
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation currentPage="history" />
      </div>
    );
  }

  const decisionsList = Array.isArray(decisions) ? decisions : [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      
      <main className="w-full max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-6">
        {/* Summary Section */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <span className="block text-2xl font-bold text-green-700">{summary.bunk}</span>
            <span className="text-xs text-green-900">Bunked</span>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <span className="block text-2xl font-bold text-blue-700">{summary.attend}</span>
            <span className="text-xs text-blue-900">Attended</span>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <span className="block text-2xl font-bold text-yellow-700">{summary.risky}</span>
            <span className="text-xs text-yellow-900">Risky</span>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-2">
              <button onClick={() => setFilter("all")}
                className={`px-2 py-1 rounded text-xs font-semibold ${filter === "all" ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}>All</button>
              <button onClick={() => setFilter("bunk")}
                className={`px-2 py-1 rounded text-xs font-semibold ${filter === "bunk" ? "bg-green-600 text-white" : "bg-gray-200 text-green-700"}`}>Bunked</button>
              <button onClick={() => setFilter("attend")}
                className={`px-2 py-1 rounded text-xs font-semibold ${filter === "attend" ? "bg-blue-600 text-white" : "bg-gray-200 text-blue-700"}`}>Attended</button>
              <button onClick={() => setFilter("risky")}
                className={`px-2 py-1 rounded text-xs font-semibold ${filter === "risky" ? "bg-yellow-500 text-white" : "bg-gray-200 text-yellow-700"}`}>Risky</button>
            </div>
            <input
              type="text"
              placeholder="Search mood, weather, date..."
              className="mt-2 px-2 py-1 border border-gray-300 rounded w-full text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={exportCSV} className="mt-2 px-2 py-1 bg-gray-800 text-white rounded text-xs w-full">Export CSV</button>
          </div>
        </div>
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Your Decision History</h2>
          <p className="text-muted-foreground">Track all your past bunking decisions</p>
        </div>

        {!decisionsList || decisionsList.length === 0 ? (
          <Card className="border-none shadow-lg bg-card text-card-foreground">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No decisions yet</h3>
              <p className="text-muted-foreground">Make your first bunking decision to see it here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, items]) => {
              const itemsArr = items as any[];
              return (
                <div key={date}>
                  <div className="text-lg font-semibold text-primary mb-2">{date}</div>
                  <div className="space-y-4">
                    {itemsArr.map((decision: any) => (
                      <Card key={decision.id} className="border-none shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {getDecisionIcon(decision.decision)}
                              <div>
                                <h3 className="font-semibold text-gray-900 capitalize">
                                  {decision.decision === 'bunk' ? 'Bunked It!' : 
                                   decision.decision === 'risky' ? 'Risky Call' : 
                                   'Attended Class'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  {formatDate(decision.createdAt)}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${getDecisionColor(decision.decision)} font-medium`}>
                              {decision.bunkScore}/100
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Attendance:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {decision.attendancePercentage}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Mood:</span>
                                <span className="font-medium text-gray-900 ml-2 capitalize">
                                  {decision.mood}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Exam in:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {decision.daysUntilExam} days
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Professor:</span>
                                <span className="font-medium text-gray-900 ml-2 capitalize">
                                  {decision.professorStrictness}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Predicted:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {decision.predictedAttendance ? `${decision.predictedAttendance}%` : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Trend:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {decision.attendancePercentage >= 75 ? '↗️' : '↘️'}
                                </span>
                              </div>
                            </div>
                            {decision.weatherCondition && (
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                  <strong>Weather:</strong> {decision.weatherCondition}
                                  {decision.weatherTemperature && ` (${decision.weatherTemperature}°C)`}
                                </p>
                              </div>
                            )}
                            {decision.aiExcuse && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700">
                                  <strong>AI Excuse:</strong> "{decision.aiExcuse}"
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      <BottomNavigation currentPage="history" />
    </div>
  );
}
