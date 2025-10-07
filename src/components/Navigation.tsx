import { Link, useLocation } from "react-router-dom";
import { Home, FileText, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/new-report", label: "New Report", icon: PlusCircle },
    { path: "/reports", label: "Previous Reports", icon: FileText },
  ];

  return (
    <nav className="border-b bg-card shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">DT</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">BDM Reports</h1>
                <p className="text-xs text-muted-foreground">Heavy Vehicles Team</p>
              </div>
            </div>
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">Welcome, </span>
            <span className="font-medium text-foreground">John Smith</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
