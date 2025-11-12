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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { ForecastColumnEditor } from "./ForecastColumnEditor";

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
  
  // Forecast fields - now arrays of line items
  mbtRetailRows: z.array(z.object({
    qty: z.coerce.number().min(0, "Must be 0 or greater"),
    customer: z.string(),
    model: z.string(),
  })),
  ftlRetailRows: z.array(z.object({
    qty: z.coerce.number().min(0, "Must be 0 or greater"),
    customer: z.string(),
    model: z.string(),
  })),
  mbtIndirectRows: z.array(z.object({
    qty: z.coerce.number().min(0, "Must be 0 or greater"),
    customer: z.string(),
    model: z.string(),
  })),
  ftlIndirectRows: z.array(z.object({
    qty: z.coerce.number().min(0, "Must be 0 or greater"),
    customer: z.string(),
    model: z.string(),
  })),
  mbtDirectRows: z.array(z.object({
    qty: z.coerce.number().min(0, "Must be 0 or greater"),
    customer: z.string(),
    model: z.string(),
  })),
  ftlDirectRows: z.array(z.object({
    qty: z.coerce.number().min(0, "Must be 0 or greater"),
    customer: z.string(),
    model: z.string(),
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
      conquestMeetings: 0,
      customerMeetings: 0,
      mbtQuotesIssued: 0,
      ftlQuotesIssued: 0,
      mbtOrdersReceived: 0,
      ftlOrdersReceived: 0,
      mbtOrdersExpected: 0,
      ftlOrdersExpected: 0,
      mbtPipelineGrowth: 0,
      ftlPipelineGrowth: 0,
      mbtPipelineLost: 0,
      ftlPipelineLost: 0,
      mbtPipelineThisQtr: 0,
      mbtPipelineNextQtr: 0,
      ftlPipelineThisQtr: 0,
      ftlPipelineNextQtr: 0,
      mbtRetailRows: Array(15).fill({ qty: 0, customer: "", model: "" }),
      ftlRetailRows: Array(15).fill({ qty: 0, customer: "", model: "" }),
      mbtIndirectRows: Array(15).fill({ qty: 0, customer: "", model: "" }),
      ftlIndirectRows: Array(15).fill({ qty: 0, customer: "", model: "" }),
      mbtDirectRows: Array(15).fill({ qty: 0, customer: "", model: "" }),
      ftlDirectRows: Array(15).fill({ qty: 0, customer: "", model: "" }),
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
      const mbtRetailTotal = values.mbtRetailRows.reduce((sum, row) => sum + row.qty, 0);
      const ftlRetailTotal = values.ftlRetailRows.reduce((sum, row) => sum + row.qty, 0);
      const mbtIndirectTotal = values.mbtIndirectRows.reduce((sum, row) => sum + row.qty, 0);
      const ftlIndirectTotal = values.ftlIndirectRows.reduce((sum, row) => sum + row.qty, 0);
      const mbtDirectTotal = values.mbtDirectRows.reduce((sum, row) => sum + row.qty, 0);
      const ftlDirectTotal = values.ftlDirectRows.reduce((sum, row) => sum + row.qty, 0);

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
      <DialogContent className="max-w-[95vw] h-[85vh] flex flex-col">
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
                  <div className="grid grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Retail</CardTitle>
                        <CardDescription>Enter retail forecast data</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <p className="text-sm font-semibold mb-2">Mercedes-Benz</p>
                          <ForecastColumnEditor
                            form={form}
                            brandFieldName="mbtRetailRows"
                            brandLabel="Mercedes-Benz Total"
                            title="Retail"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Freightliner</p>
                          <ForecastColumnEditor
                            form={form}
                            brandFieldName="ftlRetailRows"
                            brandLabel="Freightliner Total"
                            title="Retail"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Indirect Fleet</CardTitle>
                        <CardDescription>Enter indirect fleet forecast data</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <p className="text-sm font-semibold mb-2">Mercedes-Benz</p>
                          <ForecastColumnEditor
                            form={form}
                            brandFieldName="mbtIndirectRows"
                            brandLabel="Mercedes-Benz Total"
                            title="Indirect Fleet"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Freightliner</p>
                          <ForecastColumnEditor
                            form={form}
                            brandFieldName="ftlIndirectRows"
                            brandLabel="Freightliner Total"
                            title="Indirect Fleet"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Direct Fleet</CardTitle>
                        <CardDescription>Enter direct fleet forecast data</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <p className="text-sm font-semibold mb-2">Mercedes-Benz</p>
                          <ForecastColumnEditor
                            form={form}
                            brandFieldName="mbtDirectRows"
                            brandLabel="Mercedes-Benz Total"
                            title="Direct Fleet"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Freightliner</p>
                          <ForecastColumnEditor
                            form={form}
                            brandFieldName="ftlDirectRows"
                            brandLabel="Freightliner Total"
                            title="Direct Fleet"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
