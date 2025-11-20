import { Scorecard } from "@/types/scorecard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ConfidenceTrendChartProps {
  scorecards: Scorecard[];
}

export const ConfidenceTrendChart = ({ scorecards }: ConfidenceTrendChartProps) => {
  // Calculate confidence percentage for a scorecard
  const calculateConfidencePercentage = (sc: Scorecard) => {
    let positives = 0;
    ["funds", "authority", "interest", "need", "timing"].forEach((key) => {
      const component = sc[key as keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">];
      positives += component.questions.filter(q => q.state === "positive").length;
    });
    return Math.round((positives / 40) * 100);
  };

  // Group scorecards by opportunity
  const opportunityGroups = scorecards.reduce((acc, sc) => {
    const key = `${sc.opportunityName}_${sc.customerName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(sc);
    return acc;
  }, {} as Record<string, Scorecard[]>);

  // Prepare data for chart - only include opportunities with multiple versions
  const chartData: Array<{
    date: string;
    [key: string]: string | number;
  }> = [];

  const opportunitiesWithTrends = Object.entries(opportunityGroups)
    .filter(([_, versions]) => versions.length > 1)
    .map(([key, versions]) => ({
      key,
      name: versions[0].opportunityName,
      versions: versions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }));

  // Build timeline data
  opportunitiesWithTrends.forEach(({ key, versions }) => {
    versions.forEach((sc) => {
      const dateStr = new Date(sc.createdAt).toLocaleDateString();
      let dataPoint = chartData.find(d => d.date === dateStr);
      
      if (!dataPoint) {
        dataPoint = { date: dateStr };
        chartData.push(dataPoint);
      }
      
      dataPoint[key] = calculateConfidencePercentage(sc);
    });
  });

  // Sort by date
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Generate colors for each opportunity
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  if (opportunitiesWithTrends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Confidence Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No trend data available. Create multiple versions of scorecards to see confidence trends over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Confidence Trends
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Track confidence evolution across {opportunitiesWithTrends.length} {opportunitiesWithTrends.length === 1 ? 'opportunity' : 'opportunities'} over time
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={[0, 100]}
              label={{ value: 'Confidence %', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))'
              }}
              formatter={(value: number) => [`${value}%`, '']}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const opp = opportunitiesWithTrends.find(o => o.key === value);
                return opp ? opp.name : value;
              }}
            />
            {opportunitiesWithTrends.map((opp, index) => (
              <Line
                key={opp.key}
                type="monotone"
                dataKey={opp.key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
