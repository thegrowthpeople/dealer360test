import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { BarChart3, LineChart } from "lucide-react";
import { SummaryCards } from "@/components/performance/SummaryCards";
import { SalesChart } from "@/components/performance/SalesChart";
import { BDMInfo } from "@/components/performance/BDMInfo";
import { PerformanceFilters } from "@/components/PerformanceFilters";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";

interface Actual {
  "Dealer ID": number;
  Month: string;
  Year: number | null;
  Brand: string | null;
  Retail: number | null;
  Fleet: number | null;
}

const Performance = () => {
  const { toast } = useToast();
  const {
    selectedBDMId,
    selectedGroup,
    selectedDealerId,
    selectedYear,
    dealerships,
    bdms,
  } = usePerformanceFilters();
  
  const [actuals, setActuals] = useState<Actual[]>([]);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [viewMode, setViewMode] = useState<"months" | "quarters" | "both">("months");
  const [isLoading, setIsLoading] = useState(true);

  const MONTH_ORDER = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const QUARTERS = {
    Q1: ["Jan", "Feb", "Mar"],
    Q2: ["Apr", "May", "Jun"],
    Q3: ["Jul", "Aug", "Sep"],
    Q4: ["Oct", "Nov", "Dec"]
  };

  const STATE_ORDER = ["VIC", "NSW", "QLD", "SA", "WA", "TAS", "NT"];

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (dealerships.length > 0) {
      fetchActuals();
    }
  }, [selectedBDMId, selectedGroup, selectedDealerId, selectedYear, dealerships]);

  const fetchActuals = async () => {
    try {
      let query = supabase.from("Actuals").select("*");

      if (selectedYear) {
        query = query.eq("Year", selectedYear);
      }

      if (selectedDealerId !== null) {
        query = query.eq("Dealer ID", selectedDealerId);
      } else if (selectedGroup !== null) {
        const dealerIdsInGroup = dealerships
          .filter((d) => d["Dealer Group"] === selectedGroup)
          .map((d) => d["Dealer ID"]);
        if (dealerIdsInGroup.length > 0) {
          query = query.in("Dealer ID", dealerIdsInGroup);
        } else {
          // If no dealers in group, return empty
          setActuals([]);
          return;
        }
      } else if (selectedBDMId !== null) {
        // Check if selected BDM is a manager
        const selectedBdm = bdms.find((b) => b["BDM ID"] === selectedBDMId);
        const isManager = selectedBdm?.IsManager === 1;
        
        // If not a manager, filter by BDM's dealerships
        if (!isManager) {
          const dealerIdsForBDM = dealerships
            .filter((d) => d["BDM ID"] === selectedBDMId)
            .map((d) => d["Dealer ID"]);
          if (dealerIdsForBDM.length > 0) {
            query = query.in("Dealer ID", dealerIdsForBDM);
          } else {
            // If no dealers for BDM, return empty
            setActuals([]);
            return;
          }
        }
        // If is a manager, don't filter by BDM (show all)
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log("Fetched actuals:", data?.length, "records");
      setActuals(data || []);
    } catch (error) {
      console.error("Error fetching actuals:", error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    }
  };


  const selectedBDM = useMemo(() => {
    return bdms.find((b) => b["BDM ID"] === selectedBDMId) || null;
  }, [bdms, selectedBDMId]);

  const prepareChartData = (brand: "FTL" | "MBT", type: "Retail" | "Fleet") => {
    const brandActuals = actuals.filter((a) => a.Brand === brand);
    
    console.log(`Preparing ${brand} ${type} data:`, brandActuals.length, "records");
    
    // Get current month index to filter out future months
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11
    const currentYear = currentDate.getFullYear();

    if (viewMode === "quarters") {
      return Object.entries(QUARTERS).map(([quarter, months]) => {
        const total = brandActuals
          .filter((a) => months.includes(a.Month))
          .reduce((sum, a) => sum + (Number(a[type]) || 0), 0);
        return { name: quarter, value: total, isQuarter: true };
      });
    }

    // Keep all months for X-axis labels, but hide current and future months with no data
    const monthlyData = MONTH_ORDER.map((month, index) => {
      const monthData = brandActuals.filter((a) => a.Month === month);
      const total = monthData.reduce((sum, a) => sum + (Number(a[type]) || 0), 0);
      
      // Hide current month and future months if we're viewing current year AND there's no data
      const isCurrentOrFutureMonth = selectedYear === currentYear && index >= currentMonthIndex;
      const shouldHide = isCurrentOrFutureMonth && total === 0;
      
      return { 
        name: month, 
        value: shouldHide ? undefined : total, 
        isQuarter: false 
      };
    });

    console.log(`Monthly data for ${brand} ${type}:`, monthlyData);

    if (viewMode === "both") {
      // Interleave quarters after their respective months
      const result: Array<{ name: string; value: number | undefined; isQuarter: boolean }> = [];
      
      MONTH_ORDER.forEach((month, index) => {
        const monthData = brandActuals.filter((a) => a.Month === month);
        const total = monthData.reduce((sum, a) => sum + (Number(a[type]) || 0), 0);
        
        const isCurrentOrFutureMonth = selectedYear === currentYear && index >= currentMonthIndex;
        const shouldHide = isCurrentOrFutureMonth && total === 0;
        
        result.push({ 
          name: month, 
          value: shouldHide ? undefined : total, 
          isQuarter: false 
        });
        
        // Add quarter after the 3rd, 6th, 9th, and 12th month
        if ((index + 1) % 3 === 0) {
          const quarterIndex = Math.floor(index / 3);
          const quarterKey = `Q${quarterIndex + 1}` as keyof typeof QUARTERS;
          const quarterMonths = QUARTERS[quarterKey];
          const quarterTotal = brandActuals
            .filter((a) => quarterMonths.includes(a.Month))
            .reduce((sum, a) => sum + (Number(a[type]) || 0), 0);
          
          result.push({ 
            name: quarterKey, 
            value: quarterTotal, 
            isQuarter: true 
          });
        }
      });
      
      return result;
    }

    return monthlyData;
  };

  const prepareCombinedChartData = (brand: "FTL" | "MBT") => {
    const brandActuals = actuals.filter((a) => a.Brand === brand);
    
    // Get current month index to filter out future months
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11
    const currentYear = currentDate.getFullYear();

    if (viewMode === "quarters") {
      return Object.entries(QUARTERS).map(([quarter, months]) => {
        const total = brandActuals
          .filter((a) => months.includes(a.Month))
          .reduce((sum, a) => sum + (Number(a.Retail) || 0) + (Number(a.Fleet) || 0), 0);
        return { name: quarter, value: total, isQuarter: true };
      });
    }

    // Keep all months for X-axis labels, but hide current and future months with no data
    const monthlyData = MONTH_ORDER.map((month, index) => {
      const monthData = brandActuals.filter((a) => a.Month === month);
      const total = monthData.reduce((sum, a) => sum + (Number(a.Retail) || 0) + (Number(a.Fleet) || 0), 0);
      
      // Hide current month and future months if we're viewing current year AND there's no data
      const isCurrentOrFutureMonth = selectedYear === currentYear && index >= currentMonthIndex;
      const shouldHide = isCurrentOrFutureMonth && total === 0;
      
      return { 
        name: month, 
        value: shouldHide ? undefined : total, 
        isQuarter: false 
      };
    });

    if (viewMode === "both") {
      // Interleave quarters after their respective months
      const result: Array<{ name: string; value: number | undefined; isQuarter: boolean }> = [];
      
      MONTH_ORDER.forEach((month, index) => {
        const monthData = brandActuals.filter((a) => a.Month === month);
        const total = monthData.reduce((sum, a) => sum + (Number(a.Retail) || 0) + (Number(a.Fleet) || 0), 0);
        
        const isCurrentOrFutureMonth = selectedYear === currentYear && index >= currentMonthIndex;
        const shouldHide = isCurrentOrFutureMonth && total === 0;
        
        result.push({ 
          name: month, 
          value: shouldHide ? undefined : total, 
          isQuarter: false 
        });
        
        // Add quarter after the 3rd, 6th, 9th, and 12th month
        if ((index + 1) % 3 === 0) {
          const quarterIndex = Math.floor(index / 3);
          const quarterKey = `Q${quarterIndex + 1}` as keyof typeof QUARTERS;
          const quarterMonths = QUARTERS[quarterKey];
          const quarterTotal = brandActuals
            .filter((a) => quarterMonths.includes(a.Month))
            .reduce((sum, a) => sum + (Number(a.Retail) || 0) + (Number(a.Fleet) || 0), 0);
          
          result.push({ 
            name: quarterKey, 
            value: quarterTotal, 
            isQuarter: true 
          });
        }
      });
      
      return result;
    }

    return monthlyData;
  };

  const summaryData = useMemo(() => {
    const totalRetail = actuals.reduce((sum, a) => sum + (Number(a.Retail) || 0), 0);
    const totalFleet = actuals.reduce((sum, a) => sum + (Number(a.Fleet) || 0), 0);
    const totalFTL = actuals
      .filter((a) => a.Brand === "FTL")
      .reduce((sum, a) => sum + (Number(a.Retail) || 0) + (Number(a.Fleet) || 0), 0);
    const totalMBT = actuals
      .filter((a) => a.Brand === "MBT")
      .reduce((sum, a) => sum + (Number(a.Retail) || 0) + (Number(a.Fleet) || 0), 0);

    return { totalRetail, totalFleet, totalFTL, totalMBT };
  }, [actuals]);

  const chartTotals = useMemo(() => {
    const ftlRetail = actuals
      .filter((a) => a.Brand === "FTL")
      .reduce((sum, a) => sum + (Number(a.Retail) || 0), 0);
    const ftlFleet = actuals
      .filter((a) => a.Brand === "FTL")
      .reduce((sum, a) => sum + (Number(a.Fleet) || 0), 0);
    const mbtRetail = actuals
      .filter((a) => a.Brand === "MBT")
      .reduce((sum, a) => sum + (Number(a.Retail) || 0), 0);
    const mbtFleet = actuals
      .filter((a) => a.Brand === "MBT")
      .reduce((sum, a) => sum + (Number(a.Fleet) || 0), 0);

    return { ftlRetail, ftlFleet, mbtRetail, mbtFleet };
  }, [actuals]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      <div>
        <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">Dealer Performance</h1>
        <p className="text-muted-foreground mb-4">
          {filterLabel || "All Dealerships"}
        </p>
        <PerformanceFilters />
      </div>

      <Separator className="my-6" />

        {!selectedBDMId && <BDMInfo bdm={selectedBDM} />}

        <SummaryCards {...summaryData} />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <ToggleGroup type="single" value={chartType} onValueChange={(v) => v && setChartType(v as any)}>
          <ToggleGroupItem value="bar" aria-label="Bar chart">
            <BarChart3 className="w-4 h-4 mr-2" />
            Bar
          </ToggleGroupItem>
          <ToggleGroupItem value="line" aria-label="Line chart">
            <LineChart className="w-4 h-4 mr-2" />
            Line
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
          <ToggleGroupItem value="months">Months</ToggleGroupItem>
          <ToggleGroupItem value="quarters">Quarters</ToggleGroupItem>
          <ToggleGroupItem value="both">Both</ToggleGroupItem>
        </ToggleGroup>
        </div>

        <div className="space-y-6">
          <SalesChart
            title="Mercedes-Benz"
            data={prepareCombinedChartData("MBT")}
            color="#0EA5E9"
            chartType={chartType}
            viewMode={viewMode}
            total={chartTotals.mbtRetail + chartTotals.mbtFleet}
          />
          <SalesChart
            title="Freightliner"
            data={prepareCombinedChartData("FTL")}
            color="#9b87f5"
            chartType={chartType}
            viewMode={viewMode}
            total={chartTotals.ftlRetail + chartTotals.ftlFleet}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          <SalesChart
            title="Mercedes-Benz Retail"
            data={prepareChartData("MBT", "Retail")}
            color="#0EA5E9"
            chartType={chartType}
            viewMode={viewMode}
            total={chartTotals.mbtRetail}
          />
          <SalesChart
            title="Mercedes-Benz Fleet"
            data={prepareChartData("MBT", "Fleet")}
            color="#0EA5E9"
            chartType={chartType}
            viewMode={viewMode}
            total={chartTotals.mbtFleet}
          />
          <SalesChart
            title="Freightliner Retail"
            data={prepareChartData("FTL", "Retail")}
            color="#9b87f5"
            chartType={chartType}
            viewMode={viewMode}
            total={chartTotals.ftlRetail}
          />
          <SalesChart
            title="Freightliner Fleet"
            data={prepareChartData("FTL", "Fleet")}
            color="#9b87f5"
            chartType={chartType}
            viewMode={viewMode}
            total={chartTotals.ftlFleet}
          />
        </div>
    </div>
  );
};

export default Performance;
