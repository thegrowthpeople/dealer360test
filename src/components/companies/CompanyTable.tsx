import { useState } from "react";
import { Company } from "@/types/company";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye } from "lucide-react";
import { format } from "date-fns";

interface CompanyTableProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
}

type SortField = 'accountName' | 'type' | 'segment' | 'dealershipName' | 'accountManagerName' | 'lastContactDate' | 'status';
type SortDirection = 'asc' | 'desc';

export const CompanyTable = ({ companies, onCompanyClick }: CompanyTableProps) => {
  const [sortField, setSortField] = useState<SortField>('accountName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

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
    <div className="rounded-md border animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort('accountName')} className="gap-1">
                Company Name <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort('type')} className="gap-1">
                Type <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort('segment')} className="gap-1">
                Segment <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort('dealershipName')} className="gap-1">
                Dealership <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort('accountManagerName')} className="gap-1">
                Account Manager <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort('lastContactDate')} className="gap-1">
                Last Contact <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort('status')} className="gap-1">
                Status <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompanies.map((company) => (
            <TableRow 
              key={company.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onCompanyClick(company)}
            >
              <TableCell className="font-medium">{company.accountName}</TableCell>
              <TableCell>
                <Badge variant={getTypeVariant(company.type)} className="text-xs">
                  {company.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {company.segment}
                </Badge>
              </TableCell>
              <TableCell>{company.dealershipName}</TableCell>
              <TableCell>{company.accountManagerName}</TableCell>
              <TableCell>
                {company.lastContactDate 
                  ? format(new Date(company.lastContactDate), 'EEE d MMM')
                  : '-'
                }
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(company.status)}`} />
                  <span className="text-sm">{company.status}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompanyClick(company);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
