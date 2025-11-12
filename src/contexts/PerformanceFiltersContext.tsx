import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  selectedBDMId: number | null;
  setSelectedBDMId: (id: number | null) => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  selectedDealerId: number | null;
  setSelectedDealerId: (id: number | null) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  selectedWeekStarting: string | null;
  setSelectedWeekStarting: (date: string | null) => void;
  availableYears: number[];
  dealerships: Dealership[];
  bdms: BDM[];
  bdmSearchOpen: boolean;
  setBdmSearchOpen: (open: boolean) => void;
  groupSearchOpen: boolean;
  setGroupSearchOpen: (open: boolean) => void;
  dealershipSearchOpen: boolean;
  setDealershipSearchOpen: (open: boolean) => void;
}

const PerformanceFiltersContext = createContext<PerformanceFiltersContextType | undefined>(undefined);

export const usePerformanceFilters = () => {
  const context = useContext(PerformanceFiltersContext);
  if (!context) {
    throw new Error("usePerformanceFilters must be used within a PerformanceFiltersProvider");
  }
  return context;
};

export const PerformanceFiltersProvider = ({ children }: { children: ReactNode }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
  const [selectedBDMId, setSelectedBDMId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth);
  const [selectedWeekStarting, setSelectedWeekStarting] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [bdms, setBDMs] = useState<BDM[]>([]);
  const [bdmSearchOpen, setBdmSearchOpen] = useState(false);
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [dealershipSearchOpen, setDealershipSearchOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
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
        const currentYear = new Date().getFullYear();
        if (uniqueYears.includes(currentYear)) {
          setSelectedYear(currentYear);
        } else if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]);
        }
      }
    };

    fetchInitialData();
  }, []);

  return (
    <PerformanceFiltersContext.Provider
      value={{
        selectedBDMId,
        setSelectedBDMId,
        selectedGroup,
        setSelectedGroup,
        selectedDealerId,
        setSelectedDealerId,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        selectedWeekStarting,
        setSelectedWeekStarting,
        availableYears,
        dealerships,
        bdms,
        bdmSearchOpen,
        setBdmSearchOpen,
        groupSearchOpen,
        setGroupSearchOpen,
        dealershipSearchOpen,
        setDealershipSearchOpen,
      }}
    >
      {children}
    </PerformanceFiltersContext.Provider>
  );
};
