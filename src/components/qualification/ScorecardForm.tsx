import { useState, useMemo, useEffect } from "react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scorecard } from "@/types/scorecard";
import { useFrameworks } from "@/hooks/useFrameworks";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScorecardFormProps {
  onSubmit: (data: Partial<Scorecard> & { frameworkId?: string }) => void;
  initialData?: Partial<Scorecard>;
  submitLabel?: string;
}

export const ScorecardForm = ({ onSubmit, initialData, submitLabel = "Create Scorecard" }: ScorecardFormProps) => {
  const { frameworks, defaultFramework, isLoading } = useFrameworks();
  const { dealerships } = usePerformanceFilters();
  
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [dealershipSearchOpen, setDealershipSearchOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    dealershipGroup: initialData?.dealershipGroup || "",
    dealershipId: initialData?.dealershipId || null,
    accountManager: initialData?.accountManager || "",
    customerName: initialData?.customerName || "",
    opportunityName: initialData?.opportunityName || "",
    expectedOrderDate: initialData?.expectedOrderDate || "",
    reviewDate: initialData?.reviewDate || new Date().toISOString().split('T')[0],
    frameworkId: defaultFramework?.id || "",
  });

  // Get unique dealer groups sorted by region
  const dealerGroups = useMemo(() => {
    const groups = dealerships;
    const uniqueGroups = [...new Set(groups.map((d) => d["Dealer Group"]).filter(Boolean))];
    
    const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];
    
    return uniqueGroups.sort((a, b) => {
      const regionA = dealerships.find(d => d["Dealer Group"] === a)?.Region || "";
      const regionB = dealerships.find(d => d["Dealer Group"] === b)?.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [dealerships]);

  // Filter dealerships based on selected group
  const filteredDealerships = useMemo(() => {
    let filtered = dealerships;
    
    if (formData.dealershipGroup) {
      filtered = filtered.filter(d => d["Dealer Group"] === formData.dealershipGroup);
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
      
      return (a.Dealership || "").localeCompare(b.Dealership || "");
    });
  }, [dealerships, formData.dealershipGroup]);

  // Reset dealership when group changes
  useEffect(() => {
    if (formData.dealershipGroup && formData.dealershipId) {
      const dealership = dealerships.find(d => d["Dealer ID"] === formData.dealershipId);
      if (!dealership || dealership["Dealer Group"] !== formData.dealershipGroup) {
        setFormData(prev => ({ ...prev, dealershipId: null }));
      }
    }
  }, [formData.dealershipGroup, formData.dealershipId, dealerships]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dealershipGroup">Dealership Group</Label>
          <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={groupSearchOpen}
                className="w-full justify-between mt-1"
              >
                {formData.dealershipGroup || "All Dealer Groups"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-h-[320px] overflow-y-auto p-0" align="start">
              <Command>
                <CommandInput placeholder="Search group..." />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>No group found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setFormData({ ...formData, dealershipGroup: "", dealershipId: null });
                        setGroupSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !formData.dealershipGroup ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Dealer Groups
                    </CommandItem>
                    {dealerGroups.map((group, index) => {
                      const currentRegion = dealerships.find(d => d["Dealer Group"] === group)?.Region;
                      const nextGroup = dealerGroups[index + 1];
                      const nextRegion = nextGroup ? dealerships.find(d => d["Dealer Group"] === nextGroup)?.Region : undefined;
                      const isLastInRegion = currentRegion && currentRegion !== nextRegion && (currentRegion === "Metro" || currentRegion === "Regional" || currentRegion === "Independent");

                      return (
                        <React.Fragment key={group}>
                          <CommandItem
                            value={group}
                            onSelect={() => {
                              setFormData({ ...formData, dealershipGroup: group, dealershipId: null });
                              setGroupSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.dealershipGroup === group ? "opacity-100" : "opacity-0"
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
        </div>

        <div>
          <Label htmlFor="dealership">Dealership</Label>
          <Popover open={dealershipSearchOpen} onOpenChange={setDealershipSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={dealershipSearchOpen}
                className="w-full justify-between mt-1"
              >
                {formData.dealershipId
                  ? filteredDealerships.find((d) => d["Dealer ID"] === formData.dealershipId)?.Dealership
                  : "All Dealerships"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-h-[320px] overflow-y-auto p-0" align="start">
              <Command>
                <CommandInput placeholder="Search dealership..." />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>No dealership found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setFormData({ ...formData, dealershipId: null });
                        setDealershipSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.dealershipId === null ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Dealerships
                    </CommandItem>
                    {filteredDealerships.map((dealer, index) => {
                      const currentRegion = dealer.Region;
                      const nextDealer = filteredDealerships[index + 1];
                      const nextRegion = nextDealer?.Region;
                      const isLastInRegion = currentRegion !== nextRegion && (currentRegion === "Metro" || currentRegion === "Regional" || currentRegion === "Independent");
                      
                      return (
                        <React.Fragment key={dealer["Dealer ID"]}>
                          <CommandItem
                            value={dealer.Dealership || ""}
                            onSelect={() => {
                              setFormData({ ...formData, dealershipId: dealer["Dealer ID"] });
                              setDealershipSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.dealershipId === dealer["Dealer ID"] ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {dealer.Dealership}
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
        </div>

        <div>
          <Label htmlFor="accountManager">Account Manager *</Label>
          <Input
            id="accountManager"
            value={formData.accountManager}
            onChange={(e) => setFormData({ ...formData, accountManager: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="opportunityName">Opportunity Name *</Label>
          <Input
            id="opportunityName"
            value={formData.opportunityName}
            onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="framework">Qualification Framework *</Label>
          <Select
            value={formData.frameworkId}
            onValueChange={(value) => setFormData({ ...formData, frameworkId: value })}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-1 bg-background z-50">
              <SelectValue placeholder="Select framework..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {frameworks.map((framework) => (
                <SelectItem key={framework.id} value={framework.id}>
                  {framework.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="expectedOrderDate">Expected Order Date *</Label>
          <Input
            id="expectedOrderDate"
            type="date"
            value={formData.expectedOrderDate}
            onChange={(e) => setFormData({ ...formData, expectedOrderDate: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="reviewDate">Review Date *</Label>
          <Input
            id="reviewDate"
            type="date"
            value={formData.reviewDate}
            onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
            required
            className="mt-1"
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );
};
