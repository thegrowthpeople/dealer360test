import { useState, useMemo, useEffect } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Company } from "@/types/company";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NewCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
}

export const NewCompanyDialog = ({ open, onOpenChange, onSave }: NewCompanyDialogProps) => {
  const { bdmId } = useAuth();
  
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [dealershipSearchOpen, setDealershipSearchOpen] = useState(false);
  
  // Fetch dealerships from Supabase
  const { data: dealerships = [] } = useQuery({
    queryKey: ['dealerships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Dealerships')
        .select('*')
        .order('Dealership', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const [formData, setFormData] = useState({
    accountName: '',
    dealerGroup: '',
    dealershipId: null as number | null,
    dealershipName: '',
    accountManagerId: null as number | null,
    accountManagerName: '',
    bdmId: bdmId || 1,
    about: '',
    industryApplication: 'Construction' as const,
    type: 'Prospect' as const,
    segment: 'Small Business' as const,
    existingFleet: [],
    website: '',
    linkedinUrl: '',
    stakeholders: [],
    status: 'Active' as const,
    tags: [] as string[]
  });

  // Get unique dealer groups sorted by region
  const dealerGroups = useMemo(() => {
    const groups = dealerships;
    const uniqueGroups = [...new Set(groups.map((d: any) => d["Dealer Group"]).filter(Boolean))];
    
    const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];
    
    return uniqueGroups.sort((a, b) => {
      const regionA = dealerships.find((d: any) => d["Dealer Group"] === a)?.Region || "";
      const regionB = dealerships.find((d: any) => d["Dealer Group"] === b)?.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [dealerships]);

  // Filter dealerships based on selected group
  const filteredDealerships = useMemo(() => {
    let filtered = dealerships;
    
    if (formData.dealerGroup) {
      filtered = filtered.filter((d: any) => d["Dealer Group"] === formData.dealerGroup);
    }

    // Sort by region first, then by dealership name
    const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];
    return filtered.sort((a: any, b: any) => {
      const regionA = a.Region || "";
      const regionB = b.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      const regionCompare = (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      
      if (regionCompare !== 0) return regionCompare;
      
      return (a.Dealership || "").localeCompare(b.Dealership || "");
    });
  }, [dealerships, formData.dealerGroup]);

  // Reset dealership when group changes
  useEffect(() => {
    if (formData.dealerGroup && formData.dealershipId) {
      const dealership = dealerships.find((d: any) => d["Dealer ID"] === formData.dealershipId);
      if (!dealership || dealership["Dealer Group"] !== formData.dealerGroup) {
        setFormData(prev => ({ ...prev, dealershipId: null, dealershipName: '' }));
      }
    }
  }, [formData.dealerGroup, formData.dealershipId, dealerships]);

  const handleSubmit = () => {
    if (!formData.accountName) {
      toast.error('Please enter a company name');
      return;
    }

    onSave(formData);
    toast.success('Company created successfully');
    onOpenChange(false);
    
    // Reset form
    setFormData({
      accountName: '',
      dealerGroup: '',
      dealershipId: null,
      dealershipName: '',
      accountManagerId: null,
      accountManagerName: '',
      bdmId: bdmId || 1,
      about: '',
      industryApplication: 'Construction',
      type: 'Prospect',
      segment: 'Small Business',
      existingFleet: [],
      website: '',
      linkedinUrl: '',
      stakeholders: [],
      status: 'Active',
      tags: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
          <DialogDescription>
            Add a new company to your account management system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Information */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Company Name *</Label>
            <Input
              id="accountName"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="Enter company name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Existing">Existing</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Segment *</Label>
              <Select value={formData.segment} onValueChange={(value: any) => setFormData({ ...formData, segment: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner Operator">Owner Operator</SelectItem>
                  <SelectItem value="Small Business">Small Business</SelectItem>
                  <SelectItem value="Small Fleet">Small Fleet</SelectItem>
                  <SelectItem value="Corporate Fleet">Corporate Fleet</SelectItem>
                  <SelectItem value="Government Fleet">Government Fleet</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dealerGroup">Dealership Group</Label>
            <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={groupSearchOpen}
                  className="w-full justify-between"
                >
                  {formData.dealerGroup || "All Dealer Groups"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full max-h-[320px] overflow-y-auto p-0"
                align="start"
                onWheel={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput placeholder="Search group..." />
                  <CommandList>
                    <CommandEmpty>No group found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setFormData({ ...formData, dealerGroup: "", dealershipId: null, dealershipName: '' });
                          setGroupSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.dealerGroup ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Dealer Groups
                      </CommandItem>
                      {dealerGroups.map((group, index) => {
                        const currentRegion = dealerships.find((d: any) => d["Dealer Group"] === group)?.Region;
                        const nextGroup = dealerGroups[index + 1];
                        const nextRegion = nextGroup ? dealerships.find((d: any) => d["Dealer Group"] === nextGroup)?.Region : undefined;
                        const isLastInRegion = currentRegion && currentRegion !== nextRegion && (currentRegion === "Metro" || currentRegion === "Regional" || currentRegion === "Independent");

                        return (
                          <React.Fragment key={group}>
                            <CommandItem
                              value={group}
                              onSelect={() => {
                                setFormData({ ...formData, dealerGroup: group, dealershipId: null, dealershipName: '' });
                                setGroupSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.dealerGroup === group ? "opacity-100" : "opacity-0"
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

          <div className="space-y-2">
            <Label htmlFor="dealership">Dealership</Label>
            <Popover open={dealershipSearchOpen} onOpenChange={setDealershipSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={dealershipSearchOpen}
                  className="w-full justify-between"
                >
                  {formData.dealershipId
                    ? filteredDealerships.find((d: any) => d["Dealer ID"] === formData.dealershipId)?.Dealership
                    : "All Dealerships"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full max-h-[320px] overflow-y-auto p-0"
                align="start"
                onWheel={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput placeholder="Search dealership..." />
                  <CommandList>
                    <CommandEmpty>No dealership found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setFormData({ ...formData, dealershipId: null, dealershipName: '' });
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
                      {filteredDealerships.map((dealer: any, index) => {
                        const currentRegion = dealer.Region;
                        const nextDealer = filteredDealerships[index + 1];
                        const nextRegion = nextDealer?.Region;
                        const isLastInRegion = currentRegion !== nextRegion && (currentRegion === "Metro" || currentRegion === "Regional" || currentRegion === "Independent");
                        
                        return (
                          <React.Fragment key={dealer["Dealer ID"]}>
                            <CommandItem
                              value={dealer.Dealership || ""}
                              onSelect={() => {
                                setFormData({ 
                                  ...formData, 
                                  dealershipId: dealer["Dealer ID"],
                                  dealershipName: dealer.Dealership,
                                  dealerGroup: dealer["Dealer Group"] || formData.dealerGroup
                                });
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountManager">Account Manager</Label>
            <Input
              id="accountManager"
              value={formData.accountManagerName}
              onChange={(e) => setFormData({ ...formData, accountManagerName: e.target.value })}
              placeholder="Enter account manager name"
            />
          </div>

          {/* Company Details */}
          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="What does this company do?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryApplication">Industry Application</Label>
            <Select value={formData.industryApplication} onValueChange={(value: any) => setFormData({ ...formData, industryApplication: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Mining">Mining</SelectItem>
                <SelectItem value="Logistics">Logistics</SelectItem>
                <SelectItem value="Waste Management">Waste Management</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Government">Government</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Company
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
