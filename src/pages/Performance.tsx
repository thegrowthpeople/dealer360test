import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, LineChart } from "lucide-react";
import { SummaryCards } from "@/components/performance/SummaryCards";
import { SalesChart } from "@/components/performance/SalesChart";
import { BDMInfo } from "@/components/performance/BDMInfo";
import { useToast } from "@/hooks/use-toast";

interface Dealership {
  "Dealer ID": number;
  Dealership: string | null;
  "Dealer Group": string | null;
  "BDM ID": number;
  State: string | null;
}

interface BDM {
  "BDM ID": number;
  "Full Name": string | null;
  eMail: string | null;
  "Phone Number": string | null;
}

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
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [bdms, setBDMs] = useState<BDM[]>([]);
  const [actuals, setActuals] = useState<Actual[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  const [selectedBDMId, setSelectedBDMId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [viewMode, setViewMode] = useState<"months" | "quarters" | "both">("months");
  const [isLoading, setIsLoading] = useState(true);

  const MONTH_ORDER = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const QUARTERS = {
    Q1: ["January", "February", "March"],
    Q2: ["April", "May", "June"],
    Q3: ["July", "August", "September"],
    Q4: ["October", "November", "December"]
  };

  const STATE_ORDER = ["VIC", "NSW", "QLD", "SA", "WA", "TAS", "NT"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (dealerships.length > 0) {
      fetchActuals();
    }
  }, [selectedBDMId, selectedGroup, selectedDealerId, selectedYear, dealerships]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      const [dealershipsRes, bdmRes, yearsRes] = await Promise.all([
        supabase.from("Dealerships").select("*").order("Dealership"),
        supabase.from("BDM").select("*").order("Full Name"),
        supabase.from("Actuals").select("Year").not("Year", "is", null),
      ]);

      if (dealershipsRes.data) setDealerships(dealershipsRes.data);
      if (bdmRes.data) setBDMs(bdmRes.data);
      
      if (yearsRes.data) {
        const uniqueYears = [...new Set(yearsRes.data.map((d) => d.Year))].sort((a, b) => b - a);
        setAvailableYears(uniqueYears);
        if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        }
      } else if (selectedBDMId !== null) {
        const dealerIdsForBDM = dealerships
          .filter((d) => d["BDM ID"] === selectedBDMId)
          .map((d) => d["Dealer ID"]);
        if (dealerIdsForBDM.length > 0) {
          query = query.in("Dealer ID", dealerIdsForBDM);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
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

  const filteredDealerGroups = useMemo(() => {
    let groups = dealerships;
    
    if (selectedBDMId !== null) {
      groups = groups.filter((d) => d["BDM ID"] === selectedBDMId);
    }

    const uniqueGroups = [...new Set(groups.map((d) => d["Dealer Group"]).filter(Boolean))];
    
    // Sort by state order
    return uniqueGroups.sort((a, b) => {
      const stateA = dealerships.find(d => d["Dealer Group"] === a)?.State || "";
      const stateB = dealerships.find(d => d["Dealer Group"] === b)?.State || "";
      const indexA = STATE_ORDER.indexOf(stateA);
      const indexB = STATE_ORDER.indexOf(stateB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [dealerships, selectedBDMId]);

  const filteredDealerships = useMemo(() => {
    let filtered = dealerships;

    if (selectedBDMId !== null) {
      filtered = filtered.filter((d) => d["BDM ID"] === selectedBDMId);
    }

    if (selectedGroup !== null) {
      filtered = filtered.filter((d) => d["Dealer Group"] === selectedGroup);
    }

    return filtered;
  }, [dealerships, selectedBDMId, selectedGroup]);

  const selectedBDM = useMemo(() => {
    return bdms.find((b) => b["BDM ID"] === selectedBDMId) || null;
  }, [bdms, selectedBDMId]);

  const prepareChartData = (brand: "FTL" | "MBT", type: "Retail" | "Fleet") => {
    const brandActuals = actuals.filter((a) => a.Brand === brand);

    if (viewMode === "quarters") {
      return Object.entries(QUARTERS).map(([quarter, months]) => {
        const total = brandActuals
          .filter((a) => months.includes(a.Month))
          .reduce((sum, a) => sum + (a[type] || 0), 0);
        return { name: quarter, value: total, isQuarter: true };
      });
    }

    if (viewMode === "both") {
      const monthlyData = MONTH_ORDER.map((month) => {
        const total = brandActuals
          .filter((a) => a.Month === month)
          .reduce((sum, a) => sum + (a[type] || 0), 0);
        return { name: month, value: total, isQuarter: false };
      });

      const quarterlyData = Object.entries(QUARTERS).map(([quarter, months]) => {
        const total = brandActuals
          .filter((a) => months.includes(a.Month))
          .reduce((sum, a) => sum + (a[type] || 0), 0);
        return { name: quarter, value: total, isQuarter: true };
      });

      return [...monthlyData, ...quarterlyData];
    }

    return MONTH_ORDER.map((month) => {
      const total = brandActuals
        .filter((a) => a.Month === month)
        .reduce((sum, a) => sum + (a[type] || 0), 0);
      return { name: month, value: total, isQuarter: false };
    });
  };

  const summaryData = useMemo(() => {
    const totalRetail = actuals.reduce((sum, a) => sum + (a.Retail || 0), 0);
    const totalFleet = actuals.reduce((sum, a) => sum + (a.Fleet || 0), 0);
    const totalFTL = actuals
      .filter((a) => a.Brand === "FTL")
      .reduce((sum, a) => sum + (a.Retail || 0) + (a.Fleet || 0), 0);
    const totalMBT = actuals
      .filter((a) => a.Brand === "MBT")
      .reduce((sum, a) => sum + (a.Retail || 0) + (a.Fleet || 0), 0);

    return { totalRetail, totalFleet, totalFTL, totalMBT };
  }, [actuals]);

  const chartTotals = useMemo(() => {
    const ftlRetail = actuals
      .filter((a) => a.Brand === "FTL")
      .reduce((sum, a) => sum + (a.Retail || 0), 0);
    const ftlFleet = actuals
      .filter((a) => a.Brand === "FTL")
      .reduce((sum, a) => sum + (a.Fleet || 0), 0);
    const mbtRetail = actuals
      .filter((a) => a.Brand === "MBT")
      .reduce((sum, a) => sum + (a.Retail || 0), 0);
    const mbtFleet = actuals
      .filter((a) => a.Brand === "MBT")
      .reduce((sum, a) => sum + (a.Fleet || 0), 0);

    return { ftlRetail, ftlFleet, mbtRetail, mbtFleet };
  }, [actuals]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Sales Dashboard</h1>
        <p className="text-muted-foreground">Track dealership performance across brands</p>
      </div>

      <BDMInfo bdm={selectedBDM} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          value={selectedBDMId?.toString() || "all"}
          onValueChange={(value) => {
            setSelectedBDMId(value === "all" ? null : parseInt(value));
            setSelectedGroup(null);
            setSelectedDealerId(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All BDMs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BDMs</SelectItem>
            {bdms.map((bdm) => (
              <SelectItem key={bdm["BDM ID"]} value={bdm["BDM ID"].toString()}>
                {bdm["Full Name"]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedGroup || "all"}
          onValueChange={(value) => {
            setSelectedGroup(value === "all" ? null : value);
            setSelectedDealerId(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Dealer Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dealer Groups</SelectItem>
            {filteredDealerGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedDealerId?.toString() || "all"}
          onValueChange={(value) => {
            setSelectedDealerId(value === "all" ? null : parseInt(value));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Dealerships" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dealerships</SelectItem>
            {filteredDealerships.map((dealer) => (
              <SelectItem key={dealer["Dealer ID"]} value={dealer["Dealer ID"].toString()}>
                {dealer.Dealership}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear?.toString() || "all"}
          onValueChange={(value) => {
            setSelectedYear(value === "all" ? null : parseInt(value));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart
          title="FTL Retail"
          data={prepareChartData("FTL", "Retail")}
          color="#9b87f5"
          chartType={chartType}
          viewMode={viewMode}
          total={chartTotals.ftlRetail}
        />
        <SalesChart
          title="FTL Fleet"
          data={prepareChartData("FTL", "Fleet")}
          color="#9b87f5"
          chartType={chartType}
          viewMode={viewMode}
          total={chartTotals.ftlFleet}
        />
        <SalesChart
          title="MBT Retail"
          data={prepareChartData("MBT", "Retail")}
          color="#0EA5E9"
          chartType={chartType}
          viewMode={viewMode}
          total={chartTotals.mbtRetail}
        />
        <SalesChart
          title="MBT Fleet"
          data={prepareChartData("MBT", "Fleet")}
          color="#0EA5E9"
          chartType={chartType}
          viewMode={viewMode}
          total={chartTotals.mbtFleet}
        />
      </div>
    </div>
  );
};

export default Performance;
