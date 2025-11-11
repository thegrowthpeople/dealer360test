import { Home, TrendingUp, Search, Target, ChevronLeft, ChevronRight, Truck, Settings } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserBDM } from "@/hooks/useUserBDM";

const menuItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/performance", label: "Performance", icon: TrendingUp },
  { path: "/forecast", label: "Forecast", icon: Search },
  { path: "/business-plan", label: "Business Plan", icon: Target },
  { path: "/dealerships", label: "Dealerships", icon: Truck },
];

interface SimpleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SimpleSidebar({ isCollapsed, onToggle }: SimpleSidebarProps) {
  const location = useLocation();
  const { isAdmin } = usePermissions();
  const { displayName, displayTitle, initials } = useUserBDM();

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
        <div className={cn(
          "flex flex-col transition-opacity duration-300 overflow-hidden",
          isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
        )}>
          <span className="font-bold text-foreground text-lg whitespace-nowrap">DEALER MANAGER</span>
          <span className="text-sm text-muted-foreground whitespace-nowrap">Heavy Duty</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 ml-auto shrink-0"
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
                "flex items-center rounded-md transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                active && "bg-primary text-primary-foreground hover:bg-primary/90",
                isCollapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3 py-2.5"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "text-sm font-medium whitespace-nowrap transition-opacity duration-300",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {isAdmin && (
          <>
            <div className="border-t border-border my-2" />
            <Link
              to="/admin"
              className={cn(
                "flex items-center rounded-md transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                location.pathname === '/admin' && "bg-primary text-primary-foreground hover:bg-primary/90",
                isCollapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3 py-2.5"
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className={cn(
                "text-sm font-medium whitespace-nowrap transition-opacity duration-300",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                Admin
              </span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex-1 min-w-0 transition-opacity duration-300 overflow-hidden",
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate whitespace-nowrap">{displayTitle}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
