import { Scorecard } from "@/types/scorecard";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ConfidenceIndicatorProps {
  scorecard: Scorecard;
}

export const ConfidenceIndicator = ({ scorecard }: ConfidenceIndicatorProps) => {
  // Calculate positives and negatives
  let positives = 0;
  let negatives = 0;
  
  ["funds", "authority", "interest", "need", "timing"].forEach((key) => {
    const component = scorecard[key as keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">];
    positives += component.questions.filter(q => q.state === "positive").length;
    negatives += component.questions.filter(q => q.state === "negative").length;
  });

  // Calculate confidence percentage (positives out of 40)
  const confidencePercentage = (positives / 40) * 100;

  // Determine confidence level and color
  const getConfidenceLevel = () => {
    if (confidencePercentage >= 75) return { 
      label: "Excellent", 
      color: "text-green-600", 
      bgColor: "bg-green-500",
      lightBg: "bg-green-50", 
      borderColor: "border-green-200" 
    };
    if (confidencePercentage >= 50) return { 
      label: "Good", 
      color: "text-emerald-600", 
      bgColor: "bg-emerald-500",
      lightBg: "bg-emerald-50", 
      borderColor: "border-emerald-200" 
    };
    if (confidencePercentage >= 30) return { 
      label: "Fair", 
      color: "text-amber-600", 
      bgColor: "bg-amber-500",
      lightBg: "bg-amber-50", 
      borderColor: "border-amber-200" 
    };
    return { 
      label: "Low", 
      color: "text-red-600", 
      bgColor: "bg-red-500",
      lightBg: "bg-red-50", 
      borderColor: "border-red-200" 
    };
  };

  const confidence = getConfidenceLevel();

  return (
    <Card className={`${confidence.lightBg} border-2 ${confidence.borderColor} p-6 min-w-[320px]`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Confidence
          </div>
          {negatives > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-bold text-red-600">
                {negatives} red flag{negatives !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Big Percentage */}
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold ${confidence.color} leading-none`}>
            {Math.round(confidencePercentage)}%
          </span>
          <span className={`text-lg font-semibold ${confidence.color}`}>
            {confidence.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-8 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className={`h-full ${confidence.bgColor} transition-all duration-500 ease-out flex items-center justify-end pr-3`}
            style={{ width: `${confidencePercentage}%` }}
          >
            {confidencePercentage > 15 && (
              <span className="text-xs font-bold text-white">
                {Math.round(confidencePercentage)}%
              </span>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-bold text-foreground">{positives}</span>
            <span className="text-muted-foreground">positive</span>
          </div>
          {negatives > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="font-bold text-foreground">{negatives}</span>
              <span className="text-muted-foreground">negative</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
