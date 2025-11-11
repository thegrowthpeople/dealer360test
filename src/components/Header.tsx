import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="px-6 xl:px-12 2xl:px-16 h-full flex items-center justify-between">
        {/* Title */}
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-lg tracking-wide">DEALER MANAGER</span>
          <span className="text-xs text-muted-foreground">Heavy Duty</span>
        </div>
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};
