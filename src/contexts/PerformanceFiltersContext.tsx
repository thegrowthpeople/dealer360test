import { createContext, useContext, ReactNode } from "react";

interface BDM {
  "BDM ID": number;
  "Full Name": string | null;
}

interface Dealership {
  "Dealer ID": number;
  Dealership: string | null;
  "Dealer Group": string | null;
}

export interface PerformanceFiltersContextType {
  bdms: BDM[];
  filteredDealerGroups: string[];
  filteredDealerships: Dealership[];
  availableYears: number[];
  selectedBDMId: number | null;
  selectedGroup: string | null;
  selectedDealerId: number | null;
  selectedYear: number | null;
  setSelectedBDMId: (id: number | null) => void;
  setSelectedGroup: (group: string | null) => void;
  setSelectedDealerId: (id: number | null) => void;
  setSelectedYear: (year: number | null) => void;
  bdmSearchOpen: boolean;
  setBdmSearchOpen: (open: boolean) => void;
  groupSearchOpen: boolean;
  setGroupSearchOpen: (open: boolean) => void;
  dealershipSearchOpen: boolean;
  setDealershipSearchOpen: (open: boolean) => void;
}

const PerformanceFiltersContext = createContext<PerformanceFiltersContextType | null>(null);

export const usePerformanceFilters = () => {
  const context = useContext(PerformanceFiltersContext);
  return context;
};

interface PerformanceFiltersProviderProps {
  children: ReactNode;
  value: PerformanceFiltersContextType;
}

export const PerformanceFiltersProvider = ({ children, value }: PerformanceFiltersProviderProps) => {
  return (
    <PerformanceFiltersContext.Provider value={value}>
      {children}
    </PerformanceFiltersContext.Provider>
  );
};
