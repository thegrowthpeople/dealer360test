import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Package, Target } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}

const StatsCard = ({ title, value, icon: Icon, trend }: StatsCardProps) => (
  <Card className="p-6 shadow-soft hover:shadow-medium transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-chart-1" />
            {trend}
          </p>
        )}
      </div>
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    </div>
  </Card>
);

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Meetings"
        value="7"
        icon={Users}
        trend="This week"
      />
      <StatsCard
        title="Orders Taken"
        value="14"
        icon={Package}
        trend="Units this week"
      />
      <StatsCard
        title="Committed Delivery"
        value="12"
        icon={Target}
        trend="Units this month"
      />
      <StatsCard
        title="Potential Upside"
        value="6"
        icon={TrendingUp}
        trend="Additional units"
      />
    </div>
  );
};
