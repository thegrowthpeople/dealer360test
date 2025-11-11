import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText } from "lucide-react";
import { PerformanceFilters } from "@/components/PerformanceFilters";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { Separator } from "@/components/ui/separator";

const Forecast = () => {
  const navigate = useNavigate();
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
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">Dealer Forecast</h1>
            <p className="text-muted-foreground mb-4">
              {filterLabel || "All Dealerships"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/new-report")} variant="default" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              New Report
            </Button>
            <Button onClick={() => navigate("/reports")} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Previous Reports
            </Button>
          </div>
        </div>
        <PerformanceFilters />
      </div>

      <Separator className="my-6" />
      
      <div className="space-y-8">
        <DashboardStats />
        <DashboardCharts />
      </div>
    </div>
  );
};

export default Forecast;
