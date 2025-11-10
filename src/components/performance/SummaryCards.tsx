import { Card } from "@/components/ui/card";
import { TrendingUp, Package, Truck, Building } from "lucide-react";

interface SummaryCardsProps {
  totalRetail: number;
  totalFleet: number;
  totalFTL: number;
  totalMBT: number;
}

export const SummaryCards = ({ totalRetail, totalFleet, totalFTL, totalMBT }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Retail</p>
            <p className="text-3xl font-bold text-foreground">{totalRetail}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Fleet</p>
            <p className="text-3xl font-bold text-foreground">{totalFleet}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Freightliner</p>
            <p className="text-3xl font-bold text-foreground">{totalFTL}</p>
          </div>
          <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'rgba(155, 135, 245, 0.1)' }}>
            <Truck className="w-6 h-6 m-3" style={{ color: '#9b87f5' }} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Mercedes-Benz</p>
            <p className="text-3xl font-bold text-foreground">{totalMBT}</p>
          </div>
          <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)' }}>
            <Building className="w-6 h-6 m-3" style={{ color: '#0EA5E9' }} />
          </div>
        </div>
      </Card>
    </div>
  );
};
