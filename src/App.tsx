import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { PerformanceFiltersProvider } from "@/contexts/PerformanceFiltersContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SimpleLayout } from "./components/SimpleLayout";
import Index from "./pages/Index";
import Performance from "./pages/Performance";
import Forecast from "./pages/Forecast";
import BusinessPlan from "./pages/BusinessPlan";
import NewReport from "./pages/NewReport";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Dealerships from "./pages/Dealerships";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="lovable-ui-theme">
      <AuthProvider>
        <PerformanceFiltersProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><SimpleLayout><Index /></SimpleLayout></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><SimpleLayout><Performance /></SimpleLayout></ProtectedRoute>} />
                <Route path="/forecast" element={<ProtectedRoute><SimpleLayout><Forecast /></SimpleLayout></ProtectedRoute>} />
                <Route path="/business-plan" element={<ProtectedRoute><SimpleLayout><BusinessPlan /></SimpleLayout></ProtectedRoute>} />
                <Route path="/dealerships" element={<ProtectedRoute><SimpleLayout><Dealerships /></SimpleLayout></ProtectedRoute>} />
                <Route path="/new-report" element={<ProtectedRoute><SimpleLayout><NewReport /></SimpleLayout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><SimpleLayout><Reports /></SimpleLayout></ProtectedRoute>} />
                <Route path="/reports/:id" element={<ProtectedRoute><SimpleLayout><ReportDetail /></SimpleLayout></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PerformanceFiltersProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
