import { Company } from "@/types/company";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, X, Edit2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CompanyHeaderProps {
  company: Company;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CompanyHeader = ({ company, onClose, onEdit, onDelete }: CompanyHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Inactive': return 'bg-muted';
      case 'On Hold': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getTypeVariant = (type: string) => {
    return type === 'Existing' ? 'default' : 'secondary';
  };

  return (
    <div className="flex items-start justify-between p-6 border-b bg-card animate-fade-in">
      <div className="flex items-start gap-4 flex-1">
        {/* Company icon */}
        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-8 h-8 text-primary" />
        </div>

        {/* Company info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{company.accountName}</h1>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(company.status)}`} />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getTypeVariant(company.type)}>
              {company.type}
            </Badge>
            <Badge variant="outline">
              {company.segment}
            </Badge>
            <Badge variant="secondary">
              {company.industryApplication}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
          <Edit2 className="w-4 h-4" />
          Edit
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover z-50">
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              Delete Company
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
