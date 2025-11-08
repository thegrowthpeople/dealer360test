import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ComingSoon = ({ icon: Icon, title, description }: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>
        <div className="pt-4">
          <Button onClick={() => navigate("/")} variant="default">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
