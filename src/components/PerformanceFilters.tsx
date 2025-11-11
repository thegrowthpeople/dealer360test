import { useMemo } from "react";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

export const PerformanceFilters = () => {
  const {
    selectedBDMId,
    setSelectedBDMId,
    selectedGroup,
    setSelectedGroup,
    selectedDealerId,
    setSelectedDealerId,
    selectedYear,
    setSelectedYear,
    availableYears,
    dealerships,
    bdms,
    bdmSearchOpen,
    setBdmSearchOpen,
    groupSearchOpen,
    setGroupSearchOpen,
    dealershipSearchOpen,
    setDealershipSearchOpen,
  } = usePerformanceFilters();

  const filteredDealerGroups = useMemo(() => {
    let groups = dealerships;
    
    if (selectedBDMId !== null) {
      const selectedBdm = bdms.find((b) => b["BDM ID"] === selectedBDMId);
      const isManager = selectedBdm?.IsManager === 1;
      
      if (!isManager) {
        groups = groups.filter((d) => d["BDM ID"] === selectedBDMId);
      }
    }

    const uniqueGroups = [...new Set(groups.map((d) => d["Dealer Group"]).filter(Boolean))];
    
    const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];
    
    return uniqueGroups.sort((a, b) => {
      const regionA = dealerships.find(d => d["Dealer Group"] === a)?.Region || "";
      const regionB = dealerships.find(d => d["Dealer Group"] === b)?.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [dealerships, selectedBDMId, bdms]);

  const filteredDealerships = useMemo(() => {
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
  }, [dealerships, selectedBDMId, selectedGroup, bdms]);

  return (
    <div className="flex flex-wrap items-center gap-3 animate-fade-in">
      {/* BDM Filter */}
      <Popover open={bdmSearchOpen} onOpenChange={setBdmSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={bdmSearchOpen}
            className="w-[180px] justify-between"
          >
            {selectedBDMId
              ? bdms.find((b) => b["BDM ID"] === selectedBDMId)?.["Full Name"]
              : "All BDMs"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0" align="end">
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
                    value={bdm["Full Name"] || ""}
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

      {/* Dealer Group Filter */}
      <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={groupSearchOpen}
            className="w-[180px] justify-between"
          >
            {selectedGroup || "All Dealer Groups"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search group..." />
            <CommandList>
              <CommandEmpty>No group found.</CommandEmpty>
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
                {filteredDealerGroups.map((group) => (
                  <CommandItem
                    key={group}
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
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dealership Filter */}
      <Popover open={dealershipSearchOpen} onOpenChange={setDealershipSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={dealershipSearchOpen}
            className="w-[180px] justify-between"
          >
            {selectedDealerId
              ? filteredDealerships.find((d) => d["Dealer ID"] === selectedDealerId)?.Dealership
              : "All Dealerships"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0" align="end">
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
                    value={dealer.Dealership || ""}
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

      {/* Year Filter */}
      <Select
        value={selectedYear?.toString() || ""}
        onValueChange={(value) => setSelectedYear(value === "all" ? null : parseInt(value))}
      >
        <SelectTrigger className="w-[120px]">
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
    </div>
  );
};
