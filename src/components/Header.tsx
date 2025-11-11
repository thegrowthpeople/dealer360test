import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";
import { PerformanceFilters } from "./PerformanceFilters";

export const Header = () => {
  const location = useLocation();
  const isPerformancePage = location.pathname === "/performance";

  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="px-6 xl:px-12 2xl:px-16 h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <a href="https://www.daimlertruck.com.au/" target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="Daimler Truck" className="h-8 dark:invert transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer" />
          </a>
        </div>
        
        {/* Performance Filters - with animation */}
        {isPerformancePage && <PerformanceFilters />}
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};
