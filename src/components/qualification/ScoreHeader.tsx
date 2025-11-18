import { Scorecard } from "@/types/scorecard";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ScoreHeaderProps {
  scorecard: Scorecard;
}

const calculatePositiveScore = (component: { questions: { state: string }[] }) => {
  return component.questions.filter((q) => q.state === "positive").length;
};

const calculateNegativeScore = (component: { questions: { state: string }[] }) => {
  return component.questions.filter((q) => q.state === "negative").length;
};

const getTotalScoreColor = (score: number): string => {
  if (score < 15) return "text-red-600";
  if (score >= 15 && score <= 30) return "text-orange-500";
  return "text-green-600";
};

const getFaintScoreColor = (score: number): string => {
  if (score <= 3) return "text-red-600";
  if (score >= 4 && score <= 5) return "text-orange-500";
  return "text-green-600";
};

const getFaintBoxClasses = (score: number): string => {
  if (score <= 3) return "bg-red-500/10 border-red-500/30";
  if (score >= 4 && score <= 5) return "bg-orange-500/10 border-orange-500/30";
  return "bg-green-500/10 border-green-500/30";
};

const getTotalCircleColor = (score: number): string => {
  if (score < 15) return "text-red-600";
  if (score >= 15 && score <= 30) return "text-orange-500";
  return "text-green-600";
};

const getTotalCircleBackgroundColor = (score: number): string => {
  if (score < 15) return "text-red-600/20";
  if (score >= 15 && score <= 30) return "text-orange-500/20";
  return "text-green-600/20";
};

const getTooltipText = (score: number): string => {
  if (score <= 3) return "Red: 0-3 points - Needs attention";
  if (score >= 4 && score <= 5) return "Orange: 4-5 points - Moderate";
  return "Green: 6-8 points - Strong";
};

export const ScoreHeader = ({ scorecard }: ScoreHeaderProps) => {
  const fundsPositive = calculatePositiveScore(scorecard.funds);
  const authorityPositive = calculatePositiveScore(scorecard.authority);
  const interestPositive = calculatePositiveScore(scorecard.interest);
  const needPositive = calculatePositiveScore(scorecard.need);
  const timingPositive = calculatePositiveScore(scorecard.timing);
  const totalPositive = fundsPositive + authorityPositive + interestPositive + needPositive + timingPositive;

  const fundsNegative = calculateNegativeScore(scorecard.funds);
  const authorityNegative = calculateNegativeScore(scorecard.authority);
  const interestNegative = calculateNegativeScore(scorecard.interest);
  const needNegative = calculateNegativeScore(scorecard.need);
  const timingNegative = calculateNegativeScore(scorecard.timing);
  const totalNegative = fundsNegative + authorityNegative + interestNegative + needNegative + timingNegative;

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 75) return "text-success";
    if (percentage >= 50) return "text-warning";
    return "text-destructive";
  };

  const percentage = (totalPositive / 40) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Positives - Green Flags */}
      <div className="bg-gradient-to-br from-success/5 to-success/10 rounded-xl border-2 border-success/30 p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative inline-flex items-center justify-center flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className={getTotalCircleBackgroundColor(totalPositive)}
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                className={`${getTotalCircleColor(totalPositive)} transition-all duration-500`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold ${getTotalScoreColor(totalPositive)}`}>
                {totalPositive}
              </div>
              <div className="text-xs text-muted-foreground">out of 40</div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-success mb-1">Positives</h3>
            <p className="text-sm text-success/80 font-medium">Green Flags</p>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-lg p-3 text-center border ${getFaintBoxClasses(fundsPositive)} cursor-help`}>
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Funds</div>
                <div className={`text-2xl font-bold ${getFaintScoreColor(fundsPositive)}`}>
                  {fundsPositive}
                </div>
                {fundsNegative > 0 && (
                  <div className="text-xs text-destructive mt-1">
                    ({fundsNegative})
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipText(fundsPositive)}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-lg p-3 text-center border ${getFaintBoxClasses(authorityPositive)} cursor-help`}>
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Authority</div>
                <div className={`text-2xl font-bold ${getFaintScoreColor(authorityPositive)}`}>
                  {authorityPositive}
                </div>
                {authorityNegative > 0 && (
                  <div className="text-xs text-destructive mt-1">
                    ({authorityNegative})
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipText(authorityPositive)}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-lg p-3 text-center border ${getFaintBoxClasses(interestPositive)} cursor-help`}>
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Interest</div>
                <div className={`text-2xl font-bold ${getFaintScoreColor(interestPositive)}`}>
                  {interestPositive}
                </div>
                {interestNegative > 0 && (
                  <div className="text-xs text-destructive mt-1">
                    ({interestNegative})
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipText(interestPositive)}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-lg p-3 text-center border ${getFaintBoxClasses(needPositive)} cursor-help`}>
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Need</div>
                <div className={`text-2xl font-bold ${getFaintScoreColor(needPositive)}`}>
                  {needPositive}
                </div>
                {needNegative > 0 && (
                  <div className="text-xs text-destructive mt-1">
                    ({needNegative})
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipText(needPositive)}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-lg p-3 text-center border ${getFaintBoxClasses(timingPositive)} cursor-help`}>
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Timing</div>
                <div className={`text-2xl font-bold ${getFaintScoreColor(timingPositive)}`}>
                  {timingPositive}
                </div>
                {timingNegative > 0 && (
                  <div className="text-xs text-destructive mt-1">
                    ({timingNegative})
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipText(timingPositive)}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Negatives - Red Flags */}
      <div className="bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-xl border-2 border-destructive/30 p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative inline-flex items-center justify-center flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-destructive/20"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (totalNegative / 40))}`}
                className="text-destructive transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-destructive">
                {totalNegative}
              </div>
              <div className="text-xs text-muted-foreground">out of 40</div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-destructive mb-1">Negatives</h3>
            <p className="text-sm text-destructive/80 font-medium">Red Flags</p>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-card/50 rounded-lg p-3 text-center border border-destructive/20">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Funds</div>
            <div className="text-2xl font-bold text-destructive">
              {fundsNegative}
            </div>
          </div>
          
          <div className="bg-card/50 rounded-lg p-3 text-center border border-destructive/20">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Authority</div>
            <div className="text-2xl font-bold text-destructive">
              {authorityNegative}
            </div>
          </div>
          
          <div className="bg-card/50 rounded-lg p-3 text-center border border-destructive/20">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Interest</div>
            <div className="text-2xl font-bold text-destructive">
              {interestNegative}
            </div>
          </div>
          
          <div className="bg-card/50 rounded-lg p-3 text-center border border-destructive/20">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Need</div>
            <div className="text-2xl font-bold text-destructive">
              {needNegative}
            </div>
          </div>
          
          <div className="bg-card/50 rounded-lg p-3 text-center border border-destructive/20">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Timing</div>
            <div className="text-2xl font-bold text-destructive">
              {timingNegative}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
