import { Home, TrendingUp, LineChart, BarChart, PlusCircle, FileText } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/performance", label: "Performance", icon: TrendingUp },
  { path: "/forecast", label: "Forecast", icon: LineChart },
  { path: "/business-plan", label: "Business Plan", icon: BarChart },
];

export function AppSidebar() {
  const location = useLocation();
  const { open } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="w-52 border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-center">
          {open && <span className="font-semibold text-foreground text-lg">Dealer Management</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="gap-1 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className={cn(
                    "transition-all",
                    active && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  )}
                >
                  <Link to={item.path}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              GP
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Gary Parker</p>
              <p className="text-xs text-muted-foreground truncate">BDM</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
