import { Scorecard } from "@/types/scorecard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Users, Calendar } from "lucide-react";

interface StatsSummaryProps {
  scorecards: Scorecard[];
}

export const StatsSummary = ({ scorecards }: StatsSummaryProps) => {
  const totalScorecards = scorecards.length;
  const uniqueSalespeople = new Set(scorecards.map(s => s.accountManager)).size;
  const uniqueCustomers = new Set(scorecards.map(s => s.customerName)).size;
  
  const avgScore = scorecards.length > 0 
    ? scorecards.reduce((acc, scorecard) => {
        let positives = 0;
        ["funds", "authority", "interest", "need", "timing"].forEach((key) => {
          const component = scorecard[key as keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">];
          positives += component.questions.filter(q => q.state === "positive").length;
        });
        return acc + positives;
      }, 0) / scorecards.length
    : 0;

  const stats = [
    {
      title: "Total Scorecards",
      value: totalScorecards,
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Average Score",
      value: `${avgScore.toFixed(1)}/40`,
      icon: TrendingUp,
      color: "text-success"
    },
    {
      title: "Salespeople",
      value: uniqueSalespeople,
      icon: Users,
      color: "text-warning"
    },
    {
      title: "Customers",
      value: uniqueCustomers,
      icon: Calendar,
      color: "text-info"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
