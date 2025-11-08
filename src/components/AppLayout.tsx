import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="relative flex min-h-screen w-full" style={{ gap: 0, margin: 0, padding: 0 }}>
        <AppSidebar />
        <div className="flex flex-col flex-1" style={{ marginLeft: 0, paddingLeft: 0 }}>
          <Header />
          <div className="flex items-center gap-4 bg-background px-4 py-2 border-b">
            <SidebarTrigger />
          </div>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
