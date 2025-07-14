import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, XCircle, Quote, Lightbulb, Calendar, Flame } from "lucide-react";

interface BunkResultProps {
  decision: {
    id: number;
    bunkScore: number;
    decision: string;
    aiExcuse: string;
    aiAnalysis: string;
    weather?: {
      condition: string;
      temperature: number;
      location: string;
    };
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

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className={`w-full h-full bg-gradient-to-r ${config.bgColor} to-${config.color.replace('text-', '')}-400 rounded-full flex items-center justify-center`}>
              <Icon className="text-white text-2xl" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className={`text-sm font-bold ${config.color}`}>
                {decision.bunkScore}
              </span>
            </div>
          </div>
          <h3 className={`text-2xl font-bold ${config.color} mb-2`}>
            {config.title}
          </h3>
          <p className="text-gray-600">Your bunk score is {decision.bunkScore}/100</p>
        </div>

        <div className="space-y-4">
          {decision.aiExcuse && (
            <div className={`${config.bgColor}/5 rounded-xl p-4`}>
              <h4 className="font-semibold text-gray-900 mb-2">
                <Quote className={`${config.color} mr-2 inline`} />
                AI Generated Excuse
              </h4>
              <p className="text-gray-700 italic">
                "{decision.aiExcuse}"
              </p>
            </div>
          )}

          {decision.aiAnalysis && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                <Lightbulb className="text-blue-600 mr-2 inline" />
                Smart Analysis
              </h4>
              <p className="text-gray-700">
                {decision.aiAnalysis}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Calendar className="text-gray-600 text-xl mb-2 mx-auto" />
              <p className="text-sm text-gray-600">Decision ID</p>
              <p className="text-2xl font-bold text-gray-900">#{decision.id}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Flame className="text-orange-500 text-xl mb-2 mx-auto" />
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-2xl font-bold text-gray-900">{decision.bunkScore}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
