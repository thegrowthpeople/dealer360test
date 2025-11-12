import { useMemo, useState } from "react";
import { PerformanceFilters } from "@/components/PerformanceFilters";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { ForecastTiles } from "@/components/forecast/ForecastTiles";
import { NewForecastDialog } from "@/components/forecast/NewForecastDialog";

const Forecast = () => {
  const {
    selectedBDMId,
    selectedGroup,
    selectedDealerId,
    selectedWeekStarting,
    selectedYear,
    selectedMonth,
    bdms,
    dealerships,
  } = usePerformanceFilters();

  const [refreshKey, setRefreshKey] = useState(0);

  const filterLabel = useMemo(() => {
    if (selectedDealerId !== null) {
      const dealer = dealerships.find((d) => d["Dealer ID"] === selectedDealerId);
      if (dealer) {
        return `${dealer["Dealer Group"]} - ${dealer.Dealership}`;
      }
    }
    if (selectedGroup !== null) {
      return selectedGroup;
    }
    if (selectedBDMId !== null) {
      const bdm = bdms.find((b) => b["BDM ID"] === selectedBDMId);
      if (bdm) {
        return bdm["Full Name"];
      }
    }
    return null;
  }, [selectedBDMId, selectedGroup, selectedDealerId, bdms, dealerships]);

  const handleForecastCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen space-y-6">
      <div>
        <div className="mb-4">
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">Dealer Forecast</h1>
          <p className="text-muted-foreground mb-4">
            {filterLabel || "All Dealerships"}
          </p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <PerformanceFilters />
          </div>
          <NewForecastDialog
            onSuccess={handleForecastCreated}
          />
        </div>
      </div>

      <ForecastTiles key={refreshKey} />
    </div>
  );
};

export default Forecast;
