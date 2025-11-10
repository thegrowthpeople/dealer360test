import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PlusCircle, Trash2, Save } from "lucide-react";

const NewReport = () => {
  const navigate = useNavigate();
  const [weekEnding, setWeekEnding] = useState("");
  
  // Visitations state
  const [visitations, setVisitations] = useState([{
    dateOfVisit: "",
    dealership: "",
    location: "",
    customerName: "",
    contact: "",
    industryApplication: "",
    brand: "",
    truckModel: "",
    competitor: "",
    potentialDealSize: "",
    potentialDecisionDate: "",
    notes: ""
  }]);

  // Orders state
  const [orders, setOrders] = useState([{
    dateOfOrder: "",
    dealership: "",
    location: "",
    customerName: "",
    contact: "",
    industryApplication: "",
    brand: "",
    truckModel: "",
    unitsOrdered: "",
    dtfs: false,
    servicePlan: false,
    competitor: "",
    notes: ""
  }]);

  // Forecast state
  const [forecast, setForecast] = useState({
    committedUnits: "",
    committedNotes: "",
    potentialUpside: "",
    upsideNotes: ""
  });

  const addVisitation = () => {
    setVisitations([...visitations, {
      dateOfVisit: "",
      dealership: "",
      location: "",
      customerName: "",
      contact: "",
      industryApplication: "",
      brand: "",
      truckModel: "",
      competitor: "",
      potentialDealSize: "",
      potentialDecisionDate: "",
      notes: ""
    }]);
  };

  const removeVisitation = (index: number) => {
    setVisitations(visitations.filter((_, i) => i !== index));
  };

  const updateVisitation = (index: number, field: string, value: any) => {
    const updated = [...visitations];
    updated[index] = { ...updated[index], [field]: value };
    setVisitations(updated);
  };

  const addOrder = () => {
    setOrders([...orders, {
      dateOfOrder: "",
      dealership: "",
      location: "",
      customerName: "",
      contact: "",
      industryApplication: "",
      brand: "",
      truckModel: "",
      unitsOrdered: "",
      dtfs: false,
      servicePlan: false,
      competitor: "",
      notes: ""
    }]);
  };

  const removeOrder = (index: number) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const updateOrder = (index: number, field: string, value: any) => {
    const updated = [...orders];
    updated[index] = { ...updated[index], [field]: value };
    setOrders(updated);
  };

  const handleSubmit = () => {
    // Basic validation
    if (!weekEnding) {
      toast.error("Please select a week ending date");
      return;
    }

    toast.success("Weekly report submitted successfully!");
    navigate("/reports");
  };

  return (
    <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Weekly Report</h1>
          <p className="text-muted-foreground">Submit your weekly activities and forecasts</p>
        </div>

        <Card className="p-6 shadow-soft mb-6">
          <div className="max-w-md">
            <Label htmlFor="weekEnding">Week Ending Date</Label>
            <Input
              id="weekEnding"
              type="date"
              value={weekEnding}
              onChange={(e) => setWeekEnding(e.target.value)}
              className="mt-2"
            />
          </div>
        </Card>

        <Tabs defaultValue="visitations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visitations">Customer Visitations</TabsTrigger>
            <TabsTrigger value="orders">Orders Taken</TabsTrigger>
            <TabsTrigger value="forecast">Delivery Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="visitations" className="space-y-6">
            {visitations.map((visit, index) => (
              <Card key={index} className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Visitation #{index + 1}</h3>
                  {visitations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVisitation(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Visit</Label>
                    <Input
                      type="date"
                      value={visit.dateOfVisit}
                      onChange={(e) => updateVisitation(index, "dateOfVisit", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Dealership</Label>
                    <Input
                      value={visit.dealership}
                      onChange={(e) => updateVisitation(index, "dealership", e.target.value)}
                      placeholder="Enter dealership name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Location</Label>
                    <Input
                      value={visit.location}
                      onChange={(e) => updateVisitation(index, "location", e.target.value)}
                      placeholder="City, State"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={visit.customerName}
                      onChange={(e) => updateVisitation(index, "customerName", e.target.value)}
                      placeholder="Company name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Contact</Label>
                    <Input
                      value={visit.contact}
                      onChange={(e) => updateVisitation(index, "contact", e.target.value)}
                      placeholder="Contact person and title"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Industry Application</Label>
                    <Input
                      value={visit.industryApplication}
                      onChange={(e) => updateVisitation(index, "industryApplication", e.target.value)}
                      placeholder="e.g., Long Haul Freight"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Brand</Label>
                    <Select value={visit.brand} onValueChange={(val) => updateVisitation(index, "brand", val)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                        <SelectItem value="Freightliner">Freightliner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Truck Model</Label>
                    <Input
                      value={visit.truckModel}
                      onChange={(e) => updateVisitation(index, "truckModel", e.target.value)}
                      placeholder="e.g., Cascadia, Actros"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Competitor</Label>
                    <Input
                      value={visit.competitor}
                      onChange={(e) => updateVisitation(index, "competitor", e.target.value)}
                      placeholder="Competing brand/model"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Potential Deal Size ($)</Label>
                    <Input
                      type="number"
                      value={visit.potentialDealSize}
                      onChange={(e) => updateVisitation(index, "potentialDealSize", e.target.value)}
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Potential Decision Date</Label>
                    <Input
                      type="date"
                      value={visit.potentialDecisionDate}
                      onChange={(e) => updateVisitation(index, "potentialDecisionDate", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>General Notes</Label>
                    <Textarea
                      value={visit.notes}
                      onChange={(e) => updateVisitation(index, "notes", e.target.value)}
                      placeholder="Add any relevant notes about this visit..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button onClick={addVisitation} variant="outline" className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Another Visitation
            </Button>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {orders.map((order, index) => (
              <Card key={index} className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Order #{index + 1}</h3>
                  {orders.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrder(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Order</Label>
                    <Input
                      type="date"
                      value={order.dateOfOrder}
                      onChange={(e) => updateOrder(index, "dateOfOrder", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Dealership</Label>
                    <Input
                      value={order.dealership}
                      onChange={(e) => updateOrder(index, "dealership", e.target.value)}
                      placeholder="Enter dealership name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Location</Label>
                    <Input
                      value={order.location}
                      onChange={(e) => updateOrder(index, "location", e.target.value)}
                      placeholder="City, State"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={order.customerName}
                      onChange={(e) => updateOrder(index, "customerName", e.target.value)}
                      placeholder="Company name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Contact</Label>
                    <Input
                      value={order.contact}
                      onChange={(e) => updateOrder(index, "contact", e.target.value)}
                      placeholder="Contact person and title"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Industry Application</Label>
                    <Input
                      value={order.industryApplication}
                      onChange={(e) => updateOrder(index, "industryApplication", e.target.value)}
                      placeholder="e.g., Long Haul Freight"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Brand</Label>
                    <Select value={order.brand} onValueChange={(val) => updateOrder(index, "brand", val)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                        <SelectItem value="Freightliner">Freightliner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Truck Model</Label>
                    <Input
                      value={order.truckModel}
                      onChange={(e) => updateOrder(index, "truckModel", e.target.value)}
                      placeholder="e.g., Cascadia, Actros"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Units Ordered</Label>
                    <Input
                      type="number"
                      value={order.unitsOrdered}
                      onChange={(e) => updateOrder(index, "unitsOrdered", e.target.value)}
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Competitor</Label>
                    <Input
                      value={order.competitor}
                      onChange={(e) => updateOrder(index, "competitor", e.target.value)}
                      placeholder="Competing brand/model"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center space-x-6 pt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`dtfs-${index}`}
                        checked={order.dtfs}
                        onCheckedChange={(checked) => updateOrder(index, "dtfs", checked)}
                      />
                      <Label htmlFor={`dtfs-${index}`} className="cursor-pointer">
                        DTFS
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${index}`}
                        checked={order.servicePlan}
                        onCheckedChange={(checked) => updateOrder(index, "servicePlan", checked)}
                      />
                      <Label htmlFor={`service-${index}`} className="cursor-pointer">
                        Service Plan
                      </Label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label>General Notes</Label>
                    <Textarea
                      value={order.notes}
                      onChange={(e) => updateOrder(index, "notes", e.target.value)}
                      placeholder="Add any relevant notes about this order..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button onClick={addOrder} variant="outline" className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Another Order
            </Button>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold text-foreground mb-4">Committed Units</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Number of Units</Label>
                    <Input
                      type="number"
                      value={forecast.committedUnits}
                      onChange={(e) => setForecast({ ...forecast, committedUnits: e.target.value })}
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={forecast.committedNotes}
                      onChange={(e) => setForecast({ ...forecast, committedNotes: e.target.value })}
                      placeholder="Details about committed deliveries..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold text-foreground mb-4">Potential Upside</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Number of Units</Label>
                    <Input
                      type="number"
                      value={forecast.potentialUpside}
                      onChange={(e) => setForecast({ ...forecast, potentialUpside: e.target.value })}
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={forecast.upsideNotes}
                      onChange={(e) => setForecast({ ...forecast, upsideNotes: e.target.value })}
                      placeholder="Details about potential upside..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSubmit} size="lg" className="min-w-[200px]">
            <Save className="w-4 h-4 mr-2" />
            Submit Report
          </Button>
        </div>
    </div>
  );
};

export default NewReport;
