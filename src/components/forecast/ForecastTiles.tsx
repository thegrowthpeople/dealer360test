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
}

export const ForecastTiles = () => {
  const { selectedBDMId, selectedGroup, selectedDealerId, selectedYear, selectedMonth, dealerships } = usePerformanceFilters();
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
  });

  useEffect(() => {
    if (dealerships.length > 0) {
      fetchForecastData();
    }
  }, [selectedBDMId, selectedGroup, selectedDealerId, selectedYear, selectedMonth, dealerships]);

  const fetchForecastData = async () => {
    try {
      let query = supabase.from("Forecast").select("*");

      if (selectedYear) {
        query = query.eq("Year", selectedYear);
      }

      if (selectedMonth) {
        query = query.eq("Month", selectedMonth);
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
        {/* Total Meetings Row */}
        <div className="mb-4 max-w-xl">
          {/* Total Meetings - Combined Tile */}
          <Card className="p-0 overflow-hidden border-primary/20">
            <div className="flex flex-col md:flex-row">
              {/* Left side - Total with colored background */}
              <div className="flex-1 p-6 bg-primary/10">
                <p className="text-xl font-bold text-foreground mb-2">Total Meetings</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(totalMeetings)}</p>
              </div>
              
              {/* Vertical separator */}
              <div className="hidden md:block w-px bg-border"></div>
              
              {/* Right side - Breakdown with white background */}
              <div className="p-6 bg-background min-w-[200px]">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Conquest</span>
                    <span className="text-2xl font-bold text-foreground block">{formatNumber(data["Conquest Meetings"])}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Customer</span>
                    <span className="text-2xl font-bold text-foreground block">{formatNumber(data["Customer Meetings"])}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Other Activity Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Tile 2: Quotes Issued */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-xl font-bold text-foreground mb-2">Quotes Issued</p>
            <p className="text-3xl font-bold text-foreground">{formatNumber(totalQuotesIssued)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mercedes-Benz:</span>
              <span className="font-medium text-foreground">{formatNumber(data["MBT Quotes Issued"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Freightliner:</span>
              <span className="font-medium text-foreground">{formatNumber(data["FTL Quotes Issued"])}</span>
            </div>
          </div>
        </Card>

        {/* Tile 3: Orders Received */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-xl font-bold text-foreground mb-2">Orders Received</p>
            <p className="text-3xl font-bold text-foreground">{formatNumber(totalOrdersReceived)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mercedes-Benz:</span>
              <span className="font-medium text-foreground">{formatNumber(data["MBT Orders Received"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Freightliner:</span>
              <span className="font-medium text-foreground">{formatNumber(data["FTL Orders Received"])}</span>
            </div>
          </div>
        </Card>

        {/* Tile 4: Orders Expected */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-xl font-bold text-foreground mb-2">Orders Expected</p>
            <p className="text-3xl font-bold text-foreground">{formatNumber(totalOrdersExpected)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mercedes-Benz:</span>
              <span className="font-medium text-foreground">{formatNumber(data["MBT Orders Expected NW"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Freightliner:</span>
              <span className="font-medium text-foreground">{formatNumber(data["FTL Orders Expected NW"])}</span>
            </div>
          </div>
        </Card>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 4: Pipeline Growth */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-xl font-bold text-foreground mb-2">Pipeline Growth</p>
            <p className="text-3xl font-bold text-foreground">{formatNumber(pipelineGrowth)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mercedes-Benz:</span>
              <span className="font-medium text-foreground">{formatNumber(data["MBT Pipeline Growth"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Freightliner:</span>
              <span className="font-medium text-foreground">{formatNumber(data["FTL Pipeline Growth"])}</span>
            </div>
          </div>
        </Card>

        {/* Tile 5: Pipeline Lost */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-xl font-bold text-foreground mb-2">Pipeline Lost</p>
            <p className="text-3xl font-bold text-foreground">{formatNumber(pipelineLost)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mercedes-Benz:</span>
              <span className="font-medium text-foreground">{formatNumber(data["MBT Pipeline Lost"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Freightliner:</span>
              <span className="font-medium text-foreground">{formatNumber(data["FTL Pipeline Lost"])}</span>
            </div>
          </div>
        </Card>

        {/* Tile 6: Mercedes-Benz Pipeline */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-xl font-bold text-foreground mb-2">Mercedes-Benz Pipeline</p>
            <p className="text-3xl font-bold text-foreground">{formatNumber(mbtPipeline)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">This QTR:</span>
              <span className="font-medium text-foreground">{formatNumber(data["MBT Pipeline Size This QTR"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next QTR:</span>
              <span className="font-medium text-foreground">{formatNumber(data["MBT Pipeline Size Next QTR"])}</span>
            </div>
          </div>
        </Card>

        {/* Tile 7: Freightliner Pipeline */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-xl font-bold text-foreground mb-2">Freightliner Pipeline</p>
            <p className="text-3xl font-bold text-foreground">{formatNumber(ftlPipeline)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">This QTR:</span>
              <span className="font-medium text-foreground">{formatNumber(data["FTL Pipeline Size This QTR"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next QTR:</span>
              <span className="font-medium text-foreground">{formatNumber(data["FTL Pipeline Size Next QTR"])}</span>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
};
