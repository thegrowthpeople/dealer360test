import { useState } from "react";
import { Company } from "@/types/company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Users, Mail, Phone, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StakeholdersSectionProps {
  company: Company;
  isExpanded?: boolean;
}

export const StakeholdersSection = ({ company, isExpanded = false }: StakeholdersSectionProps) => {
  const [isOpen, setIsOpen] = useState(isExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Stakeholders
                <span className="text-sm font-normal text-muted-foreground">
                  ({company.stakeholders.length})
                </span>
              </CardTitle>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="transition-all duration-350 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <CardContent className="space-y-4">
            {company.stakeholders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No stakeholders added</p>
              </div>
            ) : (
              company.stakeholders.map((stakeholder) => (
                <Card key={stakeholder.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    {/* Name and primary contact */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">
                              {stakeholder.salutation} {stakeholder.firstName} {stakeholder.lastName}
                            </h4>
                            {stakeholder.isPrimaryContact && (
                              <Badge variant="default" className="text-xs gap-1">
                                <Star className="w-3 h-3" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{stakeholder.jobTitle}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-2">
                      {stakeholder.email && (
                        <a 
                          href={`mailto:${stakeholder.email}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {stakeholder.email}
                        </a>
                      )}
                      {stakeholder.phone && (
                        <a 
                          href={`tel:${stakeholder.phone}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {stakeholder.phone}
                        </a>
                      )}
                    </div>

                    {/* Notes section */}
                    {(stakeholder.likes || stakeholder.dislikes || stakeholder.thingsToRemember) && (
                      <div className="pt-3 border-t space-y-2">
                        {stakeholder.likes && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Likes: </span>
                            <span className="text-sm text-foreground">{stakeholder.likes}</span>
                          </div>
                        )}
                        {stakeholder.dislikes && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Dislikes: </span>
                            <span className="text-sm text-foreground">{stakeholder.dislikes}</span>
                          </div>
                        )}
                        {stakeholder.thingsToRemember && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Remember: </span>
                            <span className="text-sm text-foreground">{stakeholder.thingsToRemember}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
