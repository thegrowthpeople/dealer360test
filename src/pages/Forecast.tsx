import { useMemo } from "react";
import { PerformanceFilters } from "@/components/PerformanceFilters";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { Separator } from "@/components/ui/separator";

const Forecast = () => {
  const {
    selectedBDMId,
    selectedGroup,
    selectedDealerId,
    bdms,
    dealerships,
  } = usePerformanceFilters();

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

  return (
    <div className="min-h-screen space-y-6">
      <div>
        <div className="flex-1">
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">Dealer Forecast</h1>
          <p className="text-muted-foreground mb-4">
            {filterLabel || "All Dealerships"}
          </p>
        </div>
        <PerformanceFilters />
      </div>

      <Separator className="my-6" />
    </div>
  );
};

export default Forecast;
