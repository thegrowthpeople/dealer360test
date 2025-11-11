import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Dealership {
  "Dealer ID": number;
  Dealership: string | null;
  "Dealer Group": string | null;
  "BDM ID": number;
  State: string | null;
  Region: string | null;
}

interface BDM {
  "BDM ID": number;
  "Full Name": string | null;
  eMail: string | null;
  "Phone Number": string | null;
  IsManager: number | null;
}

interface PerformanceFiltersContextType {
  dealerships: Dealership[];
  bdms: BDM[];
  availableYears: number[];
  selectedBDMId: number | null;
  setSelectedBDMId: (id: number | null) => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  selectedDealerId: number | null;
  setSelectedDealerId: (id: number | null) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  bdmSearchOpen: boolean;
  setBdmSearchOpen: (open: boolean) => void;
  groupSearchOpen: boolean;
  setGroupSearchOpen: (open: boolean) => void;
  dealershipSearchOpen: boolean;
  setDealershipSearchOpen: (open: boolean) => void;
  filteredDealerGroups: string[];
  filteredDealerships: Dealership[];
}

const PerformanceFiltersContext = createContext<PerformanceFiltersContextType | undefined>(undefined);

export function PerformanceFiltersProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [bdms, setBDMs] = useState<BDM[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  const [selectedBDMId, setSelectedBDMId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  const [bdmSearchOpen, setBdmSearchOpen] = useState(false);
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [dealershipSearchOpen, setDealershipSearchOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
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
    }
  };

  const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];

  const filteredDealerGroups = (() => {
    let groups = dealerships;
    
    if (selectedBDMId !== null) {
      const selectedBdm = bdms.find((b) => b["BDM ID"] === selectedBDMId);
      const isManager = selectedBdm?.IsManager === 1;
      
      if (!isManager) {
        groups = groups.filter((d) => d["BDM ID"] === selectedBDMId);
      }
    }

    const uniqueGroups = [...new Set(groups.map((d) => d["Dealer Group"]).filter(Boolean))];
    
    return uniqueGroups.sort((a, b) => {
      const regionA = dealerships.find(d => d["Dealer Group"] === a)?.Region || "";
      const regionB = dealerships.find(d => d["Dealer Group"] === b)?.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  })();

  const filteredDealerships = (() => {
    let filtered = dealerships;

    if (selectedBDMId !== null) {
      const selectedBdm = bdms.find((b) => b["BDM ID"] === selectedBDMId);
      const isManager = selectedBdm?.IsManager === 1;
      
      if (!isManager) {
        filtered = filtered.filter((d) => d["BDM ID"] === selectedBDMId);
      }
    }

    if (selectedGroup !== null) {
      filtered = filtered.filter((d) => d["Dealer Group"] === selectedGroup);
    }

    return filtered;
  })();

  return (
    <PerformanceFiltersContext.Provider
      value={{
        dealerships,
        bdms,
        availableYears,
        selectedBDMId,
        setSelectedBDMId,
        selectedGroup,
        setSelectedGroup,
        selectedDealerId,
        setSelectedDealerId,
        selectedYear,
        setSelectedYear,
        bdmSearchOpen,
        setBdmSearchOpen,
        groupSearchOpen,
        setGroupSearchOpen,
        dealershipSearchOpen,
        setDealershipSearchOpen,
        filteredDealerGroups,
        filteredDealerships,
      }}
    >
      {children}
    </PerformanceFiltersContext.Provider>
  );
}

export function usePerformanceFilters() {
  const context = useContext(PerformanceFiltersContext);
  if (context === undefined) {
    throw new Error("usePerformanceFilters must be used within a PerformanceFiltersProvider");
  }
  return context;
}
