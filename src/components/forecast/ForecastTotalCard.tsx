import { Card } from "@/components/ui/card";

interface ForecastTotalCardProps {
  title: string;
  mbTotal: number;
  ftlTotal: number;
}

export const ForecastTotalCard = ({ title, mbTotal, ftlTotal }: ForecastTotalCardProps) => {
  return (
    <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Left side - Total with colored background */}
        <div className="p-4 bg-primary/10 w-[150px]">
          <p className="text-xl font-bold text-foreground mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground">{mbTotal + ftlTotal}</p>
        </div>
        
        {/* Vertical separator */}
        <div className="hidden md:block w-px bg-border"></div>
        
        {/* Right side - Breakdown with white background */}
        <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
          <div className="flex gap-6">
            <div className="space-y-1 text-center">
              <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
              <span className="text-2xl text-foreground block">{mbTotal}</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
              <span className="text-2xl text-foreground block">{ftlTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
