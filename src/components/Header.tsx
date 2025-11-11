import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";
import { PerformanceFilters } from "./PerformanceFilters";
import { useLocation } from "react-router-dom";

export const Header = () => {
  const location = useLocation();
  const isPerformancePage = location.pathname === "/performance";

  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="px-6 xl:px-12 2xl:px-16 h-full flex items-center justify-between gap-6">
        {/* Left side - Filters */}
        <div className="flex items-center gap-4">
          {isPerformancePage && <PerformanceFilters />}
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* Title */}
          <div className="flex flex-col items-end">
            <span className="font-bold text-foreground text-lg tracking-wide">DEALER MANAGER</span>
            <span className="text-xs text-muted-foreground">Heavy Duty</span>
          </div>
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
