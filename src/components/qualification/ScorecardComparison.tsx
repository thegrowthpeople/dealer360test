import { Scorecard, FAINT_QUESTIONS } from "@/types/scorecard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComparisonQuestionItem } from "@/components/qualification/ComparisonQuestionItem";
import { ArrowRight, Calendar, User, Briefcase } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ScorecardComparisonProps {
  oldScorecard: Scorecard;
  newScorecard: Scorecard;
}

export const ScorecardComparison = ({ oldScorecard, newScorecard }: ScorecardComparisonProps) => {
  const components = [
    { key: "funds" as const, title: "Funds", questions: FAINT_QUESTIONS.funds },
    { key: "authority" as const, title: "Authority", questions: FAINT_QUESTIONS.authority },
    { key: "interest" as const, title: "Interest", questions: FAINT_QUESTIONS.interest },
    { key: "need" as const, title: "Need", questions: FAINT_QUESTIONS.need },
    { key: "timing" as const, title: "Timing", questions: FAINT_QUESTIONS.timing },
  ];

  const calculateScore = (scorecard: Scorecard) => {
    let positives = 0;
    let negatives = 0;
    
    components.forEach(({ key }) => {
      scorecard[key].questions.forEach((q) => {
        if (q.state === "positive") positives++;
        if (q.state === "negative") negatives++;
      });
    });
    
    return { positives, negatives };
  };

  const oldScore = calculateScore(oldScorecard);
  const newScore = calculateScore(newScorecard);

  const getChangeSummary = (componentKey: keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">) => {
    let changes = 0;
    oldScorecard[componentKey].questions.forEach((oldQ, index) => {
      const newQ = newScorecard[componentKey].questions[index];
      if (oldQ.state !== newQ.state || oldQ.note !== newQ.note) {
        changes++;
      }
    });
    return changes;
  };

  return (
    <div className="space-y-6">
      {/* Header comparison */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
          {/* Old version */}
          <div className="space-y-3">
            <Badge variant="outline" className="bg-muted">Version {oldScorecard.version}</Badge>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{oldScorecard.opportunityName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{oldScorecard.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(oldScorecard.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-success">{oldScore.positives}</span>
                <span className="text-xs text-muted-foreground">positives</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-destructive">{oldScore.negatives}</span>
                <span className="text-xs text-muted-foreground">negatives</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-primary" />
          </div>

          {/* New version */}
          <div className="space-y-3">
            <Badge variant="outline" className="bg-primary/10 border-primary text-primary">Version {newScorecard.version}</Badge>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{newScorecard.opportunityName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{newScorecard.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(newScorecard.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-success">{newScore.positives}</span>
                <span className="text-xs text-muted-foreground">positives</span>
                {newScore.positives !== oldScore.positives && (
                  <span className={cn(
                    "text-xs font-semibold",
                    newScore.positives > oldScore.positives ? "text-success" : "text-destructive"
                  )}>
                    ({newScore.positives > oldScore.positives ? "+" : ""}{newScore.positives - oldScore.positives})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-destructive">{newScore.negatives}</span>
                <span className="text-xs text-muted-foreground">negatives</span>
                {newScore.negatives !== oldScore.negatives && (
                  <span className={cn(
                    "text-xs font-semibold",
                    newScore.negatives < oldScore.negatives ? "text-success" : "text-destructive"
                  )}>
                    ({newScore.negatives > oldScore.negatives ? "+" : ""}{newScore.negatives - oldScore.negatives})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Component comparisons */}
      {components.map(({ key, title, questions }) => {
        const changes = getChangeSummary(key);
        
        return (
          <Card key={key} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{title[0]}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
              </div>
              {changes > 0 && (
                <Badge variant="outline" className="bg-primary/10 border-primary text-primary">
                  {changes} {changes === 1 ? "change" : "changes"}
                </Badge>
              )}
            </div>
            
            <Separator className="mb-4" />
            
            <div className="grid gap-3">
              {questions.map((question, index) => (
                <ComparisonQuestionItem
                  key={index}
                  question={question}
                  oldData={oldScorecard[key].questions[index]}
                  newData={newScorecard[key].questions[index]}
                  index={index}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
