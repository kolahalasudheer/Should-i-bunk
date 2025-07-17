import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { isUnauthorizedError } from "../lib/authUtils";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttendedHistory() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: attended, isLoading: attendedLoading } = useQuery({
    queryKey: ["/api/attended-history"],
    enabled: isAuthenticated,
    retry: false,
  });

  const attendedList = Array.isArray(attended) ? attended : [];

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
      <main className="max-w-md mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Attended Class History</h2>
          <p className="text-muted-foreground">Track all your past attended classes</p>
        </div>
        {!attendedList || attendedList.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No attended classes yet</h3>
              <p className="text-gray-600">Mark a class as attended to see it here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {attendedList.map((item: any) => (
              <Card key={item.id} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          Attended Class
                        </h3>
                        <p className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 font-medium">
                      {item.attendancePercentage}%
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span>Mood: <b>{item.mood}</b></span>
                    <span>Days until exam: <b>{item.daysUntilExam}</b></span>
                    <span>Professor: <b>{item.professorStrictness}</b></span>
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