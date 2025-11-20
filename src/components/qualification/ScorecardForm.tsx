import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Scorecard } from "@/types/scorecard";

interface ScorecardFormProps {
  onSubmit: (data: Partial<Scorecard>) => void;
  initialData?: Partial<Scorecard>;
  submitLabel?: string;
}

export const ScorecardForm = ({ onSubmit, initialData, submitLabel = "Create Scorecard" }: ScorecardFormProps) => {
  const [formData, setFormData] = useState({
    accountManager: initialData?.accountManager || "",
    customerName: initialData?.customerName || "",
    opportunityName: initialData?.opportunityName || "",
    expectedOrderDate: initialData?.expectedOrderDate || "",
    reviewDate: initialData?.reviewDate || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
