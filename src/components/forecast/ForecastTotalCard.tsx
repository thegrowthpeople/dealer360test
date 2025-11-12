import { Card } from "@/components/ui/card";

interface ForecastTotalCardProps {
  title: string;
  mbTotal: number;
  ftlTotal: number;
  leftBgColor?: string;
  rightBgColor?: string;
  leftTextColor?: string;
}

export const ForecastTotalCard = ({ title, mbTotal, ftlTotal, leftBgColor = "bg-primary/10", rightBgColor = "bg-white", leftTextColor = "text-foreground" }: ForecastTotalCardProps) => {
  // Split title on newline if present, otherwise split on space for multiline display
  const titleParts = title.includes('\n') ? title.split('\n') : title.split(' ');
  
  return (
    <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Left side - Total with colored background */}
        <div className={`p-4 w-[120px] ${leftBgColor}`}>
          <p className={`text-xl font-bold mb-2 ${leftTextColor}`}>
            {titleParts.map((part, index) => (
              <span key={index}>
                {part}
                {index < titleParts.length - 1 && <br />}
              </span>
            ))}
          </p>
          <p className={`text-3xl font-bold ${leftTextColor}`}>{mbTotal + ftlTotal}</p>
        </div>
        
        {/* Vertical separator */}
        <div className="hidden md:block w-px bg-border"></div>
        
        {/* Right side - Breakdown with white background */}
        <div className={`px-4 py-6 flex items-center justify-center flex-1 ${rightBgColor}`}>
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
