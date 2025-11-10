import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { getMonthlyChartData } from "@/data/mockData";
import { Users, Package, TrendingUp } from "lucide-react";

export const DashboardCharts = () => {
  const monthlyData = getMonthlyChartData();
  const currentMonthData = monthlyData.october; // Start with October

  // Calculate totals for the month
  const totalMeetings = currentMonthData.reduce((sum, week) => sum + week.meetings, 0);
  const totalOrders = currentMonthData.reduce((sum, week) => sum + week.orders, 0);
  const totalForecast = currentMonthData.reduce((sum, week) => sum + week.forecast, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
      {/* Meetings Chart */}
      <Card className="p-6 shadow-soft animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-chart-1" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Customer Meetings</h3>
            <p className="text-sm text-muted-foreground">October 2025</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-chart-1">{totalMeetings}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={currentMonthData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="week" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
            />
            <Bar 
              dataKey="meetings" 
              fill="hsl(var(--chart-1))" 
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-in-out"
            >
              <LabelList 
                dataKey="meetings" 
                position="top" 
                style={{ fill: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Orders Chart */}
      <Card className="p-6 shadow-soft animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-chart-2" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Orders Taken</h3>
            <p className="text-sm text-muted-foreground">October 2025</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-chart-2">{totalOrders}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={currentMonthData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="week" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
            />
            <Bar 
              dataKey="orders" 
              fill="hsl(var(--chart-2))" 
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-in-out"
            >
              <LabelList 
                dataKey="orders" 
                position="top" 
                style={{ fill: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Forecast Chart */}
      <Card className="p-6 shadow-soft animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-chart-3" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Delivery Forecast</h3>
            <p className="text-sm text-muted-foreground">October 2025</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-chart-3">{totalForecast}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={currentMonthData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="week" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
            />
            <Bar 
              dataKey="forecast" 
              fill="hsl(var(--chart-3))" 
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-in-out"
            >
              <LabelList 
                dataKey="forecast" 
                position="top" 
                style={{ fill: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
