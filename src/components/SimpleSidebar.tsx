import { Home, TrendingUp, LineChart, BarChart, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/performance", label: "Performance", icon: TrendingUp },
  { path: "/forecast", label: "Forecast", icon: LineChart },
  { path: "/business-plan", label: "Business Plan", icon: BarChart },
];

interface SimpleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SimpleSidebar({ isCollapsed, onToggle }: SimpleSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-border transition-all duration-300 z-50 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between h-16">
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">DEALER MANAGER</span>
            <span className="text-xs text-muted-foreground">Heavy Duty</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 pt-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                active && "bg-primary text-primary-foreground hover:bg-primary/90",
                isCollapsed && "justify-center"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              GP
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Gary Parker</p>
              <p className="text-xs text-muted-foreground truncate">BDM</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
