import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
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

interface BDM {
  "BDM ID": number;
  "Full Name": string | null;
  eMail: string | null;
  "Phone Number": string | null;
  IsManager: number | null;
}

interface Dealership {
  "Dealer ID": number;
  Dealership: string | null;
  "Dealer Group": string | null;
  "BDM ID": number;
  State: string | null;
  Region: string | null;
}

interface PerformanceFiltersProps {
  bdms: BDM[];
  selectedBDMId: number | null;
  setSelectedBDMId: (id: number | null) => void;
  filteredDealerGroups: string[];
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  filteredDealerships: Dealership[];
  selectedDealerId: number | null;
  setSelectedDealerId: (id: number | null) => void;
  availableYears: number[];
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  bdmSearchOpen: boolean;
  setBdmSearchOpen: (open: boolean) => void;
  groupSearchOpen: boolean;
  setGroupSearchOpen: (open: boolean) => void;
  dealershipSearchOpen: boolean;
  setDealershipSearchOpen: (open: boolean) => void;
  dealerships: Dealership[];
}

export function PerformanceFilters({
  bdms,
  selectedBDMId,
  setSelectedBDMId,
  filteredDealerGroups,
  selectedGroup,
  setSelectedGroup,
  filteredDealerships,
  selectedDealerId,
  setSelectedDealerId,
  availableYears,
  selectedYear,
  setSelectedYear,
  bdmSearchOpen,
  setBdmSearchOpen,
  groupSearchOpen,
  setGroupSearchOpen,
  dealershipSearchOpen,
  setDealershipSearchOpen,
  dealerships,
}: PerformanceFiltersProps) {
  return (
    <>
      <Popover open={bdmSearchOpen} onOpenChange={setBdmSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={bdmSearchOpen}
            className="w-full justify-between min-w-[180px]"
          >
            {selectedBDMId
              ? bdms.find((b) => b["BDM ID"] === selectedBDMId)?.["Full Name"]
              : "All BDMs"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-50" align="start">
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
            className="w-full justify-between min-w-[180px]"
          >
            {selectedGroup || "All Dealer Groups"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-50" align="start">
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
                {filteredDealerGroups.map((group, index) => {
                  const currentRegion = dealerships.find(d => d["Dealer Group"] === group)?.Region || "";
                  const previousRegion = index > 0 
                    ? dealerships.find(d => d["Dealer Group"] === filteredDealerGroups[index - 1])?.Region || ""
                    : "";
                  const showSeparator = index > 0 && currentRegion !== previousRegion;
                  const showVelocitySeparator = group === "Velocity";
                  
                  return (
                    <div key={group}>
                      {(showSeparator || showVelocitySeparator) && (
                        <div className="border-t border-border my-1" />
                      )}
                      <CommandItem
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
                    </div>
                  );
                })}
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
            className="w-full justify-between min-w-[180px]"
          >
            {selectedDealerId
              ? filteredDealerships.find((d) => d["Dealer ID"] === selectedDealerId)?.Dealership
              : "All Dealerships"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-50" align="start">
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
        <SelectTrigger className="w-[100px]">
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
    </>
  );
}
