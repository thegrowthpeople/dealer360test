import { Card } from "@/components/ui/card";
import { mockReports } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Phone, Building2, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = mockReports.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/reports")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Weekly Report - {formatDate(report.weekEnding)}
          </h1>
          <p className="text-muted-foreground">Submitted by {report.bdmName}</p>
        </div>

        <div className="space-y-8">
          {/* Visitations Section */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Customer Visitations</h2>
            <div className="grid gap-6">
              {report.visitations.map((visit) => (
                <Card key={visit.id} className="p-6 shadow-soft">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-1">
                            {visit.customerName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{visit.contact}</p>
                        </div>
                        <Badge variant={visit.brand === "Mercedes-Benz" ? "default" : "secondary"}>
                          {visit.brand}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(visit.dateOfVisit)}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          {visit.dealership}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {visit.location}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(visit.potentialDealSize)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm pt-2">
                        <div>
                          <span className="text-muted-foreground">Model:</span>
                          <span className="ml-2 font-medium text-foreground">{visit.truckModel}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Industry:</span>
                          <span className="ml-2 font-medium text-foreground">{visit.industryApplication}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Competitor:</span>
                          <span className="ml-2 font-medium text-foreground">{visit.competitor}</span>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-muted-foreground">Decision Date:</span>
                          <span className="ml-2 font-medium text-foreground">
                            {formatDate(visit.potentialDecisionDate)}
                          </span>
                        </div>
                      </div>

                      {visit.notes && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                          <p className="text-sm text-foreground">{visit.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Orders Section */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Orders Taken</h2>
            <div className="grid gap-6">
              {report.orders.map((order) => (
                <Card key={order.id} className="p-6 shadow-soft">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-1">
                            {order.customerName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{order.contact}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={order.brand === "Mercedes-Benz" ? "default" : "secondary"}>
                            {order.brand}
                          </Badge>
                          <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                            {order.unitsOrdered} Units
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.dateOfOrder)}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          {order.dealership}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {order.location}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm pt-2">
                        <div>
                          <span className="text-muted-foreground">Model:</span>
                          <span className="ml-2 font-medium text-foreground">{order.truckModel}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Industry:</span>
                          <span className="ml-2 font-medium text-foreground">{order.industryApplication}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Competitor:</span>
                          <span className="ml-2 font-medium text-foreground">{order.competitor}</span>
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm pt-2">
                        <div>
                          <span className="text-muted-foreground">DTFS:</span>
                          <Badge variant={order.dtfs ? "default" : "outline"} className="ml-2">
                            {order.dtfs ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Service Plan:</span>
                          <Badge variant={order.servicePlan ? "default" : "outline"} className="ml-2">
                            {order.servicePlan ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                          <p className="text-sm text-foreground">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Delivery Forecast Section */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Delivery Forecast</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold text-foreground mb-2">Committed Units</h3>
                <p className="text-4xl font-bold text-chart-2 mb-4">
                  {report.deliveryForecast.committedUnits}
                </p>
                <p className="text-sm text-muted-foreground mb-2">Notes:</p>
                <p className="text-sm text-foreground">{report.deliveryForecast.committedNotes}</p>
              </Card>

              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold text-foreground mb-2">Potential Upside</h3>
                <p className="text-4xl font-bold text-chart-3 mb-4">
                  {report.deliveryForecast.potentialUpside}
                </p>
                <p className="text-sm text-muted-foreground mb-2">Notes:</p>
                <p className="text-sm text-foreground">{report.deliveryForecast.upsideNotes}</p>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ReportDetail;
