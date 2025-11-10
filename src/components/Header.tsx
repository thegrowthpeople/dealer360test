import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";

export const Header = () => {
  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <img src={logo} alt="Daimler Truck" className="h-8" />
        </div>

        {/* User Info */}
        <div className="text-sm shrink-0 hidden md:block">
          <span className="font-medium text-foreground">Gary Parker</span>
        </div>
      </div>
    </header>
  );
};
