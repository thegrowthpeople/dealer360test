import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Company } from "@/types/company";
import { toast } from "sonner";

interface NewCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
}

export const NewCompanyDialog = ({ open, onOpenChange, onSave }: NewCompanyDialogProps) => {
  const [formData, setFormData] = useState({
    accountName: '',
    dealershipId: null as number | null,
    dealershipName: '',
    dealerGroup: '',
    accountManagerId: null as number | null,
    accountManagerName: '',
    bdmId: 1 as number | null,
    about: '',
    industryApplication: 'Construction' as const,
    type: 'Prospect' as const,
    segment: 'Small Business' as const,
    existingFleet: [],
    website: '',
    linkedinUrl: '',
    stakeholders: [],
    status: 'Active' as const,
    tags: [] as string[],
    estimatedValue: 0
  });

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
      dealershipId: null,
      dealershipName: '',
      dealerGroup: '',
      accountManagerId: null,
      accountManagerName: '',
      bdmId: 1,
      about: '',
      industryApplication: 'Construction',
      type: 'Prospect',
      segment: 'Small Business',
      existingFleet: [],
      website: '',
      linkedinUrl: '',
      stakeholders: [],
      status: 'Active',
      tags: [],
      estimatedValue: 0
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

          <div className="space-y-2">
            <Label htmlFor="dealership">Dealership</Label>
            <Select 
              value={formData.dealershipId?.toString() || ''} 
              onValueChange={(value) => {
                const id = parseInt(value);
                setFormData({ 
                  ...formData, 
                  dealershipId: id,
                  dealershipName: id === 1 ? 'City Trucks' : 'Highway Motors',
                  dealerGroup: id === 1 ? 'Metro Group' : 'Regional Group'
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dealership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">City Trucks</SelectItem>
                <SelectItem value="2">Highway Motors</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label htmlFor="estimatedValue">Estimated Value</Label>
            <Input
              id="estimatedValue"
              type="number"
              value={formData.estimatedValue}
              onChange={(e) => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
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
