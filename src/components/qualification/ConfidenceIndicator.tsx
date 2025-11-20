import { Scorecard } from "@/types/scorecard";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

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

  // Calculate confidence score (positives minus half the impact of negatives)
  const rawScore = positives - (negatives * 0.5);
  const confidenceScore = Math.max(0, rawScore);
  const confidencePercentage = (confidenceScore / 40) * 100;

  // Determine confidence level and color
  const getConfidenceLevel = () => {
    if (confidencePercentage >= 75) return { label: "High", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
    if (confidencePercentage >= 50) return { label: "Good", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" };
    if (confidencePercentage >= 30) return { label: "Fair", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" };
    return { label: "Low", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
  };

  const confidence = getConfidenceLevel();

  // Calculate gauge angle (180 degrees = semicircle)
  const gaugeAngle = (confidencePercentage / 100) * 180;

  return (
    <Card className={`${confidence.bgColor} border-2 ${confidence.borderColor} p-4 min-w-[280px]`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Confidence Score
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${confidence.color}`}>
              {positives}
            </span>
            <span className="text-lg text-muted-foreground font-medium">/40</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-sm font-semibold ${confidence.color}`}>
              {confidence.label} Confidence
            </span>
            {negatives > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {negatives} red flags
              </span>
            )}
          </div>
        </div>

        {/* Semicircular Gauge */}
        <div className="relative w-24 h-12">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d={`M 10 45 A 40 40 0 ${gaugeAngle > 90 ? 1 : 0} 1 ${
                10 + 80 * Math.cos((Math.PI * (180 - gaugeAngle)) / 180)
              } ${45 - 40 * Math.sin((Math.PI * (180 - gaugeAngle)) / 180)}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className={confidence.color}
              strokeLinecap="round"
            />
            {/* Indicator dot */}
            <circle
              cx={10 + 80 * Math.cos((Math.PI * (180 - gaugeAngle)) / 180)}
              cy={45 - 40 * Math.sin((Math.PI * (180 - gaugeAngle)) / 180)}
              r="4"
              className={confidence.color}
              fill="currentColor"
            />
          </svg>
          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs font-bold ${confidence.color}`}>
            {Math.round(confidencePercentage)}%
          </div>
        </div>
      </div>

      {/* Breakdown indicators */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          <span className="font-medium">{positives}</span>
          <span className="text-muted-foreground">positive</span>
        </div>
        {negatives > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            <span className="font-medium">{negatives}</span>
            <span className="text-muted-foreground">negative</span>
          </div>
        )}
      </div>
    </Card>
  );
};
