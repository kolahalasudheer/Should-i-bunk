import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function History() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: decisions, isLoading: decisionsLoading } = useQuery({
    queryKey: ["/api/bunk-history"],
    enabled: isAuthenticated,
    retry: false,
  });

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Decision History</h2>
          <p className="text-gray-600">Track all your past bunking decisions</p>
        </div>

        {!decisions || decisions.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No decisions yet</h3>
              <p className="text-gray-600">Make your first bunking decision to see it here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision: any) => (
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
        )}
      </main>
      
      <BottomNavigation currentPage="history" />
    </div>
  );
}
