import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Filter, X, CalendarIcon, CheckSquare, GitCompare, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterState {
  salesperson: string;
  version: string;
  customer: string;
  showArchived: boolean;
  tags: string[];
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface ScorecardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  salespeople: string[];
  customers: string[];
  versions: number[];
  availableTags: string[];
  bulkSelectionMode?: boolean;
  comparisonMode?: boolean;
  onBulkModeToggle?: () => void;
  onComparisonToggle?: () => void;
  onTagRename?: (oldTag: string) => void;
}

export const ScorecardFilters = ({
  filters,
  onFiltersChange,
  salespeople,
  customers,
  versions,
  availableTags,
  bulkSelectionMode = false,
  comparisonMode = false,
  onBulkModeToggle,
  onComparisonToggle,
  onTagRename,
}: ScorecardFiltersProps) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const activeFilterCount = [
    filters.salesperson,
    filters.customer,
    filters.version !== "latest" ? filters.version : "",
    filters.tags.length > 0 ? "tags" : "",
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const handleReset = () => {
    onFiltersChange({
      salesperson: "",
      customer: "",
      version: "latest",
      showArchived: false,
      tags: [],
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 font-medium"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </Button>
          
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
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
          
          {onBulkModeToggle && onComparisonToggle && (
            <div className="flex gap-2">
              <Button 
                variant={bulkSelectionMode ? "default" : "outline"}
                onClick={onBulkModeToggle}
                size="sm"
                className="gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                {bulkSelectionMode ? "Cancel" : "Bulk"}
              </Button>
              <Button 
                variant={comparisonMode ? "default" : "outline"} 
                onClick={onComparisonToggle}
                size="sm"
                className="gap-2"
              >
                <GitCompare className="w-4 h-4" />
                {comparisonMode ? "Cancel" : "Compare"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Salesperson Filter */}
        <div className="space-y-2">
          <Label htmlFor="salesperson-filter" className="text-sm font-medium">
            Salesperson
          </Label>
          <Select
            value={filters.salesperson}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, salesperson: value })
            }
          >
            <SelectTrigger id="salesperson-filter" className="bg-background h-9 text-sm">
              <SelectValue placeholder="All salespeople" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50">
              <SelectItem value="all">All salespeople</SelectItem>
              {salespeople.map((person) => (
                <SelectItem key={person} value={person}>
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Customer Filter */}
        <div className="space-y-2">
          <Label htmlFor="customer-filter" className="text-sm font-medium">
            Customer Name
          </Label>
          <Select
            value={filters.customer}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, customer: value })
            }
          >
            <SelectTrigger id="customer-filter" className="bg-background h-9 text-sm">
              <SelectValue placeholder="All customers" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50">
              <SelectItem value="all">All customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer} value={customer}>
                  {customer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Version Filter */}
        <div className="space-y-2">
          <Label htmlFor="version-filter" className="text-sm font-medium">
            Version
          </Label>
          <Select
            value={filters.version}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, version: value })
            }
          >
            <SelectTrigger id="version-filter" className="bg-background h-9 text-sm">
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
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tags</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9 text-sm">
                <span className="text-sm">
                  {filters.tags.length > 0 ? `${filters.tags.length} selected` : "All tags"}
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
        </div>

        {/* Date Range Filter - Combined */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Range</Label>
          <div className="flex gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 justify-start text-left font-normal bg-background text-xs",
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
                    "flex-1 justify-start text-left font-normal bg-background text-xs",
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
        </div>
      </div>
        </>
      )}
    </Card>
  );
};
