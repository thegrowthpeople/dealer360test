import { Navigation } from "@/components/Navigation";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const Index = () => {
  const [selectedBDM, setSelectedBDM] = useState<string>("all");
  const [selectedDealership, setSelectedDealership] = useState<string>("all");

  const bdmNames = ["Darren", "Jimmy", "Jason", "Steve", "Giulio", "Mark"];
  const dealerships = ["VTC", "TriStar", "RGM"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your weekly activities and performance</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="w-full sm:w-64">
            <Select value={selectedBDM} onValueChange={setSelectedBDM}>
              <SelectTrigger id="bdm-filter">
                <SelectValue placeholder="Select BDM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All BDMs</SelectItem>
                {bdmNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <Select value={selectedDealership} onValueChange={setSelectedDealership}>
              <SelectTrigger id="dealership-filter">
                <SelectValue placeholder="Select Dealership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dealerships</SelectItem>
                {dealerships.map((dealership) => (
                  <SelectItem key={dealership} value={dealership}>
                    {dealership}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-8">
          <DashboardStats />
          <DashboardCharts />
        </div>
      </main>
    </div>
  );
};

export default Index;
