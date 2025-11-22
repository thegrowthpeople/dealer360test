import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scorecard } from "@/types/scorecard";
import { useFrameworks } from "@/hooks/useFrameworks";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";

interface ScorecardFormProps {
  onSubmit: (data: Partial<Scorecard> & { frameworkId?: string }) => void;
  initialData?: Partial<Scorecard>;
  submitLabel?: string;
}

export const ScorecardForm = ({ onSubmit, initialData, submitLabel = "Create Scorecard" }: ScorecardFormProps) => {
  const { frameworks, defaultFramework, isLoading } = useFrameworks();
  const { dealerships } = usePerformanceFilters();
  
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

  // Get unique dealer groups
  const dealerGroups = useMemo(() => {
    const groups = dealerships.map(d => d["Dealer Group"]).filter(Boolean);
    return [...new Set(groups)].sort();
  }, [dealerships]);

  // Filter dealerships based on selected group
  const filteredDealerships = useMemo(() => {
    if (!formData.dealershipGroup) {
      return dealerships;
    }
    return dealerships.filter(d => d["Dealer Group"] === formData.dealershipGroup);
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
          <Select
            value={formData.dealershipGroup}
            onValueChange={(value) => setFormData({ ...formData, dealershipGroup: value })}
          >
            <SelectTrigger className="mt-1 bg-background">
              <SelectValue placeholder="Select group..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="">All Groups</SelectItem>
              {dealerGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dealership">Dealership</Label>
          <Select
            value={formData.dealershipId?.toString() || ""}
            onValueChange={(value) => setFormData({ ...formData, dealershipId: value ? parseInt(value) : null })}
          >
            <SelectTrigger className="mt-1 bg-background">
              <SelectValue placeholder="Select dealership..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="">All Dealerships</SelectItem>
              {filteredDealerships.map((dealer) => (
                <SelectItem key={dealer["Dealer ID"]} value={dealer["Dealer ID"].toString()}>
                  {dealer.Dealership}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
