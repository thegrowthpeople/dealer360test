interface ForecastTotalCardProps {
  title: string;
  mbTotal: number;
  ftlTotal: number;
}

export const ForecastTotalCard = ({ title, mbTotal, ftlTotal }: ForecastTotalCardProps) => {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="space-y-3">
        <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
          <p className="text-sm font-medium text-muted-foreground">Mercedes-Benz Total</p>
          <p className="text-2xl font-bold">{mbTotal}</p>
        </div>
        
        <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
          <p className="text-sm font-medium text-muted-foreground">Freightliner Total</p>
          <p className="text-2xl font-bold">{ftlTotal}</p>
        </div>
      </div>
    </div>
  );
};
