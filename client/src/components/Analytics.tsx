import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, Target, BarChart3 } from "lucide-react";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
    retry: false,
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-6">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Yet</h3>
            <p className="text-gray-600">Make some decisions to see your analytics!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxWeeklyValue = Math.max(...analytics.weeklyPattern);

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Bunk Analytics</h3>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {analytics.totalBunks}
            </div>
            <div className="text-sm text-gray-600">Total Bunks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary mb-1">
              {analytics.attendanceRate}%
            </div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
        </div>

        {/* Most Common Reasons */}
        {analytics.reasonBreakdown && analytics.reasonBreakdown.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Most common reasons</h4>
            <div className="space-y-2">
              {analytics.reasonBreakdown.map((reason: any, index: number) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={reason.reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${color} rounded-full`}></div>
                      <span className="text-sm text-gray-700">{reason.reason}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {reason.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Pattern */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Weekly pattern</h4>
          <div className="flex items-end space-x-1 h-20">
            {analytics.weeklyPattern.map((value: number, index: number) => {
              const height = maxWeeklyValue > 0 ? (value / maxWeeklyValue) * 100 : 0;
              const isHighActivity = value > 0 && value >= maxWeeklyValue * 0.7;
              
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-t transition-all ${
                    isHighActivity ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`${weekDays[index]}: ${value} bunks`}
                ></div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600">This Week</p>
            <p className="text-lg font-bold text-gray-900">
              {analytics.weeklyPattern.reduce((sum: number, val: number) => sum + val, 0)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Target className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Target</p>
            <p className="text-lg font-bold text-gray-900">75%</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Trend</p>
            <p className="text-lg font-bold text-gray-900">
              {analytics.attendanceRate >= 75 ? '↗️' : '↘️'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
