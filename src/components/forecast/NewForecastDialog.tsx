import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
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
import { Plus, Trash2, Copy } from "lucide-react";
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
    qty: z.coerce.number().min(0, "Must be 0 or greater"),
    customerName: z.string(),
    customerType: z.enum(["Existing", "New", ""]),
    salesSupport: z.coerce.number().min(0, "Must be 0 or greater"),
    demoTruck: z.coerce.number().min(0, "Must be 0 or greater"),
    brand: z.enum(["Mercedes-Benz", "Freightliner", ""]),
    model: z.string(),
    type: z.enum(["Retail", "Indirect Fleet", "Direct Fleet", ""]),
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
      forecastRows: Array(15).fill(null).map(() => ({ 
        qty: null, 
        customerName: "", 
        customerType: "" as const, 
        salesSupport: null, 
        demoTruck: null, 
        brand: "" as const, 
        model: "", 
        type: "" as const,
        bdm: "" as const,
        upside: false,
      })),
    },
  });

  const onSubmit = async (values: ForecastFormValues) => {
    if (!effectiveWeekStarting) {
      toast({
        title: "Error",
        description: "Please select a week starting date",
        variant: "destructive",
      });
      return;
    }

    if (!effectiveDealerId) {
      toast({
        title: "Error",
        description: "Please select a dealership",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate totals from rows
      const forecastRows = values.forecastRows;
      const mbtRetailTotal = forecastRows.filter(r => r.brand === "Mercedes-Benz" && r.type === "Retail").reduce((sum, row) => sum + row.qty, 0);
      const ftlRetailTotal = forecastRows.filter(r => r.brand === "Freightliner" && r.type === "Retail").reduce((sum, row) => sum + row.qty, 0);
      const mbtIndirectTotal = forecastRows.filter(r => r.brand === "Mercedes-Benz" && r.type === "Indirect Fleet").reduce((sum, row) => sum + row.qty, 0);
      const ftlIndirectTotal = forecastRows.filter(r => r.brand === "Freightliner" && r.type === "Indirect Fleet").reduce((sum, row) => sum + row.qty, 0);
      const mbtDirectTotal = forecastRows.filter(r => r.brand === "Mercedes-Benz" && r.type === "Direct Fleet").reduce((sum, row) => sum + row.qty, 0);
      const ftlDirectTotal = forecastRows.filter(r => r.brand === "Freightliner" && r.type === "Direct Fleet").reduce((sum, row) => sum + row.qty, 0);

      const { error } = await supabase.from("Forecast").insert({
        "Dealer ID": effectiveDealerId,
        "Forecast Date": effectiveWeekStarting,
        "Conquest Meetings": values.conquestMeetings,
        "Customer Meetings": values.customerMeetings,
        "MBT Quotes Issued": values.mbtQuotesIssued,
        "FTL Quotes Issued": values.ftlQuotesIssued,
        "MBT Orders Received": values.mbtOrdersReceived,
        "FTL Orders Received": values.ftlOrdersReceived,
        "MBT Orders Expected NW": values.mbtOrdersExpected,
        "FTL Orders Expected NW": values.ftlOrdersExpected,
        "MBT Pipeline Growth": values.mbtPipelineGrowth,
        "FTL Pipeline Growth": values.ftlPipelineGrowth,
        "MBT Pipeline Lost": values.mbtPipelineLost,
        "FTL Pipeline Lost": values.ftlPipelineLost,
        "MBT Pipeline Size This QTR": values.mbtPipelineThisQtr,
        "MBT Pipeline Size Next QTR": values.mbtPipelineNextQtr,
        "FTL Pipeline Size This QTR": values.ftlPipelineThisQtr,
        "FTL Pipeline Size Next QTR": values.ftlPipelineNextQtr,
        "MBT Retail": mbtRetailTotal,
        "FTL Retail": ftlRetailTotal,
        "MBT Fleet Indirect": mbtIndirectTotal,
        "FTL Fleet Indirect": ftlIndirectTotal,
        "MBT Fleet Direct": mbtDirectTotal,
        "FTL Fleet Direct": ftlDirectTotal,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast entry created successfully",
      });

      form.reset();
      setOpen(false);
      setLocalDealerId(null);
      setLocalWeekStarting(null);
      onSuccess();
    } catch (error) {
      console.error("Error creating forecast:", error);
      toast({
        title: "Error",
        description: "Failed to create forecast entry",
        variant: "destructive",
      });
    }
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
      <DialogContent className="max-w-[1700px] h-[90vh] flex flex-col">
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
                      <SelectTrigger>
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

            <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted">
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
                  value="forecast" 
                  className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                >
                  Forecast
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="activity" className="space-y-4 mt-0 h-full">
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

                <TabsContent value="forecast" className="space-y-4 mt-0 h-full">
                  {/* First Row: Three Total Columns */}
                  <div className="grid grid-cols-3 gap-6 mb-6">
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
                          <CardTitle>Forecast Detail</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const emptyRows = Array(15).fill(null).map(() => ({
                                qty: null,
                                customerName: "",
                                customerType: "" as const,
                                salesSupport: null,
                                demoTruck: null,
                                brand: "" as const,
                                model: "",
                                type: "" as const,
                                bdm: "" as const,
                                upside: false,
                              }));
                              form.setValue("forecastRows", emptyRows);
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
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                        <div className="grid grid-cols-[90px_320px_100px_120px_110px_160px_280px_140px_140px_80px] gap-2 font-semibold text-xs mb-2">
                          <div>QTY</div>
                          <div>Customer Name</div>
                          <div>Customer</div>
                          <div>Sales Support $</div>
                          <div>Demo Truck $</div>
                          <div>Brand</div>
                          <div>Model</div>
                          <div>Type</div>
                          <div>BDM</div>
                          <div>Upside</div>
                        </div>
                        {Array.from({ length: 15 }).map((_, index) => (
                          <div key={index} className="grid grid-cols-[90px_320px_100px_120px_110px_160px_280px_140px_140px_80px] gap-2">
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
                                      className="h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:border-l-[3px] focus-visible:border-l-primary pl-3"
                                    />
                                  </FormControl>
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
                                      className="h-9 text-sm"
                                    />
                                  </FormControl>
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
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Existing">Existing</SelectItem>
                                        <SelectItem value="New">New</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
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
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                                        <SelectItem value="Freightliner">Freightliner</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
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
                                      className="h-9 text-sm"
                                    />
                                  </FormControl>
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
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Retail">Retail</SelectItem>
                                        <SelectItem value="Indirect Fleet">Indirect Fleet</SelectItem>
                                        <SelectItem value="Direct Fleet">Direct Fleet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
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
