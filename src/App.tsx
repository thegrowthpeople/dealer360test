import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { PerformanceFiltersProvider } from "@/contexts/PerformanceFiltersContext";
import { SimpleLayout } from "./components/SimpleLayout";
import Index from "./pages/Index";
import Performance from "./pages/Performance";
import Forecast from "./pages/Forecast";
import BusinessPlan from "./pages/BusinessPlan";
import NewReport from "./pages/NewReport";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Dealerships from "./pages/Dealerships";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="lovable-ui-theme">
      <PerformanceFiltersProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SimpleLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/forecast" element={<Forecast />} />
                <Route path="/business-plan" element={<BusinessPlan />} />
                <Route path="/dealerships" element={<Dealerships />} />
                <Route path="/new-report" element={<NewReport />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/:id" element={<ReportDetail />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SimpleLayout>
          </BrowserRouter>
        </TooltipProvider>
      </PerformanceFiltersProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
