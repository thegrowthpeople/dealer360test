import { ReactNode, useState } from "react";
import { SimpleSidebar } from "./SimpleSidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface SimpleLayoutProps {
  children: ReactNode;
  headerFilters?: ReactNode;
}

export function SimpleLayout({ children, headerFilters }: SimpleLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SimpleSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header>{headerFilters}</Header>
        <main className="pt-[26px] px-6 pb-6 xl:px-12 xl:pb-12 2xl:px-16 2xl:pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
