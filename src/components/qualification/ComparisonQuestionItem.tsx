import { QuestionData } from "@/types/scorecard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Minus, HelpCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonQuestionItemProps {
  question: string;
  oldData: QuestionData;
  newData: QuestionData;
  index: number;
}

export const ComparisonQuestionItem = ({ question, oldData, newData, index }: ComparisonQuestionItemProps) => {
  const stateChanged = oldData.state !== newData.state;
  const noteChanged = oldData.note !== newData.note;
  const hasChanges = stateChanged || noteChanged;

  const getStateIcon = (state: string) => {
    switch (state) {
      case "positive":
        return <Plus className="w-4 h-4 text-success" />;
      case "negative":
        return <Minus className="w-4 h-4 text-destructive" />;
      case "unknown":
        return <HelpCircle className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStateBadge = (state: string) => {
    const variants = {
      positive: "bg-success/10 border-success/30 text-success",
      negative: "bg-destructive/10 border-destructive/30 text-destructive",
      unknown: "bg-warning/10 border-warning/30 text-warning",
      blank: "bg-muted/50 border-border text-muted-foreground",
    };

    const labels = {
      positive: "Positive",
      negative: "Negative",
      unknown: "Unknown",
      blank: "Blank",
    };

    return (
      <Badge variant="outline" className={cn("text-xs font-medium", variants[state as keyof typeof variants])}>
        {labels[state as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "p-4 transition-all",
      hasChanges && "border-2 border-primary/30 bg-primary/5"
    )}>
      <div className="space-y-3">
        {/* Question text */}
        <div className="flex items-start gap-2">
          <span className="text-xs font-semibold text-muted-foreground mt-1 w-6">{index + 1}.</span>
          <p className="text-sm font-medium text-foreground flex-1">{question}</p>
        </div>

        {/* State comparison */}
        <div className="flex items-center gap-3 pl-8">
          <div className="flex items-center gap-2">
            {getStateIcon(oldData.state)}
            {getStateBadge(oldData.state)}
          </div>
          
          {stateChanged && (
            <>
              <ArrowRight className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                {getStateIcon(newData.state)}
                {getStateBadge(newData.state)}
              </div>
            </>
          )}
          
          {!stateChanged && (
            <span className="text-xs text-muted-foreground">(unchanged)</span>
          )}
        </div>

        {/* Note comparison */}
        {(oldData.note || newData.note) && (
          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span className="font-semibold">Notes:</span>
            </div>
            
            {noteChanged ? (
              <div className="space-y-2">
                {oldData.note && (
                  <div className="text-xs p-2 rounded bg-destructive/5 border border-destructive/20">
                    <span className="font-semibold text-destructive">Old: </span>
                    <span className="text-muted-foreground line-through">{oldData.note}</span>
                  </div>
                )}
                {newData.note && (
                  <div className="text-xs p-2 rounded bg-success/5 border border-success/20">
                    <span className="font-semibold text-success">New: </span>
                    <span className="text-foreground">{newData.note}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs p-2 rounded bg-muted/30 border border-border text-muted-foreground">
                {oldData.note}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
