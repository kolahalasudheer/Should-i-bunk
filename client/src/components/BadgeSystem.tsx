import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, CloudRain, Users, TrendingUp } from "lucide-react";

export default function BadgeSystem() {
  const { data: badges, isLoading } = useQuery({
    queryKey: ["/api/user-badges"],
    retry: false,
  });

  const badgeConfigs = {
    serial_bunker: {
      name: "Serial Bunker",
      description: "Bunked 5 classes in a row",
      icon: Crown,
      gradient: "from-yellow-400 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50",
      borderColor: "border-yellow-200",
    },
    weather_warrior: {
      name: "Weather Warrior",
      description: "Bunked 10 times due to weather",
      icon: CloudRain,
      gradient: "from-blue-400 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
    },
    social_butterfly: {
      name: "Social Butterfly",
      description: "Get 50 friend votes",
      icon: Users,
      gradient: "from-pink-400 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50",
      borderColor: "border-pink-200",
    },
    data_nerd: {
      name: "Data Nerd",
      description: "Use app for 30 days",
      icon: TrendingUp,
      gradient: "from-purple-400 to-indigo-500",
      bgGradient: "from-purple-50 to-indigo-50",
      borderColor: "border-purple-200",
    },
  };

  const earnedBadgeTypes = badges?.map((badge: any) => badge.badgeType) || [];

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Achievement Badges</h3>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(badgeConfigs).map(([badgeType, config]) => {
              const isEarned = earnedBadgeTypes.includes(badgeType);
              const Icon = config.icon;

              return (
                <div
                  key={badgeType}
                  className={`flex flex-col items-center p-4 rounded-xl ${
                    isEarned
                      ? `bg-gradient-to-r ${config.bgGradient} border ${config.borderColor}`
                      : 'bg-gray-50 border-2 border-dashed border-gray-200'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      isEarned
                        ? `bg-gradient-to-r ${config.gradient}`
                        : 'bg-gray-300'
                    }`}
                  >
                    <Icon
                      className={`text-xl ${
                        isEarned ? 'text-white' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <h4
                    className={`font-semibold text-center ${
                      isEarned ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {config.name}
                  </h4>
                  <p
                    className={`text-xs text-center mt-1 ${
                      isEarned ? 'text-gray-600' : 'text-gray-500'
                    }`}
                  >
                    {config.description}
                  </p>
                  <div className="mt-2">
                    {isEarned ? (
                      <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                        Earned!
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-600 text-xs">
                        {badgeType === 'social_butterfly' ? '0/50' : 
                         badgeType === 'data_nerd' ? '0/30' : 
                         'Locked'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
