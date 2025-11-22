import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isMonday } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Copy, X, Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { ForecastTotalCard } from "./ForecastTotalCard";
import { ForecastStepIndicator } from "./ForecastStepIndicator";
import { ForecastStepNavigation } from "./ForecastStepNavigation";
import { cn } from "@/lib/utils";

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
    estimatedDelivery: z.string().min(1, "Est. Delivery is required"),
  })),
});

type ForecastFormValues = z.infer<typeof forecastSchema>;

const STEPS = [
  { id: 1, label: "BDM Visitations", shortLabel: "BDM Visits", tabValue: "bdmVisitations" },
  { id: 2, label: "Activity", shortLabel: "Activity", tabValue: "activity" },
  { id: 3, label: "Pipeline", shortLabel: "Pipeline", tabValue: "pipeline2" },
  { id: 4, label: "Lost Opportunities", shortLabel: "Lost", tabValue: "pipelineNew" },
  { id: 5, label: "Orders Received", shortLabel: "Orders", tabValue: "orders" },
  { id: 6, label: "Forecast", shortLabel: "Forecast", tabValue: "forecast" },
];

interface NewForecastDialogProps {
  onSuccess: () => void;
}

export const NewForecastDialog = ({
  onSuccess,
}: NewForecastDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const {
    selectedWeekStarting,
    selectedYear,
    selectedMonth,
    dealerships,
  } = usePerformanceFilters();

  const [localDealershipGroup, setLocalDealershipGroup] = useState<string>("");
  const [localDealerId, setLocalDealerId] = useState<number | null>(null);
  const [localWeekStarting, setLocalWeekStarting] = useState<string | null>(null);
  
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [dealershipSearchOpen, setDealershipSearchOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [dealershipSearchQuery, setDealershipSearchQuery] = useState("");

  // Get unique dealer groups with formatting and sorting
  const dealerGroups = useMemo(() => {
    const groups = [...new Set(dealerships.map(d => d["Dealer Group"]))];
    
    const metro: string[] = [];
    const regional: string[] = [];
    const independent: string[] = [];
    const nz: string[] = [];
    const internal: string[] = [];
    
    groups.forEach(group => {
      const groupLower = group.toLowerCase();
      if (groupLower.includes('metro')) {
        metro.push(group);
      } else if (groupLower.includes('regional')) {
        regional.push(group);
      } else if (groupLower.includes('independent')) {
        independent.push(group);
      } else if (groupLower.includes('nz')) {
        nz.push(group);
      } else {
        internal.push(group);
      }
    });
    
    return [
      { label: 'Metro', items: metro.sort() },
      { label: 'Regional', items: regional.sort() },
      { label: 'Independent', items: independent.sort() },
      { label: 'NZ', items: nz.sort() },
      { label: 'Internal', items: internal.sort() },
    ].filter(section => section.items.length > 0);
  }, [dealerships]);

  // Filter dealerships based on selected group
  const filteredDealerships = useMemo(() => {
    if (!localDealershipGroup) return dealerships;
    return dealerships.filter(d => d["Dealer Group"] === localDealershipGroup);
  }, [dealerships, localDealershipGroup]);

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

  // Step validation logic
  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    
    switch (step) {
      case 1: // BDM Visitations - always valid (can be skipped)
        return true;
      case 2: // Activity
        return (
          values.conquestMeetings !== null && values.conquestMeetings >= 0 &&
          values.customerMeetings !== null && values.customerMeetings >= 0
        );
      case 3: // Pipeline
        return (
          values.mbtPipelineGrowth !== null && values.mbtPipelineGrowth >= 0 &&
          values.ftlPipelineGrowth !== null && values.ftlPipelineGrowth >= 0 &&
          values.mbtPipelineThisQtr !== null && values.mbtPipelineThisQtr >= 0 &&
          values.ftlPipelineThisQtr !== null && values.ftlPipelineThisQtr >= 0 &&
          values.mbtPipelineNextQtr !== null && values.mbtPipelineNextQtr >= 0 &&
          values.ftlPipelineNextQtr !== null && values.ftlPipelineNextQtr >= 0
        );
      case 4: // Lost Opportunities - always valid (can be 0 or have rows)
        return true;
      case 5: // Orders Received - always valid (can be 0 or have rows)
        return true;
      case 6: // Forecast
        return values.forecastRows.length > 0 && values.forecastRows.every(row => 
          row.qty && row.qty > 0 &&
          row.customerName?.trim() &&
          row.customerType &&
          row.brand &&
          row.model?.trim() &&
          row.type &&
          row.estimatedDelivery?.trim()
        );
      default:
        return false;
    }
  };

  const handleStepChange = (newStep: number) => {
    // Mark current step as completed if valid
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
    setCurrentStep(newStep);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast({
        title: "Incomplete Step",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
      row.type &&
      row.estimatedDelivery && 
      row.estimatedDelivery.trim() !== ""
    );
  };

  const handleAddRow = () => {
    if (!validateCurrentRows()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (QTY, Customer Name, Type, Brand, Model, Source, Est. Delivery) before adding a new row",
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
      estimatedDelivery: "",
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
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setLocalDealershipGroup("");
    setLocalDealerId(null);
    setLocalWeekStarting(null);
  };

  const currentTabValue = STEPS[currentStep - 1]?.tabValue || "activity";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Forecast
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-8">
        <DialogHeader className="animate-fade-in">
          <DialogTitle className="text-2xl font-bold">New Forecast & Activity Snapshot</DialogTitle>
          <DialogDescription>
            Complete each step to create a comprehensive forecast for your dealership
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            {/* Dealership Selection Section */}
            <Card className="mb-6 animate-fade-in border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dealership & Period Selection
                </CardTitle>
                <CardDescription>Select the dealership and time period for this forecast</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {/* Dealership Group */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Dealership Group
                    </label>
                    <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={groupSearchOpen}
                          className="w-full justify-between"
                        >
                          {localDealershipGroup || "Select group..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 max-h-[320px] overflow-y-auto" align="start" onWheel={(e) => e.stopPropagation()}>
                        <Command>
                          <CommandInput 
                            placeholder="Search groups..." 
                            value={groupSearchQuery}
                            onValueChange={setGroupSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No group found.</CommandEmpty>
                            {dealerGroups.map((section) => (
                              <CommandGroup key={section.label} heading={section.label}>
                                {section.items.map((group) => (
                                  <CommandItem
                                    key={group}
                                    value={group}
                                    onSelect={() => {
                                      setLocalDealershipGroup(group);
                                      setLocalDealerId(null); // Reset dealership when group changes
                                      setGroupSearchOpen(false);
                                      setGroupSearchQuery("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        localDealershipGroup === group ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {group}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Dealership */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Dealership
                    </label>
                    <Popover open={dealershipSearchOpen} onOpenChange={setDealershipSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={dealershipSearchOpen}
                          className="w-full justify-between"
                          disabled={!localDealershipGroup}
                        >
                          {localDealerId 
                            ? filteredDealerships.find(d => d["Dealer ID"] === localDealerId)?.Dealership 
                            : "Select dealership..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 max-h-[320px] overflow-y-auto" align="start" onWheel={(e) => e.stopPropagation()}>
                        <Command>
                          <CommandInput 
                            placeholder="Search dealerships..." 
                            value={dealershipSearchQuery}
                            onValueChange={setDealershipSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No dealership found.</CommandEmpty>
                            <CommandGroup>
                              {filteredDealerships.map((dealer) => (
                                <CommandItem
                                  key={dealer["Dealer ID"]}
                                  value={dealer.Dealership}
                                  onSelect={() => {
                                    setLocalDealerId(dealer["Dealer ID"]);
                                    setDealershipSearchOpen(false);
                                    setDealershipSearchQuery("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      localDealerId === dealer["Dealer ID"] ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {dealer.Dealership}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
              </CardContent>
            </Card>

            {/* Step Indicator */}
            <ForecastStepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepChange}
              steps={STEPS}
            />

            {/* Form Content with Tabs (hidden) */}
            <Tabs value={currentTabValue} onValueChange={(value) => {
              const step = STEPS.find(s => s.tabValue === value);
              if (step) handleStepChange(step.id);
            }} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="hidden">
                {STEPS.map(step => (
                  <TabsTrigger key={step.id} value={step.tabValue}>
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-2">
                {/* Step 1: BDM Visitations */}
                <TabsContent value="bdmVisitations" className="space-y-4 mt-0 animate-fade-in">
                  <Card>
                    <CardHeader>
                      <CardTitle>BDM Visitations</CardTitle>
                      <CardDescription>Record your visitations and activities (optional)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">This section is reserved for BDM visitation tracking. You can skip this step.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Step 2: Activity */}
                <TabsContent value="activity" className="space-y-4 mt-0 animate-fade-in">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meeting Activity</CardTitle>
                      <CardDescription>Record the number of meetings held last week</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="conquestMeetings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conquest Meetings *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">New customer meetings</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerMeetings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Meetings *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">Existing customer meetings</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Step 3: Pipeline */}
                <TabsContent value="pipeline2" className="space-y-4 mt-0 animate-fade-in">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pipeline Snapshot</CardTitle>
                      <CardDescription>Track pipeline growth and quarterly forecasts</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-6">
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-base">Pipeline Growth</h3>
                        <FormField
                          control={form.control}
                          name="mbtPipelineGrowth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mercedes-Benz Growth *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
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
                              <FormLabel>Freightliner Growth *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-base">This Quarter</h3>
                        <FormField
                          control={form.control}
                          name="mbtPipelineThisQtr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mercedes-Benz *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
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
                              <FormLabel>Freightliner *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-base">Next Quarter</h3>
                        <FormField
                          control={form.control}
                          name="mbtPipelineNextQtr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mercedes-Benz *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
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
                              <FormLabel>Freightliner *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Step 4: Lost Opportunities */}
                <TabsContent value="pipelineNew" className="space-y-4 mt-0 animate-fade-in">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lost Opportunities</CardTitle>
                      <CardDescription>Track orders that were lost (optional - can be 0)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">You can add lost opportunity details here or skip this step if you have none to report.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Step 5: Orders Received */}
                <TabsContent value="orders" className="space-y-4 mt-0 animate-fade-in">
                  <Card>
                    <CardHeader>
                      <CardTitle>Orders Received</CardTitle>
                      <CardDescription>Record orders received (optional - can be 0)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">You can add order details here or skip this step if you have no orders to report.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Step 6: Forecast */}
                <TabsContent value="forecast" className="space-y-4 mt-0 animate-fade-in">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Forecast Orders</CardTitle>
                          <CardDescription>Add forecasted orders for the period *</CardDescription>
                        </div>
                        <Button type="button" onClick={handleAddRow} variant="default" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Order
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {fields.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No forecast orders added yet.</p>
                          <p className="text-sm mt-2">Click "Add Order" to create your first forecast entry.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <Card key={field.id} className="p-4">
                              <div className="grid grid-cols-6 gap-3">
                                <FormField
                                  control={form.control}
                                  name={`forecastRows.${index}.qty`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">QTY *</FormLabel>
                                      <FormControl>
                                        <Input type="number" placeholder="1" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`forecastRows.${index}.customerName`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Customer *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Company Name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`forecastRows.${index}.brand`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Brand *</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                                          <SelectItem value="Freightliner">Freightliner</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`forecastRows.${index}.model`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Model *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Model" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`forecastRows.${index}.type`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Source *</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Retail">Retail</SelectItem>
                                          <SelectItem value="Indirect Fleet">Indirect Fleet</SelectItem>
                                          <SelectItem value="Direct Fleet">Direct Fleet</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`forecastRows.${index}.estimatedDelivery`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Est. Delivery *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Q1 2025" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="mt-3 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="gap-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            {/* Navigation */}
            <ForecastStepNavigation
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSave={form.handleSubmit(onSubmit)}
              isNextDisabled={!validateStep(currentStep)}
              nextDisabledReason="Please complete all required fields in this step"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
