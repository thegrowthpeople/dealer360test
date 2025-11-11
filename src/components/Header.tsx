import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

export const Header = () => {
  const handleExportPDF = () => {
    // Trigger browser print dialog which can save as PDF
    window.print();
  };

  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="px-6 xl:px-12 2xl:px-16 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <a href="https://www.daimlertruck.com.au/" target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="Daimler Truck" className="h-8 dark:invert transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer" />
          </a>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportPDF}
            title="Export to PDF"
          >
            <Download className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
