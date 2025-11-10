import { ReactNode, useState } from "react";
import { SimpleSidebar } from "./SimpleSidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface SimpleLayoutProps {
  children: ReactNode;
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
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
        <Header />
        <main className="p-6 xl:p-12 2xl:p-16">
          {children}
        </main>
      </div>
    </div>
  );
}
