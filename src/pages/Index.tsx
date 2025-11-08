import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [selectedBDM, setSelectedBDM] = useState<string>("all");
  const [selectedDealership, setSelectedDealership] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("october");

  const bdmNames = ["Darren", "Jimmy", "Jason", "Steve", "Giulio", "Mark"];
  const dealerships = ["VTC", "TriStar", "RGM"];
  const locations = [
    "Adelaide", "Albury", "Ballarat", "Brisbane", "Cairns", "Canberra", 
    "Dandenong", "Darwin", "Geelong", "Gold Coast", "Huntingwood", "Laverton", 
    "Mildura", "Mount Gambier", "Perth", "Shepparton", "Somerton", "Townsville", "Wagga"
  ];
  const months = [
    { value: "october", label: "October 2025" },
    { value: "november", label: "November 2025" },
    { value: "december", label: "December 2025" },
    { value: "january", label: "January 2026" },
    { value: "february", label: "February 2026" },
    { value: "march", label: "March 2026" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-foreground">BDM Dashboard</h1>
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
                <SelectItem value="all">All Dealer Groups</SelectItem>
                {dealerships.map((dealership) => (
                  <SelectItem key={dealership} value={dealership}>
                    {dealership}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="location-filter">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-filter">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
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
    </div>
  );
};

export default Index;
