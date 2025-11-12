import { useMemo, useEffect } from "react";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, RotateCcw } from "lucide-react";
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
import { startOfMonth, endOfMonth, eachDayOfInterval, isMonday, format } from "date-fns";

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
  } = usePerformanceFilters();

  const handleClearFilters = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    setSelectedBDMId(null);
    setSelectedGroup(null);
    setSelectedDealerId(null);
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setSelectedWeekStarting(null);
  };

  const hasActiveFilters = selectedBDMId !== null || selectedGroup !== null || selectedDealerId !== null;

  // Get BDMs associated with selected dealership or group
  const filteredBDMs = useMemo(() => {
    if (selectedDealerId !== null) {
      const dealership = dealerships.find((d) => d["Dealer ID"] === selectedDealerId);
      if (dealership) {
        return bdms.filter((b) => b["BDM ID"] === dealership["BDM ID"]);
      }
    } else if (selectedGroup !== null) {
      const dealershipsInGroup = dealerships.filter((d) => d["Dealer Group"] === selectedGroup);
      const bdmIds = [...new Set(dealershipsInGroup.map((d) => d["BDM ID"]))];
      return bdms.filter((b) => bdmIds.includes(b["BDM ID"]));
    }
    return bdms;
  }, [selectedDealerId, selectedGroup, dealerships, bdms]);

  // Auto-select BDM when dealership or group is selected
  useEffect(() => {
    if ((selectedDealerId !== null || selectedGroup !== null) && filteredBDMs.length === 1) {
      setSelectedBDMId(filteredBDMs[0]["BDM ID"]);
    }
  }, [selectedDealerId, selectedGroup, filteredBDMs, setSelectedBDMId]);

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

  // Calculate Mondays in the selected month
  const availableWeeks = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return allDays
      .filter(day => isMonday(day))
      .map(monday => ({
        date: format(monday, "yyyy-MM-dd"),
        display: format(monday, "MMM d, yyyy")
      }));
  }, [selectedYear, selectedMonth]);

  // Reset week starting when month changes
  useEffect(() => {
    setSelectedWeekStarting(null);
  }, [selectedMonth, selectedYear, setSelectedWeekStarting]);

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
            disabled={filteredBDMs.length === 0}
          >
            {selectedBDMId
              ? filteredBDMs.find((b) => b["BDM ID"] === selectedBDMId)?.["Full Name"]
              : filteredBDMs.length === 1 ? filteredBDMs[0]["Full Name"] : "All BDMs"}
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
                      if (selectedGroup !== null || selectedDealerId !== null) {
                        // If group or dealership is selected, reset all filters
                        handleClearFilters();
                      } else {
                        setSelectedBDMId(null);
                      }
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
                  {filteredBDMs.map((bdm) => (
                    <CommandItem
                      key={bdm["BDM ID"]}
                      value={bdm["Full Name"] || ""}
                      onSelect={() => {
                        setSelectedBDMId(bdm["BDM ID"]);
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
            className="w-[260px] justify-between"
          >
            {selectedGroup || "All Dealer Groups"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="end">
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
        onValueChange={(value) => setSelectedYear(parseInt(value))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder={new Date().getFullYear().toString()} />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Filter */}
      <Select
        value={selectedMonth?.toString() || ""}
        onValueChange={(value) => setSelectedMonth(parseInt(value))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">January</SelectItem>
          <SelectItem value="2">February</SelectItem>
          <SelectItem value="3">March</SelectItem>
          <SelectItem value="4">April</SelectItem>
          <SelectItem value="5">May</SelectItem>
          <SelectItem value="6">June</SelectItem>
          <SelectItem value="7">July</SelectItem>
          <SelectItem value="8">August</SelectItem>
          <SelectItem value="9">September</SelectItem>
          <SelectItem value="10">October</SelectItem>
          <SelectItem value="11">November</SelectItem>
          <SelectItem value="12">December</SelectItem>
        </SelectContent>
      </Select>

      {/* Week Starting Filter */}
      <Select
        value={selectedWeekStarting || "all"}
        onValueChange={(value) => setSelectedWeekStarting(value === "all" ? null : value)}
        disabled={availableWeeks.length === 0}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Week Starting" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Weeks</SelectItem>
          {availableWeeks.map((week) => (
            <SelectItem key={week.date} value={week.date}>
              {week.display}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};
