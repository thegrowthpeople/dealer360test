import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getChartData } from "@/data/mockData";

export const DashboardCharts = () => {
  const chartData = getChartData();

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-6">Weekly Activity Overview</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="week" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
            />
            <Legend />
            <Bar dataKey="meetings" fill="hsl(var(--chart-1))" name="Meetings" radius={[8, 8, 0, 0]} />
            <Bar dataKey="orders" fill="hsl(var(--chart-2))" name="Orders (Units)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="forecast" fill="hsl(var(--chart-3))" name="Forecast (Units)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
