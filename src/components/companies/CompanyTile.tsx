import { Company } from "@/types/company";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CompanyTileProps {
  company: Company;
  onClick: (company: Company) => void;
}

export const CompanyTile = ({ company, onClick }: CompanyTileProps) => {
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
    <Card 
      className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] animate-fade-in"
      onClick={() => onClick(company)}
    >
      <div className="space-y-3">
        {/* Header with icon and badges */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(company.status)}`} />
          </div>
          <div className="flex gap-1">
            <Badge variant={getTypeVariant(company.type)} className="text-xs">
              {company.type}
            </Badge>
          </div>
        </div>

        {/* Company name and dealership */}
        <div>
          <h3 className="font-semibold text-foreground text-lg mb-1">{company.accountName}</h3>
          <p className="text-sm text-muted-foreground">{company.dealershipName}</p>
        </div>

        {/* Segment badge */}
        <div>
          <Badge variant="outline" className="text-xs">
            {company.segment}
          </Badge>
        </div>

        {/* Account Manager */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{company.accountManagerName}</span>
        </div>

        {/* Last contact date */}
        {company.lastContactDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(company.lastContactDate), 'EEE d MMM')}</span>
          </div>
        )}

        {/* Tags */}
        {company.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {company.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {company.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{company.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
