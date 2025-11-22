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
    <Card className="p-0 overflow-hidden border-primary/20 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Left side - Total with colored background */}
        <div className={`p-3 w-[100px] ${leftBgColor}`}>
          <p className={`text-sm font-bold mb-1 ${leftTextColor} leading-tight`}>
            {titleParts.map((part, index) => (
              <span key={index}>
                {part}
                {index < titleParts.length - 1 && <br />}
              </span>
            ))}
          </p>
          <p className={`text-2xl font-bold ${leftTextColor}`}>{mbTotal + ftlTotal}</p>
        </div>
        
        {/* Vertical separator */}
        <div className="hidden md:block w-px bg-border"></div>
        
        {/* Right side - Breakdown with white background */}
        <div className={`px-3 py-4 flex items-center justify-center flex-1 ${rightBgColor}`}>
          <div className="flex gap-4">
            <div className="space-y-0.5 text-center">
              <span className="text-xs text-muted-foreground block uppercase tracking-wider">MB</span>
              <span className="text-xl text-foreground block font-semibold">{mbTotal}</span>
            </div>
            <div className="space-y-0.5 text-center">
              <span className="text-xs text-muted-foreground block uppercase tracking-wider">FTL</span>
              <span className="text-xl text-foreground block font-semibold">{ftlTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
