import { Scorecard } from "@/types/scorecard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, TrendingUp } from "lucide-react";

interface ScorecardTimelineProps {
  scorecards: Scorecard[];
  opportunityName: string;
}

export const ScorecardTimeline = ({ scorecards, opportunityName }: ScorecardTimelineProps) => {
  const sortedScorecards = [...scorecards].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const calculateScore = (scorecard: Scorecard) => {
    let positives = 0;
    ["funds", "authority", "interest", "need", "timing"].forEach((key) => {
      const component = scorecard[key as keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">];
      positives += component.questions.filter(q => q.state === "positive").length;
    });
    return positives;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Timeline for {opportunityName}</h2>
      </div>

      <div className="space-y-4">
        {sortedScorecards.map((scorecard, index) => (
          <Card key={scorecard.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Version {scorecard.version}</Badge>
                  <CardTitle className="text-lg">{scorecard.customerName}</CardTitle>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {calculateScore(scorecard)}/40
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{scorecard.salesperson}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(scorecard.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
