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
import { BarChart3, LineChart, Check, ChevronsUpDown } from "lucide-react";
import { SummaryCards } from "@/components/performance/SummaryCards";
import { SalesChart } from "@/components/performance/SalesChart";
import { BDMInfo } from "@/components/performance/BDMInfo";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [bdmSearchOpen, setBdmSearchOpen] = useState(false);
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [dealershipSearchOpen, setDealershipSearchOpen] = useState(false);

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
        } else {
          // If no dealers in group, return empty
          setActuals([]);
          return;
        }
      } else if (selectedBDMId !== null) {
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
      const dealer = filteredDealerships.find((d) => d["Dealer ID"] === selectedDealerId);
      if (dealer) {
        return `${dealer["Dealer Group"]} ${dealer.Dealership}`;
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
  }, [selectedBDMId, selectedGroup, selectedDealerId, bdms, filteredDealerships]);

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
        <h1 className="text-4xl font-bold text-foreground mb-2">Dealer Performance</h1>
        <p className="text-muted-foreground">
          {filterLabel || "Track dealership performance across brands"}
        </p>
      </div>

      {!selectedBDMId && <BDMInfo bdm={selectedBDM} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Popover open={bdmSearchOpen} onOpenChange={setBdmSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={bdmSearchOpen}
              className="w-full justify-between"
            >
              {selectedBDMId
                ? bdms.find((b) => b["BDM ID"] === selectedBDMId)?.["Full Name"]
                : "All BDMs"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search BDM..." />
              <CommandList>
                <CommandEmpty>No BDM found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedBDMId(null);
                      setSelectedGroup(null);
                      setSelectedDealerId(null);
                      setBdmSearchOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedBDMId === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All BDMs
                  </CommandItem>
                  {bdms.map((bdm) => (
                    <CommandItem
                      key={bdm["BDM ID"]}
                      value={`${bdm["Full Name"]}-${bdm["BDM ID"]}`}
                      onSelect={() => {
                        setSelectedBDMId(bdm["BDM ID"]);
                        setSelectedGroup(null);
                        setSelectedDealerId(null);
                        setBdmSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBDMId === bdm["BDM ID"] ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {bdm["Full Name"]}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={groupSearchOpen}
              className="w-full justify-between"
            >
              {selectedGroup || "All Dealer Groups"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search dealer group..." />
              <CommandList>
                <CommandEmpty>No dealer group found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedGroup(null);
                      setSelectedDealerId(null);
                      setGroupSearchOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedGroup === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Dealer Groups
                  </CommandItem>
                  {filteredDealerGroups.map((group) => (
                    <CommandItem
                      key={group}
                      value={group}
                      onSelect={() => {
                        setSelectedGroup(group);
                        setSelectedDealerId(null);
                        setGroupSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedGroup === group ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {group}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={dealershipSearchOpen} onOpenChange={setDealershipSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={dealershipSearchOpen}
              className="w-full justify-between"
            >
              {selectedDealerId
                ? filteredDealerships.find((d) => d["Dealer ID"] === selectedDealerId)?.Dealership
                : "All Dealerships"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search dealership..." />
              <CommandList>
                <CommandEmpty>No dealership found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedDealerId(null);
                      setDealershipSearchOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedDealerId === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Dealerships
                  </CommandItem>
                  {filteredDealerships.map((dealer) => (
                    <CommandItem
                      key={dealer["Dealer ID"]}
                      value={`${dealer.Dealership}-${dealer["Dealer ID"]}`}
                      onSelect={() => {
                        setSelectedDealerId(dealer["Dealer ID"]);
                        setDealershipSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedDealerId === dealer["Dealer ID"] ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {dealer.Dealership}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
      </div>
    </div>
  );
};

export default Performance;
