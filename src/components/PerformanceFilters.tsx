import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";

export const PerformanceFilters = () => {
  const filters = usePerformanceFilters();
  
  if (!filters) return null;

  const {
    bdms,
    filteredDealerGroups,
    filteredDealerships,
    availableYears,
    selectedBDMId,
    selectedGroup,
    selectedDealerId,
    selectedYear,
    setSelectedBDMId,
    setSelectedGroup,
    setSelectedDealerId,
    setSelectedYear,
    bdmSearchOpen,
    setBdmSearchOpen,
    groupSearchOpen,
    setGroupSearchOpen,
    dealershipSearchOpen,
    setDealershipSearchOpen,
  } = filters;

  return (
    <div className="flex items-center gap-3">
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
        <PopoverContent className="w-[180px] p-0 bg-popover z-50" align="start">
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
        <PopoverContent className="w-[180px] p-0 bg-popover z-50" align="start">
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
        <PopoverContent className="w-[180px] p-0 bg-popover z-50" align="start">
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

      {/* Year Filter */}
      <Select
        value={selectedYear?.toString() || "all"}
        onValueChange={(value) => {
          setSelectedYear(value === "all" ? null : parseInt(value));
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Years" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
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
