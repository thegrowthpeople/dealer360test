import { useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { PerformanceFilters } from "./PerformanceFilters";

export const Header = () => {
  const location = useLocation();
  const isPerformancePage = location.pathname === "/performance";

  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="px-6 xl:px-12 2xl:px-16 h-full flex items-center justify-between gap-6">
        {/* Filters - only show on Performance page */}
        {isPerformancePage ? (
          <PerformanceFilters />
        ) : (
          <div className="flex-1" />
        )}
        
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
