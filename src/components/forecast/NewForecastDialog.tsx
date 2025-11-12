import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isMonday } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Copy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { ForecastTotalCard } from "./ForecastTotalCard";

const forecastSchema = z.object({
  // Activity fields
  conquestMeetings: z.coerce.number().min(0, "Must be 0 or greater"),
  customerMeetings: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtQuotesIssued: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlQuotesIssued: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtOrdersReceived: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlOrdersReceived: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtOrdersExpected: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlOrdersExpected: z.coerce.number().min(0, "Must be 0 or greater"),
  
  // Pipeline fields
  mbtPipelineGrowth: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlPipelineGrowth: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtPipelineLost: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlPipelineLost: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtPipelineThisQtr: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtPipelineNextQtr: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlPipelineThisQtr: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlPipelineNextQtr: z.coerce.number().min(0, "Must be 0 or greater"),
  
  // Forecast fields - single shared array
  forecastRows: z.array(z.object({
    qty: z.coerce.number().min(1, "QTY is required").nullable(),
    customerName: z.string().min(1, "Customer Name is required"),
    customerType: z.enum(["Existing", "New", ""]),
    salesSupport: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
    demoTruck: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
    brand: z.enum(["Mercedes-Benz", "Freightliner"]).nullable().refine((val) => val !== null, { message: "Brand is required" }),
    model: z.string().min(1, "Model is required"),
    type: z.enum(["Retail", "Indirect Fleet", "Direct Fleet"]).nullable().refine((val) => val !== null, { message: "Source is required" }),
    bdm: z.enum(["Met in Person", "Relationship", "Supported", ""]),
    upside: z.boolean(),
  })),
});

type ForecastFormValues = z.infer<typeof forecastSchema>;

interface NewForecastDialogProps {
  onSuccess: () => void;
}

export const NewForecastDialog = ({
  onSuccess,
}: NewForecastDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const {
    selectedWeekStarting,
    selectedDealerId,
    selectedYear,
    selectedMonth,
    dealerships,
  } = usePerformanceFilters();

  const [localDealerId, setLocalDealerId] = useState<number | null>(null);
  const [localWeekStarting, setLocalWeekStarting] = useState<string | null>(null);

  // Use filter values or local values
  const effectiveDealerId = selectedDealerId ?? localDealerId;
  const effectiveWeekStarting = selectedWeekStarting ?? localWeekStarting;

  // Calculate available weeks based on selected year and month
  const availableWeeks = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return allDays
      .filter(day => isMonday(day))
      .map(monday => ({
        date: format(monday, "yyyy-MM-dd"),
        display: format(monday, "MMM d, yyyy")
      }));
  }, [selectedYear, selectedMonth]);

  const form = useForm<ForecastFormValues>({
    resolver: zodResolver(forecastSchema),
    defaultValues: {
      conquestMeetings: null,
      customerMeetings: null,
      mbtQuotesIssued: null,
      ftlQuotesIssued: null,
      mbtOrdersReceived: null,
      ftlOrdersReceived: null,
      mbtOrdersExpected: null,
      ftlOrdersExpected: null,
      mbtPipelineGrowth: null,
      ftlPipelineGrowth: null,
      mbtPipelineLost: null,
      ftlPipelineLost: null,
      mbtPipelineThisQtr: null,
      mbtPipelineNextQtr: null,
      ftlPipelineThisQtr: null,
      ftlPipelineNextQtr: null,
      forecastRows: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "forecastRows"
  });

  const validateCurrentRows = () => {
    const rows = form.getValues("forecastRows");
    if (rows.length === 0) return true;
    
    return rows.every(row => 
      row.qty && 
      row.qty > 0 && 
      row.customerName && 
      row.customerName.trim() !== "" &&
      row.customerType &&
      row.brand && 
      row.model && 
      row.model.trim() !== "" &&
      row.type
    );
  };

  const handleAddRow = () => {
    if (!validateCurrentRows()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (QTY, Customer Name, Type, Brand, Model, Source) before adding a new row",
        variant: "destructive",
      });
      return;
    }
    
    append({
      qty: null,
      customerName: "",
      customerType: "",
      salesSupport: null,
      demoTruck: null,
      brand: null,
      model: "",
      type: null,
      bdm: "",
      upside: false,
    });
  };

  const onSubmit = async (values: ForecastFormValues) => {
    // Test mode: just close the modal
    toast({
      title: "Test Mode",
      description: "Forecast submission - closing modal",
    });
    setOpen(false);
    form.reset();
  };

  const canCreateForecast = selectedWeekStarting && selectedDealerId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Forecast
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[1800px] h-[90vh] flex flex-col p-12">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">NEW FORECAST</DialogTitle>
          <DialogDescription>
            Create a new dealership forecast
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="space-y-4 mb-4">
              {/* Dealership Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dealership</label>
                  {selectedDealerId ? (
                    <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                      <p className="text-sm font-medium">
                        {dealerships.find(d => d["Dealer ID"] === selectedDealerId)?.Dealership}
                      </p>
                      <p className="text-xs text-muted-foreground">From filters</p>
                    </div>
                  ) : (
                    <Select
                      value={localDealerId?.toString() || ""}
                      onValueChange={(value) => setLocalDealerId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dealership" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealerships.map((dealer) => (
                          <SelectItem key={dealer["Dealer ID"]} value={dealer["Dealer ID"].toString()}>
                            {dealer.Dealership}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Week Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Week Starting</label>
                  {selectedWeekStarting ? (
                    <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                      <p className="text-sm font-medium">
                        {format(new Date(selectedWeekStarting), "MMMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">From filters</p>
                    </div>
                  ) : (
                    <Select
                      value={localWeekStarting || ""}
                      onValueChange={setLocalWeekStarting}
                      disabled={availableWeeks.length === 0}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder={availableWeeks.length === 0 ? "Select month first" : "Select week"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWeeks.map((week) => (
                          <SelectItem key={week.date} value={week.date}>
                            {week.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-visible">
              <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted">
                <TabsTrigger 
                  value="activity" 
                  className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                >
                  Activity
                </TabsTrigger>
                <TabsTrigger 
                  value="pipeline" 
                  className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                >
                  Pipeline
                </TabsTrigger>
                <TabsTrigger 
                  value="orders" 
                  className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                >
                  Orders
                </TabsTrigger>
                <TabsTrigger 
                  value="forecast" 
                  className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                >
                  Forecast
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-visible mt-4 px-2 -mx-2">
                <TabsContent value="activity" className="space-y-4 mt-0 h-full overflow-visible">
                <Card>
                  <CardHeader>
                    <CardTitle>Meetings</CardTitle>
                    <CardDescription>Enter meeting activity data</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="conquestMeetings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conquest Meetings</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerMeetings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Meetings</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quotes</CardTitle>
                    <CardDescription>Enter quote information</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtQuotesIssued"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Quotes</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlQuotesIssued"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Quotes</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Orders Received</CardTitle>
                    <CardDescription>Enter booked orders</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtOrdersReceived"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Orders</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlOrdersReceived"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Orders</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expected Orders</CardTitle>
                    <CardDescription>Enter expected order counts</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtOrdersExpected"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Expected</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlOrdersExpected"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Expected</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="pipeline" className="space-y-4 mt-0 h-full">
                <Card>
                  <CardHeader>
                    <CardTitle>Pipeline Growth</CardTitle>
                    <CardDescription>Enter pipeline growth data</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtPipelineGrowth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Growth</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlPipelineGrowth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Growth</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pipeline Lost</CardTitle>
                    <CardDescription>Enter lost pipeline data</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtPipelineLost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Lost</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlPipelineLost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Lost</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>This Quarter Pipeline</CardTitle>
                    <CardDescription>Enter current quarter pipeline size</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtPipelineThisQtr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz This QTR</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlPipelineThisQtr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner This QTR</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Next Quarter Pipeline</CardTitle>
                    <CardDescription>Enter next quarter pipeline size</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtPipelineNextQtr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Next QTR</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlPipelineNextQtr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Next QTR</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4 mt-0 h-full overflow-visible">
                  {/* First Row: Four Total Columns */}
                  <div className="grid grid-cols-4 gap-6 mb-6 overflow-visible">
                    <ForecastTotalCard
                      title="Forecast
Total"
                      mbTotal={
                        (form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && (r.type === "Retail" || r.type === "Indirect Fleet" || r.type === "Direct Fleet")).reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0)
                      }
                      ftlTotal={
                        (form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && (r.type === "Retail" || r.type === "Indirect Fleet" || r.type === "Direct Fleet")).reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0)
                      }
                      leftBgColor="bg-primary"
                      rightBgColor="bg-primary/10"
                      leftTextColor="text-white"
                    />
                    <ForecastTotalCard
                      title="Own Retail"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Retail").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Retail").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                    />
                    <ForecastTotalCard
                      title="Indirect Fleet"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Indirect Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Indirect Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                    />
                    <ForecastTotalCard
                      title="Direct Fleet"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Direct Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Direct Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                    />
                  </div>

                  {/* Second Row: Data Entry Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Order Outlook</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              remove(Array.from({ length: fields.length }, (_, i) => i));
                              append({
                                qty: null,
                                customerName: "",
                                customerType: "" as const,
                                salesSupport: null,
                                demoTruck: null,
                                brand: null,
                                model: "",
                                type: null,
                                bdm: "" as const,
                                upside: false,
                              });
                            }}
                            title="Clear all table data"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="Copy from previous week (coming soon)"
                            disabled
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 pl-4">
                        <div className="grid grid-cols-[40px_70px_320px_100px_120px_110px_160px_280px_140px_140px_80px] gap-2 font-semibold text-xs mb-2">
                          <div></div>
                          <div>QTY</div>
                          <div>Customer Name</div>
                          <div>Type</div>
                          <div>Sales Support $</div>
                          <div>Demo Truck $</div>
                          <div>Brand</div>
                          <div>Model</div>
                          <div>Source</div>
                          <div>BDM</div>
                          <div>Confirmed</div>
                        </div>
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-[40px_70px_320px_100px_120px_110px_160px_280px_140px_140px_80px] gap-2 focus-within:bg-primary/5 focus-within:shadow-sm rounded-sm p-1 -m-1 transition-all duration-150">
                            <div className="flex items-center justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-7 w-7 p-0 hover:bg-destructive/10"
                                title="Delete row"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.qty`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                                      className={`h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${(!field.value || field.value <= 0) ? 'border-destructive' : ''}`}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.customerName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className={`h-9 text-sm ${!field.value || field.value.trim() === '' ? 'border-destructive' : ''}`}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.customerType`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className={`h-9 text-sm ${!field.value ? 'border-destructive' : ''}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Existing">Existing</SelectItem>
                                        <SelectItem value="New">New</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.salesSupport`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.demoTruck`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`forecastRows.${index}.brand`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className={`h-9 text-sm ${!field.value ? 'border-destructive' : ''}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                                        <SelectItem value="Freightliner">Freightliner</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.model`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className={`h-9 text-sm ${!field.value || field.value.trim() === '' ? 'border-destructive' : ''}`}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`forecastRows.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className={`h-9 text-sm ${!field.value ? 'border-destructive' : ''}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Retail">Retail</SelectItem>
                                        <SelectItem value="Indirect Fleet">Indirect Fleet</SelectItem>
                                        <SelectItem value="Direct Fleet">Direct Fleet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.bdm`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Met in Person">Met in Person</SelectItem>
                                        <SelectItem value="Relationship">Relationship</SelectItem>
                                        <SelectItem value="Supported">Supported</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.upside`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center h-9">
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4 rounded border-input"
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                        
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRow}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Row
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="forecast" className="space-y-4 mt-0 h-full overflow-visible">
                  {/* First Row: Four Total Columns */}
                  <div className="grid grid-cols-4 gap-6 mb-6 overflow-visible">
                    <ForecastTotalCard
                      title="Forecast
Total"
                      mbTotal={
                        (form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && (r.type === "Retail" || r.type === "Indirect Fleet" || r.type === "Direct Fleet")).reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0)
                      }
                      ftlTotal={
                        (form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && (r.type === "Retail" || r.type === "Indirect Fleet" || r.type === "Direct Fleet")).reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0)
                      }
                      leftBgColor="bg-primary"
                      rightBgColor="bg-primary/10"
                      leftTextColor="text-white"
                    />
                    <ForecastTotalCard
                      title="Own Retail"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Retail").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Retail").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                    />
                    <ForecastTotalCard
                      title="Indirect Fleet"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Indirect Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Indirect Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                    />
                    <ForecastTotalCard
                      title="Direct Fleet"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Direct Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Direct Fleet").reduce((sum, r) => sum + (typeof r.qty === 'string' ? parseFloat(r.qty) || 0 : r.qty || 0), 0) || 0}
                    />
                  </div>

                  {/* Second Row: Data Entry Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Delivery Forecast Detail</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              remove(Array.from({ length: fields.length }, (_, i) => i));
                              append({
                                qty: null,
                                customerName: "",
                                customerType: "" as const,
                                salesSupport: null,
                                demoTruck: null,
                                brand: null,
                                model: "",
                                type: null,
                                bdm: "" as const,
                                upside: false,
                              });
                            }}
                            title="Clear all table data"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="Copy from previous week (coming soon)"
                            disabled
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 pl-4">
                        <div className="grid grid-cols-[40px_70px_320px_100px_120px_110px_160px_280px_140px_140px_80px] gap-2 font-semibold text-xs mb-2">
                          <div></div>
                          <div>QTY</div>
                          <div>Customer Name</div>
                          <div>Type</div>
                          <div>Sales Support $</div>
                          <div>Demo Truck $</div>
                          <div>Brand</div>
                          <div>Model</div>
                          <div>Source</div>
                          <div>BDM</div>
                          <div>Upside</div>
                        </div>
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-[40px_70px_320px_100px_120px_110px_160px_280px_140px_140px_80px] gap-2 focus-within:bg-primary/5 focus-within:shadow-sm rounded-sm p-1 -m-1 transition-all duration-150">
                            <div className="flex items-center justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-7 w-7 p-0 hover:bg-destructive/10"
                                title="Delete row"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.qty`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                                      className={`h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${(!field.value || field.value <= 0) ? 'border-destructive' : ''}`}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.customerName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className={`h-9 text-sm ${!field.value || field.value.trim() === '' ? 'border-destructive' : ''}`}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.customerType`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className={`h-9 text-sm ${!field.value ? 'border-destructive' : ''}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Existing">Existing</SelectItem>
                                        <SelectItem value="New">New</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.salesSupport`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.demoTruck`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`forecastRows.${index}.brand`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className={`h-9 text-sm ${!field.value ? 'border-destructive' : ''}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                                        <SelectItem value="Freightliner">Freightliner</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.model`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className={`h-9 text-sm ${!field.value || field.value.trim() === '' ? 'border-destructive' : ''}`}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`forecastRows.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className={`h-9 text-sm ${!field.value ? 'border-destructive' : ''}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Retail">Retail</SelectItem>
                                        <SelectItem value="Indirect Fleet">Indirect Fleet</SelectItem>
                                        <SelectItem value="Direct Fleet">Direct Fleet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.bdm`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Met in Person">Met in Person</SelectItem>
                                        <SelectItem value="Relationship">Relationship</SelectItem>
                                        <SelectItem value="Supported">Supported</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`forecastRows.${index}.upside`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center h-9">
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4 rounded border-input"
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                        
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRow}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Row
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Forecast</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
