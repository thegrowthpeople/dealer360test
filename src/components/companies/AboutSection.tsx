import { useState } from "react";
import { Company } from "@/types/company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Globe, Linkedin, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutSectionProps {
  company: Company;
  isExpanded?: boolean;
}

export const AboutSection = ({ company, isExpanded = true }: AboutSectionProps) => {
  const [isOpen, setIsOpen] = useState(isExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                About
              </CardTitle>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="transition-all duration-350 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <CardContent className="space-y-4">
            {/* Company description */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Company Description</h4>
              <p className="text-foreground">{company.about}</p>
            </div>

            {/* Industry application */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Industry Application</h4>
              <p className="text-foreground">{company.industryApplication}</p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-3">
              {company.website && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                </Button>
              )}
              
              {company.linkedinUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
