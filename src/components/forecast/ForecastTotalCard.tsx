interface ForecastTotalCardProps {
  title: string;
  mbTotal: number;
  ftlTotal: number;
}

export const ForecastTotalCard = ({ title, mbTotal, ftlTotal }: ForecastTotalCardProps) => {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground mb-1">Mercedes-Benz</p>
            <p className="text-xl font-bold">{mbTotal}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground mb-1">Freightliner</p>
            <p className="text-xl font-bold">{ftlTotal}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
