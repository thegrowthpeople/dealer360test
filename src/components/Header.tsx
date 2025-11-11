import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="px-6 xl:px-12 2xl:px-16 h-full flex items-center justify-end gap-4">
        {/* Logo */}
        <a href="https://www.daimlertruck.com.au/" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="Daimler Truck" className="h-8 dark:invert transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer" />
        </a>
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};
