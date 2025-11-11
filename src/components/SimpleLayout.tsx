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
        <main className="pt-[26px] px-6 pb-6 xl:px-12 xl:pb-12 2xl:px-16 2xl:pb-16">
          {children}
        </main>
      </div>
      
      {/* Print-only footer that appears on every page */}
      <div className="print-footer hidden">
        STRICTLY INTERNAL USE - PRIVATE &amp; CONFIDENTIAL
      </div>
    </div>
  );
}
