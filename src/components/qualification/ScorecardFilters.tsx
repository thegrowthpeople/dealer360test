import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, CheckSquare, GitCompare, Edit2, RotateCcw, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { Label } from "@/components/ui/label";

export interface FilterState {
  version: string;
  showArchived: boolean;
  showOnlyPinned: boolean;
  tags: string[];
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  accountManager: string | null;
  customer: string | null;
  modifiedRange: string | null;
}

interface ScorecardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  versions: number[];
  availableTags: string[];
  accountManagers: string[];
  customers: string[];
  onTagRename?: (oldTag: string) => void;
}

export const ScorecardFilters = ({
  filters,
  onFiltersChange,
  versions,
  availableTags,
  accountManagers,
  customers,
  onTagRename,
}: ScorecardFiltersProps) => {
  const {
    selectedBDMId,
    setSelectedBDMId,
    selectedGroup,
    setSelectedGroup,
    selectedDealerId,
    setSelectedDealerId,
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
    setSelectedBDMId(null);
    setSelectedGroup(null);
    setSelectedDealerId(null);
    onFiltersChange({
      version: "latest",
      showArchived: false,
      showOnlyPinned: false,
      tags: [],
      dateFrom: undefined,
      dateTo: undefined,
      accountManager: null,
      customer: null,
      modifiedRange: null,
    });
  };

  const hasActiveFilters = 
    selectedBDMId !== null || 
    selectedGroup !== null || 
    selectedDealerId !== null ||
    filters.version !== "latest" ||
    filters.showOnlyPinned ||
    filters.tags.length > 0 ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.accountManager !== null ||
    filters.customer !== null ||
    filters.modifiedRange !== null;

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  // Get BDMs associated with selected dealership or group
  const filteredBDMs = React.useMemo(() => {
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
  React.useEffect(() => {
    if ((selectedDealerId !== null || selectedGroup !== null) && filteredBDMs.length === 1) {
      setSelectedBDMId(filteredBDMs[0]["BDM ID"]);
    }
  }, [selectedDealerId, selectedGroup, filteredBDMs, setSelectedBDMId]);

  const filteredDealerGroups = React.useMemo(() => {
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

  const filteredDealerships = React.useMemo(() => {
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
    
    // Sort by region first, then by dealership name
    const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];
    return filtered.sort((a, b) => {
      const regionA = a.Region || "";
      const regionB = b.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      const regionCompare = (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      
      if (regionCompare !== 0) return regionCompare;
      
      // Within same region, sort alphabetically by dealership name
      return (a.Dealership || "").localeCompare(b.Dealership || "");
    });
  }, [dealerships, selectedBDMId, selectedGroup, bdms]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* BDM Filter */}
      <Popover open={bdmSearchOpen} onOpenChange={setBdmSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={bdmSearchOpen}
            className="w-[200px] justify-between h-9 text-sm"
          >
            {selectedBDMId !== null
              ? bdms.find((b) => b["BDM ID"] === selectedBDMId)?.["Full Name"]
              : "All BDMs"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-background border border-border shadow-lg z-50">
          <Command>
            <CommandInput placeholder="Search BDM..." />
            <CommandList>
              <CommandEmpty>No BDM found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-bdms"
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
                {filteredBDMs.map((bdm) => (
                  <CommandItem
                    key={bdm["BDM ID"]}
                    value={bdm["Full Name"]}
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
            className="w-[200px] justify-between h-9 text-sm"
          >
            {selectedGroup || "All Dealer Groups"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-background border border-border shadow-lg z-50">
          <Command>
            <CommandInput placeholder="Search group..." />
            <CommandList>
              <CommandEmpty>No dealer group found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-groups"
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
                  const currentRegion = dealerships.find(d => d["Dealer Group"] === group)?.Region;
                  const nextGroup = filteredDealerGroups[index + 1];
                  const nextRegion = nextGroup ? dealerships.find(d => d["Dealer Group"] === nextGroup)?.Region : undefined;
                  const isLastInRegion = currentRegion && currentRegion !== nextRegion && (currentRegion === "Metro" || currentRegion === "Regional" || currentRegion === "Independent");

                  return (
                    <React.Fragment key={group}>
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
                      {isLastInRegion && <CommandSeparator className="my-1" />}
                    </React.Fragment>
                  );
                })}
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
            className="w-[200px] justify-between h-9 text-sm"
          >
            {selectedDealerId !== null
              ? dealerships.find((d) => d["Dealer ID"] === selectedDealerId)?.Dealership
              : "All Dealerships"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-background border border-border shadow-lg z-50">
          <Command>
            <CommandInput placeholder="Search dealership..." />
            <CommandList>
              <CommandEmpty>No dealership found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-dealerships"
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
                {filteredDealerships.map((dealership, index) => {
                  const currentRegion = dealership.Region;
                  const nextDealership = filteredDealerships[index + 1];
                  const nextRegion = nextDealership?.Region;
                  const isLastInRegion = currentRegion !== nextRegion && (currentRegion === "Metro" || currentRegion === "Regional" || currentRegion === "Independent");
                  
                  return (
                    <React.Fragment key={dealership["Dealer ID"]}>
                      <CommandItem
                        value={dealership.Dealership}
                        onSelect={() => {
                          setSelectedDealerId(dealership["Dealer ID"]);
                          setDealershipSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDealerId === dealership["Dealer ID"] ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {dealership.Dealership}
                      </CommandItem>
                      {isLastInRegion && (
                        <CommandSeparator className="my-1" />
                      )}
                    </React.Fragment>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Account Manager Filter */}
      <Select
        value={filters.accountManager || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, accountManager: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="All Account Managers" />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg z-50">
          <SelectItem value="all">All Account Managers</SelectItem>
          {accountManagers.map((manager) => (
            <SelectItem key={manager} value={manager}>
              {manager}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Customer Filter */}
      <Select
        value={filters.customer || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, customer: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="All Customers" />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg z-50">
          <SelectItem value="all">All Customers</SelectItem>
          {customers.map((customer) => (
            <SelectItem key={customer} value={customer}>
              {customer}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Modified Range Filter */}
      <Select
        value={filters.modifiedRange || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, modifiedRange: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Modified" />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg z-50">
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="last7days">Last 7 Days</SelectItem>
          <SelectItem value="last30days">Last 30 Days</SelectItem>
          <SelectItem value="last90days">Last 90 Days</SelectItem>
        </SelectContent>
      </Select>

      {/* Version Filter */}
      <Select
        value={filters.version}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, version: value })
        }
      >
        <SelectTrigger className="w-[150px] h-9 text-sm">
          <SelectValue placeholder="Latest" />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg z-50">
          <SelectItem value="latest">Latest</SelectItem>
          <SelectItem value="all">All</SelectItem>
          {versions.sort((a, b) => b - a).map((version) => (
            <SelectItem key={version} value={version.toString()}>
              v{version}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tags Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[150px] justify-between h-9 text-sm">
            <span className="text-sm">
              {filters.tags.length > 0 ? `${filters.tags.length} tags` : "All tags"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-background border border-border shadow-lg z-50">
          {availableTags.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No tags available</div>
          ) : (
            availableTags.map((tag) => (
              <div key={tag} className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm">
                <DropdownMenuCheckboxItem
                  checked={filters.tags.includes(tag)}
                  onCheckedChange={() => handleTagToggle(tag)}
                  className="flex-1 cursor-pointer px-0"
                >
                  {tag}
                </DropdownMenuCheckboxItem>
                {onTagRename && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagRename(tag);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Range Filter */}
      <div className="flex gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[100px] justify-start text-left font-normal h-9 text-xs",
                !filters.dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {filters.dateFrom ? (
                format(filters.dateFrom, "MMM d")
              ) : (
                <span>From</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) =>
                onFiltersChange({ ...filters, dateFrom: date })
              }
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[100px] justify-start text-left font-normal h-9 text-xs",
                !filters.dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {filters.dateTo ? (
                format(filters.dateTo, "MMM d")
              ) : (
                <span>To</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) =>
                onFiltersChange({ ...filters, dateTo: date })
              }
              initialFocus
              disabled={(date) =>
                filters.dateFrom ? date < filters.dateFrom : false
              }
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Show Archived Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="show-archived"
          checked={filters.showArchived}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, showArchived: checked })
          }
        />
        <Label htmlFor="show-archived" className="text-sm font-medium cursor-pointer whitespace-nowrap">
          Show archived
        </Label>
      </div>

      {/* Show Only Pinned Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="show-only-pinned"
          checked={filters.showOnlyPinned}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, showOnlyPinned: checked })
          }
        />
        <Label htmlFor="show-only-pinned" className="text-sm font-medium cursor-pointer whitespace-nowrap">
          Show only pinned
        </Label>
      </div>


      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};
