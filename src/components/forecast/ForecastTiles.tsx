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
        <div className="space-y-4">
          {/* Total Meetings */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Total Meetings</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(totalMeetings)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conquest:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["Conquest Meetings"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["Customer Meetings"])}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Quotes Issued */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Quotes Issued</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(totalQuotesIssued)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mercedes-Benz:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["MBT Quotes Issued"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Freightliner:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["FTL Quotes Issued"])}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Orders Received */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Orders Received</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(totalOrdersReceived)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mercedes-Benz:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["MBT Orders Received"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Freightliner:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["FTL Orders Received"])}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Orders Expected */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Orders Expected</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(totalOrdersExpected)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mercedes-Benz:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["MBT Orders Expected NW"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Freightliner:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["FTL Orders Expected NW"])}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Pipeline</h2>
        <div className="space-y-4">
          {/* Pipeline Growth */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Pipeline Growth</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(pipelineGrowth)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mercedes-Benz:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["MBT Pipeline Growth"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Freightliner:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["FTL Pipeline Growth"])}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Pipeline Lost */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Pipeline Lost</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(pipelineLost)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mercedes-Benz:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["MBT Pipeline Lost"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Freightliner:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["FTL Pipeline Lost"])}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Mercedes-Benz Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Mercedes-Benz Pipeline</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(mbtPipeline)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This QTR:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["MBT Pipeline Size This QTR"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next QTR:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["MBT Pipeline Size Next QTR"])}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Freightliner Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-3 p-6 bg-gradient-to-br from-primary to-primary/80">
              <p className="text-sm font-medium text-primary-foreground/80 mb-2">Freightliner Pipeline</p>
              <p className="text-4xl font-bold text-primary-foreground">{formatNumber(ftlPipeline)}</p>
            </Card>
            <Card className="md:col-span-2 p-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This QTR:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["FTL Pipeline Size This QTR"])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next QTR:</span>
                  <span className="font-semibold text-foreground">{formatNumber(data["FTL Pipeline Size Next QTR"])}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
