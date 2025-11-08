import { Card } from "@/components/ui/card";
import { User, Mail, Phone } from "lucide-react";

interface BDM {
  "BDM ID": number;
  "Full Name": string | null;
  eMail: string | null;
  "Phone Number": string | null;
}

interface BDMInfoProps {
  bdm: BDM | null;
}

export const BDMInfo = ({ bdm }: BDMInfoProps) => {
  if (!bdm) return null;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{bdm["Full Name"]}</h3>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            {bdm.eMail && (
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{bdm.eMail}</span>
              </div>
            )}
            {bdm["Phone Number"] && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{bdm["Phone Number"]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
