import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Package, TrendingUp, Truck, Building, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/lib/utils";

interface ForecastData {
  "Conquest Meetings": number;
  "Customer Meetings": number;
  "MBT Orders Received": number;
  "FTL Orders Received": number;
  "Orders Expected": number;
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
    "MBT Orders Received": 0,
    "FTL Orders Received": 0,
    "Orders Expected": 0,
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
            "MBT Orders Received": acc["MBT Orders Received"] + (row["MBT Orders Received"] || 0),
            "FTL Orders Received": acc["FTL Orders Received"] + (row["FTL Orders Received"] || 0),
            "Orders Expected": acc["Orders Expected"] + (row["Orders Expected"] || 0),
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
            "MBT Orders Received": 0,
            "FTL Orders Received": 0,
            "Orders Expected": 0,
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
  const mbtPipeline = data["MBT Pipeline Size This QTR"] + data["MBT Pipeline Size Next QTR"];
  const ftlPipeline = data["FTL Pipeline Size This QTR"] + data["FTL Pipeline Size Next QTR"];
  const pipelineGrowth = data["MBT Pipeline Growth"] + data["FTL Pipeline Growth"];
  const pipelineLost = data["MBT Pipeline Lost"] + data["FTL Pipeline Lost"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total Meetings */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Meetings</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(totalMeetings)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conquest Meetings:</span>
              <span className="font-medium text-foreground">{formatNumber(data["Conquest Meetings"])}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer Meetings:</span>
              <span className="font-medium text-foreground">{formatNumber(data["Customer Meetings"])}</span>
            </div>
          </div>
        </Card>

        {/* Tile 2: Mercedes-Benz Orders Received */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Mercedes-Benz Orders Received</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(data["MBT Orders Received"])}</p>
            </div>
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)' }}>
              <Building className="w-6 h-6 m-3" style={{ color: '#0EA5E9' }} />
            </div>
          </div>
        </Card>

        {/* Tile 3: Freightliner Orders Received */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Freightliner Orders Received</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(data["FTL Orders Received"])}</p>
            </div>
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'rgba(155, 135, 245, 0.1)' }}>
              <Truck className="w-6 h-6 m-3" style={{ color: '#9b87f5' }} />
            </div>
          </div>
        </Card>

        {/* Tile 4: Orders Expected */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Orders Expected</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(data["Orders Expected"])}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
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
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pipeline Growth</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(pipelineGrowth)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Tile 5: Pipeline Lost */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pipeline Lost</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(pipelineLost)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Tile 6: Mercedes-Benz Pipeline */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Mercedes-Benz Pipeline</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(mbtPipeline)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)' }}>
              <Building className="w-6 h-6 m-3" style={{ color: '#0EA5E9' }} />
            </div>
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
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Freightliner Pipeline</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(ftlPipeline)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'rgba(155, 135, 245, 0.1)' }}>
              <Truck className="w-6 h-6 m-3" style={{ color: '#9b87f5' }} />
            </div>
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
