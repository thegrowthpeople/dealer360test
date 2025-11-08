import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, PlusCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <img src={logo} alt="Daimler Truck" className="h-8" />
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-foreground tracking-wide">DAIMLER TRUCK</div>
            <div className="text-xs text-muted-foreground">Australia Pacific</div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/")}
            variant={isActive("/") ? "default" : "ghost"}
            className={cn(
              "gap-2",
              isActive("/") && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Button
            onClick={() => navigate("/new-report")}
            variant={isActive("/new-report") ? "default" : "ghost"}
            className={cn(
              "gap-2",
              isActive("/new-report") && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Report</span>
          </Button>
          <Button
            onClick={() => navigate("/reports")}
            variant={location.pathname.startsWith("/reports") ? "default" : "ghost"}
            className={cn(
              "gap-2",
              location.pathname.startsWith("/reports") && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Reports</span>
          </Button>
        </div>

        {/* User Welcome */}
        <div className="text-sm text-muted-foreground shrink-0 hidden md:block">
          <span>Welcome, </span>
          <span className="font-medium text-foreground">Gary Parker</span>
        </div>
      </div>
    </header>
  );
};
