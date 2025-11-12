import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/lib/utils";

interface ForecastData {
  "Conquest Meetings": number;
  "Customer Meetings": number;
  "MBT Quotes Issued": number;
  "FTL Quotes Issued": number;
  "MBT Orders Received": number;
  "FTL Orders Received": number;
  "MBT Orders Expected NW": number;
  "FTL Orders Expected NW": number;
  "MBT Pipeline Size This QTR": number;
  "MBT Pipeline Size Next QTR": number;
  "FTL Pipeline Size This QTR": number;
  "FTL Pipeline Size Next QTR": number;
  "MBT Pipeline Growth": number;
  "FTL Pipeline Growth": number;
  "MBT Pipeline Lost": number;
  "FTL Pipeline Lost": number;
  "MBT Retail": number;
  "FTL Retail": number;
  "MBT Fleet Indirect": number;
  "FTL Fleet Indirect": number;
  "MBT Fleet Direct": number;
  "FTL Fleet Direct": number;
}

export const ForecastTiles = () => {
  const { selectedBDMId, selectedGroup, selectedDealerId, selectedYear, selectedMonth, selectedWeekStarting, dealerships } = usePerformanceFilters();
  const [data, setData] = useState<ForecastData>({
    "Conquest Meetings": 0,
    "Customer Meetings": 0,
    "MBT Quotes Issued": 0,
    "FTL Quotes Issued": 0,
    "MBT Orders Received": 0,
    "FTL Orders Received": 0,
    "MBT Orders Expected NW": 0,
    "FTL Orders Expected NW": 0,
    "MBT Pipeline Size This QTR": 0,
    "MBT Pipeline Size Next QTR": 0,
    "FTL Pipeline Size This QTR": 0,
    "FTL Pipeline Size Next QTR": 0,
    "MBT Pipeline Growth": 0,
    "FTL Pipeline Growth": 0,
    "MBT Pipeline Lost": 0,
    "FTL Pipeline Lost": 0,
    "MBT Retail": 0,
    "FTL Retail": 0,
    "MBT Fleet Indirect": 0,
    "FTL Fleet Indirect": 0,
    "MBT Fleet Direct": 0,
    "FTL Fleet Direct": 0,
  });

  useEffect(() => {
    if (dealerships.length > 0) {
      fetchForecastData();
    }
  }, [selectedBDMId, selectedGroup, selectedDealerId, selectedYear, selectedMonth, selectedWeekStarting, dealerships]);

  const fetchForecastData = async () => {
    try {
      let query = supabase.from("Forecast").select("*");

      // Filter by week starting date if selected
      if (selectedWeekStarting) {
        const weekStart = new Date(selectedWeekStarting);
        const weekEnd = new Date(selectedWeekStarting);
        weekEnd.setDate(weekEnd.getDate() + 6); // Add 6 days to get Sunday

        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        
        query = query
          .gte("Forecast Date", formatDate(weekStart))
          .lte("Forecast Date", formatDate(weekEnd));
      } else if (selectedMonth && selectedYear) {
        // Filter by month if no specific week is selected
        const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
        const monthEnd = new Date(selectedYear, selectedMonth, 0);
        
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        
        query = query
          .gte("Forecast Date", formatDate(monthStart))
          .lte("Forecast Date", formatDate(monthEnd));
      }

      if (selectedDealerId !== null) {
        query = query.eq("Dealer ID", selectedDealerId);
      } else if (selectedGroup !== null) {
        const dealerIdsInGroup = dealerships
          .filter((d) => d["Dealer Group"] === selectedGroup)
          .map((d) => d["Dealer ID"]);
        query = query.in("Dealer ID", dealerIdsInGroup);
      } else if (selectedBDMId !== null) {
        const dealerIdsForBDM = dealerships
          .filter((d) => d["BDM ID"] === selectedBDMId)
          .map((d) => d["Dealer ID"]);
        query = query.in("Dealer ID", dealerIdsForBDM);
      }

      const { data: forecastData, error } = await query;

      if (error) throw error;

      if (forecastData && forecastData.length > 0) {
        const aggregated = forecastData.reduce(
          (acc, row) => ({
            "Conquest Meetings": acc["Conquest Meetings"] + (row["Conquest Meetings"] || 0),
            "Customer Meetings": acc["Customer Meetings"] + (row["Customer Meetings"] || 0),
            "MBT Quotes Issued": acc["MBT Quotes Issued"] + (row["MBT Quotes Issued"] || 0),
            "FTL Quotes Issued": acc["FTL Quotes Issued"] + (row["FTL Quotes Issued"] || 0),
            "MBT Orders Received": acc["MBT Orders Received"] + (row["MBT Orders Received"] || 0),
            "FTL Orders Received": acc["FTL Orders Received"] + (row["FTL Orders Received"] || 0),
            "MBT Orders Expected NW": acc["MBT Orders Expected NW"] + (row["MBT Orders Expected NW"] || 0),
            "FTL Orders Expected NW": acc["FTL Orders Expected NW"] + (row["FTL Orders Expected NW"] || 0),
            "MBT Pipeline Size This QTR": acc["MBT Pipeline Size This QTR"] + (row["MBT Pipeline Size This QTR"] || 0),
            "MBT Pipeline Size Next QTR": acc["MBT Pipeline Size Next QTR"] + (row["MBT Pipeline Size Next QTR"] || 0),
            "FTL Pipeline Size This QTR": acc["FTL Pipeline Size This QTR"] + (row["FTL Pipeline Size This QTR"] || 0),
            "FTL Pipeline Size Next QTR": acc["FTL Pipeline Size Next QTR"] + (row["FTL Pipeline Size Next QTR"] || 0),
            "MBT Pipeline Growth": acc["MBT Pipeline Growth"] + (row["MBT Pipeline Growth"] || 0),
            "FTL Pipeline Growth": acc["FTL Pipeline Growth"] + (row["FTL Pipeline Growth"] || 0),
            "MBT Pipeline Lost": acc["MBT Pipeline Lost"] + (row["MBT Pipeline Lost"] || 0),
            "FTL Pipeline Lost": acc["FTL Pipeline Lost"] + (row["FTL Pipeline Lost"] || 0),
            "MBT Retail": acc["MBT Retail"] + (row["MBT Retail"] || 0),
            "FTL Retail": acc["FTL Retail"] + (row["FTL Retail"] || 0),
            "MBT Fleet Indirect": acc["MBT Fleet Indirect"] + (row["MBT Fleet Indirect"] || 0),
            "FTL Fleet Indirect": acc["FTL Fleet Indirect"] + (row["FTL Fleet Indirect"] || 0),
            "MBT Fleet Direct": acc["MBT Fleet Direct"] + (row["MBT Fleet Direct"] || 0),
            "FTL Fleet Direct": acc["FTL Fleet Direct"] + (row["FTL Fleet Direct"] || 0),
          }),
          {
            "Conquest Meetings": 0,
            "Customer Meetings": 0,
            "MBT Quotes Issued": 0,
            "FTL Quotes Issued": 0,
            "MBT Orders Received": 0,
            "FTL Orders Received": 0,
            "MBT Orders Expected NW": 0,
            "FTL Orders Expected NW": 0,
            "MBT Pipeline Size This QTR": 0,
            "MBT Pipeline Size Next QTR": 0,
            "FTL Pipeline Size This QTR": 0,
            "FTL Pipeline Size Next QTR": 0,
            "MBT Pipeline Growth": 0,
            "FTL Pipeline Growth": 0,
            "MBT Pipeline Lost": 0,
            "FTL Pipeline Lost": 0,
            "MBT Retail": 0,
            "FTL Retail": 0,
            "MBT Fleet Indirect": 0,
            "FTL Fleet Indirect": 0,
            "MBT Fleet Direct": 0,
            "FTL Fleet Direct": 0,
          }
        );
        setData(aggregated);
      }
    } catch (error) {
      console.error("Error fetching forecast data:", error);
    }
  };

  const totalMeetings = data["Conquest Meetings"] + data["Customer Meetings"];
  const totalQuotesIssued = data["MBT Quotes Issued"] + data["FTL Quotes Issued"];
  const totalOrdersReceived = data["MBT Orders Received"] + data["FTL Orders Received"];
  const totalOrdersExpected = data["MBT Orders Expected NW"] + data["FTL Orders Expected NW"];
  const mbtPipeline = data["MBT Pipeline Size This QTR"] + data["MBT Pipeline Size Next QTR"];
  const ftlPipeline = data["FTL Pipeline Size This QTR"] + data["FTL Pipeline Size Next QTR"];
  const pipelineGrowth = data["MBT Pipeline Growth"] + data["FTL Pipeline Growth"];
  const pipelineLost = data["MBT Pipeline Lost"] + data["FTL Pipeline Lost"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Activity</h2>
        {/* Activity Metrics Row */}
        <div className="grid grid-cols-1 gap-4">
          {/* Total Meetings */}
          <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Left side - Total with colored background */}
              <div className="p-4 bg-primary/10 w-[150px]">
                <p className="text-xl font-bold text-foreground mb-2">Meetings<br />Total</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(totalMeetings)}</p>
              </div>
              
              {/* Vertical separator */}
              <div className="hidden md:block w-px bg-border"></div>
              
              {/* Right side - Breakdown with white background */}
              <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
                <div className="flex gap-6">
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Conquest</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["Conquest Meetings"])}</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Customer</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["Customer Meetings"])}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tile 5: Pipeline Growth */}
        <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Total with colored background */}
            <div className="p-4 bg-primary/10 w-[150px]">
              <p className="text-xl font-bold text-foreground mb-2">Pipeline<br />Growth</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(pipelineGrowth)}</p>
            </div>
            
            {/* Vertical separator */}
            <div className="hidden md:block w-px bg-border"></div>
            
            {/* Right side - Breakdown with white background */}
            <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
              <div className="flex gap-6">
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["MBT Pipeline Growth"])}</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["FTL Pipeline Growth"])}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tile 6: Pipeline Lost */}
        <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Total with colored background */}
            <div className="p-4 bg-primary/10 w-[150px]">
              <p className="text-xl font-bold text-foreground mb-2">Pipeline<br />Lost</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(pipelineLost)}</p>
            </div>
            
            {/* Vertical separator */}
            <div className="hidden md:block w-px bg-border"></div>
            
            {/* Right side - Breakdown with white background */}
            <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
              <div className="flex gap-6">
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["MBT Pipeline Lost"])}</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["FTL Pipeline Lost"])}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tile 7: This QTR Pipeline */}
        <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Total with colored background */}
            <div className="p-4 bg-primary/10 w-[150px]">
              <p className="text-xl font-bold text-foreground mb-2">This QTR<br />Pipeline</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(data["MBT Pipeline Size This QTR"] + data["FTL Pipeline Size This QTR"])}</p>
            </div>
            
            {/* Vertical separator */}
            <div className="hidden md:block w-px bg-border"></div>
            
            {/* Right side - Breakdown with white background */}
            <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
              <div className="flex gap-6">
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["MBT Pipeline Size This QTR"])}</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["FTL Pipeline Size This QTR"])}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tile 8: Next QTR Pipeline */}
        <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Total with colored background */}
            <div className="p-4 bg-primary/10 w-[150px]">
              <p className="text-xl font-bold text-foreground mb-2">Next QTR<br />Pipeline</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(data["MBT Pipeline Size Next QTR"] + data["FTL Pipeline Size Next QTR"])}</p>
            </div>
            
            {/* Vertical separator */}
            <div className="hidden md:block w-px bg-border"></div>
            
            {/* Right side - Breakdown with white background */}
            <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
              <div className="flex gap-6">
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["MBT Pipeline Size Next QTR"])}</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                  <span className="text-2xl text-foreground block">{formatNumber(data["FTL Pipeline Size Next QTR"])}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Deliveries Committed */}
          <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-4 bg-primary/10 w-[150px]">
                <p className="text-xl font-bold text-foreground mb-2">Deliveries<br />Committed</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(data["MBT Retail"] + data["MBT Fleet Indirect"] + data["MBT Fleet Direct"] + data["FTL Retail"] + data["FTL Fleet Indirect"] + data["FTL Fleet Direct"])}</p>
              </div>
              <div className="hidden md:block w-px bg-border"></div>
              <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
                <div className="flex gap-6">
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["MBT Retail"] + data["MBT Fleet Indirect"] + data["MBT Fleet Direct"])}</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["FTL Retail"] + data["FTL Fleet Indirect"] + data["FTL Fleet Direct"])}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Own Retail */}
          <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-4 bg-primary/10 w-[150px]">
                <p className="text-xl font-bold text-foreground mb-2">Own<br />Retail</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(data["MBT Retail"] + data["FTL Retail"])}</p>
              </div>
              <div className="hidden md:block w-px bg-border"></div>
              <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
                <div className="flex gap-6">
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["MBT Retail"])}</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["FTL Retail"])}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Indirect Fleet */}
          <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-4 bg-primary/10 w-[150px]">
                <p className="text-xl font-bold text-foreground mb-2">Indirect<br />Fleet</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(data["MBT Fleet Indirect"] + data["FTL Fleet Indirect"])}</p>
              </div>
              <div className="hidden md:block w-px bg-border"></div>
              <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
                <div className="flex gap-6">
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["MBT Fleet Indirect"])}</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["FTL Fleet Indirect"])}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Direct Fleet */}
          <Card className="p-0 overflow-hidden border-primary/20 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-4 bg-primary/10 w-[150px]">
                <p className="text-xl font-bold text-foreground mb-2">Direct<br />Fleet</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(data["MBT Fleet Direct"] + data["FTL Fleet Direct"])}</p>
              </div>
              <div className="hidden md:block w-px bg-border"></div>
              <div className="px-4 py-6 bg-white flex items-center justify-center flex-1">
                <div className="flex gap-6">
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Mercedes-Benz</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["MBT Fleet Direct"])}</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-muted-foreground block uppercase tracking-wider">Freightliner</span>
                    <span className="text-2xl text-foreground block">{formatNumber(data["FTL Fleet Direct"])}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
