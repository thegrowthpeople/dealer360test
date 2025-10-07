import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { mockReports } from "@/data/mockData";
import { Calendar, FileText, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Previous Reports</h1>
          <p className="text-muted-foreground">View and review your past weekly submissions</p>
        </div>

        <div className="grid gap-6">
          {mockReports.map((report) => {
            const totalOrders = report.orders.reduce((sum, order) => sum + order.unitsOrdered, 0);
            const totalForecast = report.deliveryForecast.committedUnits + report.deliveryForecast.potentialUpside;

            return (
              <Card key={report.id} className="p-6 shadow-soft hover:shadow-medium transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-semibold text-foreground">
                        Week Ending: {formatDate(report.weekEnding)}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-chart-1" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{report.visitations.length}</p>
                          <p className="text-xs text-muted-foreground">Customer Visits</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
                          <p className="text-xs text-muted-foreground">Orders (Units)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-chart-3" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{totalForecast}</p>
                          <p className="text-xs text-muted-foreground">Forecast (Units)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="shrink-0"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Reports;
