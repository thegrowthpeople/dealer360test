import { Scorecard } from "@/types/scorecard";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

interface ConfidenceIndicatorProps {
  scorecard: Scorecard;
}

export const ConfidenceIndicator = ({ scorecard }: ConfidenceIndicatorProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Calculate positives and negatives by category
  const calculateCategoryStats = () => {
    const stats = {
      funds: { positive: 0, negative: 0 },
      authority: { positive: 0, negative: 0 },
      interest: { positive: 0, negative: 0 },
      need: { positive: 0, negative: 0 },
      timing: { positive: 0, negative: 0 },
    };

    ["funds", "authority", "interest", "need", "timing"].forEach((key) => {
      const component = scorecard[key as keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">];
      stats[key as keyof typeof stats].positive = component.questions.filter(q => q.state === "positive").length;
      stats[key as keyof typeof stats].negative = component.questions.filter(q => q.state === "negative").length;
    });

    return stats;
  };

  const categoryStats = calculateCategoryStats();

  // Calculate totals
  let positives = 0;
  let negatives = 0;
  
  Object.values(categoryStats).forEach(stat => {
    positives += stat.positive;
    negatives += stat.negative;
  });

  // Calculate confidence percentage (positives out of 40)
  const confidencePercentage = (positives / 40) * 100;

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(confidencePercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidencePercentage]);

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

        {/* Big Percentage with Tooltip */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-baseline gap-2 cursor-help">
                <span className={`text-5xl font-bold ${confidence.color} leading-none`}>
                  {Math.round(confidencePercentage)}%
                </span>
                <span className={`text-lg font-semibold ${confidence.color}`}>
                  {confidence.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="w-64 p-4 z-[100]" sideOffset={10}>
              <div className="space-y-3">
                <div className="font-semibold text-sm border-b pb-2">FAINT Breakdown</div>
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium capitalize">{category}</span>
                      <span className="text-muted-foreground">{stats.positive + stats.negative}/8</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>{stats.positive}</span>
                      </div>
                      {stats.negative > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="w-3 h-3" />
                          <span>{stats.negative}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Progress Bar */}
        <div className="relative h-8 bg-muted rounded-full overflow-hidden border border-border">
          <div 
            className={`h-full ${confidence.bgColor} transition-all duration-1000 ease-out flex items-center justify-end pr-3`}
            style={{ width: `${animatedPercentage}%` }}
          >
            {animatedPercentage > 15 && (
              <span className="text-xs font-bold text-white">
                {Math.round(animatedPercentage)}%
              </span>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex justify-between items-center pt-2 border-t border-border/50">
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
