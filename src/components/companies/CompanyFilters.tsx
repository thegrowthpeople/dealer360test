import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

interface CompanyFiltersProps {
  selectedBdmId: number | null;
  selectedDealerGroup: string;
  selectedDealershipId: number | null;
  selectedType: string;
  selectedSegment: string;
  searchQuery: string;
  onBdmChange: (value: number | null) => void;
  onDealerGroupChange: (value: string) => void;
  onDealershipChange: (value: number | null) => void;
  onTypeChange: (value: string) => void;
  onSegmentChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const CompanyFilters = ({
  selectedBdmId,
  selectedDealerGroup,
  selectedDealershipId,
  selectedType,
  selectedSegment,
  searchQuery,
  onBdmChange,
  onDealerGroupChange,
  onDealershipChange,
  onTypeChange,
  onSegmentChange,
  onSearchChange,
  onClearFilters,
  hasActiveFilters
}: CompanyFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-fade-in">
      <div className="relative w-[250px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={selectedBdmId?.toString() || "all"} onValueChange={(v) => onBdmChange(v === "all" ? null : parseInt(v))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All BDMs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All BDMs</SelectItem>
          <SelectItem value="1">BDM 1</SelectItem>
          <SelectItem value="2">BDM 2</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedDealerGroup || "all"} onValueChange={(v) => onDealerGroupChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Dealer Groups" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Dealer Groups</SelectItem>
          <SelectItem value="Metro Group">Metro Group</SelectItem>
          <SelectItem value="Regional Group">Regional Group</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedDealershipId?.toString() || "all"} onValueChange={(v) => onDealershipChange(v === "all" ? null : parseInt(v))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Dealerships" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Dealerships</SelectItem>
          <SelectItem value="1">City Trucks</SelectItem>
          <SelectItem value="2">Highway Motors</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedType || "all"} onValueChange={(v) => onTypeChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Existing">Existing</SelectItem>
          <SelectItem value="Prospect">Prospect</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedSegment || "all"} onValueChange={(v) => onSegmentChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Segments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Segments</SelectItem>
          <SelectItem value="Owner Operator">Owner Operator</SelectItem>
          <SelectItem value="Small Business">Small Business</SelectItem>
          <SelectItem value="Small Fleet">Small Fleet</SelectItem>
          <SelectItem value="Corporate Fleet">Corporate Fleet</SelectItem>
          <SelectItem value="Government Fleet">Government Fleet</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-2">
          <X className="w-4 h-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};
