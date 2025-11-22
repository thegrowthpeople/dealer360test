import { useState } from "react";
import { Company } from "@/types/company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Truck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FleetSectionProps {
  company: Company;
  isExpanded?: boolean;
}

export const FleetSection = ({ company, isExpanded = false }: FleetSectionProps) => {
  const [isOpen, setIsOpen] = useState(isExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Existing Fleet
                <span className="text-sm font-normal text-muted-foreground">
                  ({company.existingFleet.length} items)
                </span>
              </CardTitle>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="transition-all duration-350 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <CardContent>
            {company.existingFleet.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No fleet information available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Average Age (years)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.existingFleet.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.brand}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.averageAge}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
