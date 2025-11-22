import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isMonday } from "date-fns";
import { Check, ChevronsUpDown, Building2, MapPin, Plus, Trash2, X, Copy, CalendarIcon } from "lucide-react";
import * as React from "react";
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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { ForecastStepIndicator } from "./ForecastStepIndicator";
import { ForecastStepNavigation } from "./ForecastStepNavigation";
import { ForecastTotalCard } from "./ForecastTotalCard";
import { cn } from "@/lib/utils";

const forecastSchema = z.object({
  conquestMeetings: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  customerMeetings: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtQuotesIssued: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlQuotesIssued: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtOrdersReceived: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlOrdersReceived: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtOrdersExpected: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlOrdersExpected: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtPipelineGrowth: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlPipelineGrowth: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtPipelineLost: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlPipelineLost: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtPipelineThisQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtPipelineNextQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlPipelineThisQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlPipelineNextQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  forecastRows: z.array(z.object({
    qty: z.coerce.number().min(1, "QTY is required").nullable(),
    customerName: z.string().min(1, "Customer Name is required"),
    customerType: z.enum(["Existing", "New", ""]),
    salesSupport: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
    demoTruck: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
    brand: z.enum(["Mercedes-Benz", "Freightliner"]).nullable(),
    model: z.string().min(1, "Model is required"),
    type: z.enum(["Retail", "Indirect Fleet", "Direct Fleet"]).nullable(),
    bdm: z.enum(["Met in Person", "Relationship", "Supported", ""]),
    upside: z.boolean(),
    estimatedDelivery: z.string().min(1, "Est. Delivery is required"),
  })),
});

type ForecastFormValues = z.infer<typeof forecastSchema>;

const STEPS = [
  { id: 1, label: "Forecast", shortLabel: "Forecast", tabValue: "forecast" },
  { id: 2, label: "Orders Received", shortLabel: "Orders", tabValue: "orders" },
  { id: 3, label: "Activity", shortLabel: "Activity", tabValue: "activity" },
  { id: 4, label: "Pipeline", shortLabel: "Pipeline", tabValue: "pipeline" },
  { id: 5, label: "Lost Opportunities", shortLabel: "Lost", tabValue: "lost" },
  { id: 6, label: "BDM Visitations", shortLabel: "BDM Visits", tabValue: "bdmVisitations" },
];

interface NewForecastDialogProps {
  onSuccess: () => void;
}

export const NewForecastDialog = ({ onSuccess }: NewForecastDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
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

  // Get all unique dealer groups sorted by region (matching Performance page)
  const dealerGroups = useMemo(() => {
    const groups = [...new Set(dealerships.map((d) => d["Dealer Group"]).filter(Boolean))];
    
    const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];
    
    return groups.sort((a, b) => {
      const regionA = dealerships.find(d => d["Dealer Group"] === a)?.Region || "";
      const regionB = dealerships.find(d => d["Dealer Group"] === b)?.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [dealerships]);

  const filteredDealerships = useMemo(() => {
    if (!localDealershipGroup) return dealerships;
    
    const filtered = dealerships.filter(d => d["Dealer Group"] === localDealershipGroup);
    
    // Sort by region first, then by dealership name
    const REGION_ORDER = ["Metro", "Regional", "Independent", "NZ", "Internal"];
    return filtered.sort((a, b) => {
      const regionA = a.Region || "";
      const regionB = b.Region || "";
      const indexA = REGION_ORDER.indexOf(regionA);
      const indexB = REGION_ORDER.indexOf(regionB);
      const regionCompare = (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      
      if (regionCompare !== 0) return regionCompare;
      
      // Within same region, sort alphabetically by dealership name
      return (a.Dealership || "").localeCompare(b.Dealership || "");
    });
  }, [dealerships, localDealershipGroup]);

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

  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    
    switch (step) {
      case 1:
        return values.forecastRows.length > 0;
      case 2:
      case 3:
        return values.conquestMeetings !== null && values.customerMeetings !== null;
      case 4:
        return (
          values.mbtPipelineGrowth !== null &&
          values.ftlPipelineGrowth !== null &&
          values.mbtPipelineThisQtr !== null &&
          values.ftlPipelineThisQtr !== null &&
          values.mbtPipelineNextQtr !== null &&
          values.ftlPipelineNextQtr !== null
        );
      case 5:
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleStepChange = (newStep: number) => {
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
      row.qty && row.qty > 0 && 
      row.customerName?.trim() &&
      row.customerType &&
      row.brand && 
      row.model?.trim() &&
      row.type &&
      row.estimatedDelivery?.trim()
    );
  };

  const handleAddRow = () => {
    if (!validateCurrentRows()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before adding a new row",
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
    toast({
      title: "Test Mode",
      description: "Forecast submission - closing modal",
    });
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setShowForm(false);
    form.reset();
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setLocalDealershipGroup("");
    setLocalDealerId(null);
    setLocalWeekStarting(null);
  };

  const handleContinueToForm = () => {
    if (!localDealershipGroup || !localDealerId || (!selectedWeekStarting && !localWeekStarting)) {
      toast({
        title: "Selection Required",
        description: "Please select Dealership Group, Dealership, and Week Starting",
        variant: "destructive",
      });
      return;
    }
    setShowForm(true);
  };

  const currentTabValue = STEPS[currentStep - 1]?.tabValue || "forecast";
  
  const selectedDealershipName = localDealerId 
    ? filteredDealerships.find(d => d["Dealer ID"] === localDealerId)?.Dealership 
    : "";
  
  const selectedWeekDisplay = selectedWeekStarting 
    ? format(new Date(selectedWeekStarting), "MMM d, yyyy")
    : localWeekStarting 
    ? format(new Date(localWeekStarting), "MMM d, yyyy")
    : "";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleCloseDialog();
      }
      setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Forecast
        </Button>
      </DialogTrigger>
      <DialogContent 
        className={cn(
          "flex flex-col p-0 gap-0",
          showForm ? "max-w-[95vw] h-[90vh]" : "max-w-2xl"
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {!showForm ? (
          // Stage 1: Dealership & Period Selection
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-bold">Create New Weekly Report</DialogTitle>
              <DialogDescription>
                Select dealership and period
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 mb-6">
                <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-[260px] justify-between">
                        {localDealershipGroup || "All Dealer Groups"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 max-h-[320px] overflow-y-auto" align="start" onWheel={(e) => e.stopPropagation()}>
                      <Command>
                        <CommandInput placeholder="Search groups..." />
                        <CommandList>
                          <CommandEmpty>No group found.</CommandEmpty>
                          <CommandGroup>
                            {dealerGroups.map((group, index) => {
                              const currentRegion = dealerships.find(d => d["Dealer Group"] === group)?.Region;
                              const nextGroup = dealerGroups[index + 1];
                              const nextRegion = nextGroup ? dealerships.find(d => d["Dealer Group"] === nextGroup)?.Region : undefined;
                              const isLastInRegion = currentRegion && currentRegion !== nextRegion && (currentRegion === "Metro" || currentRegion === "Regional" || currentRegion === "Independent");

                              return (
                                <React.Fragment key={group}>
                                  <CommandItem
                                    value={group}
                                    onSelect={() => {
                                      setLocalDealershipGroup(group);
                                      setLocalDealerId(null);
                                      setGroupSearchOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", localDealershipGroup === group ? "opacity-100" : "opacity-0")} />
                                    {group}
                                  </CommandItem>
                                  {isLastInRegion && (
                                    <CommandSeparator className="my-1" />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Popover open={dealershipSearchOpen} onOpenChange={setDealershipSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-[180px] justify-between" disabled={!localDealershipGroup}>
                        {localDealerId ? filteredDealerships.find(d => d["Dealer ID"] === localDealerId)?.Dealership : "All Dealerships"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 max-h-[320px] overflow-y-auto" align="start" onWheel={(e) => e.stopPropagation()}>
                      <Command>
                        <CommandInput placeholder="Search dealerships..." />
                        <CommandList>
                          <CommandEmpty>No dealership found.</CommandEmpty>
                          <CommandGroup>
                            {filteredDealerships.map((dealer) => (
                              <CommandItem key={dealer["Dealer ID"]} value={dealer.Dealership} onSelect={() => {
                                setLocalDealerId(dealer["Dealer ID"]);
                                setDealershipSearchOpen(false);
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", localDealerId === dealer["Dealer ID"] ? "opacity-100" : "opacity-0")} />
                                {dealer.Dealership}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {selectedWeekStarting ? (
                    <div className="p-2 px-3 bg-primary/10 rounded-md border border-primary/20 w-[160px]">
                      <p className="text-sm font-medium">{format(new Date(selectedWeekStarting), "MMM d, yyyy")}</p>
                    </div>
                  ) : (
                    <Select value={localWeekStarting || ""} onValueChange={setLocalWeekStarting}>
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Week Starting" /></SelectTrigger>
                      <SelectContent>
                        {availableWeeks.map((week) => (
                          <SelectItem key={week.date} value={week.date}>{week.display}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleContinueToForm} 
                    className="flex-1"
                  >
                    Create Forecast
                  </Button>
                </div>
              </div>
          </>
        ) : (
          // Stage 2: Forecast Form
          <>
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">New Weekly Report</DialogTitle>
                  <DialogDescription>
                    Weekly forecast, orders, activity, pipeline, and visits.
                  </DialogDescription>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-2 justify-end text-base font-medium mb-1">
                    <span>{localDealershipGroup}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{selectedDealershipName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    w/c {selectedWeekDisplay}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden p-6 pt-4">
                {/* Step Indicator */}
                <ForecastStepIndicator
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepChange}
                  steps={STEPS}
                />

                {/* Tabs */}
                <Tabs value={currentTabValue} onValueChange={(value) => {
                  const step = STEPS.find(s => s.tabValue === value);
                  if (step) handleStepChange(step.id);
                }} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="hidden">
                {STEPS.map(step => (
                  <TabsTrigger key={step.id} value={step.tabValue}>{step.label}</TabsTrigger>
                ))}
              </TabsList>
              <div className="flex-1 pr-2 flex flex-col overflow-hidden">
                {/* Forecast Tab */}
                <TabsContent value="forecast" className="mt-0 flex-1 flex flex-col">
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <ForecastTotalCard
                      title="Forecast Orders"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                      leftBgColor="bg-primary"
                      rightBgColor="bg-primary/10"
                      leftTextColor="text-white"
                    />
                    <ForecastTotalCard
                      title="Own Retail"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Retail").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Retail").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                    />
                    <ForecastTotalCard
                      title="Indirect Fleet"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Indirect Fleet").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Indirect Fleet").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                    />
                    <ForecastTotalCard
                      title="Direct Fleet"
                      mbTotal={form.watch("forecastRows")?.filter(r => r.brand === "Mercedes-Benz" && r.type === "Direct Fleet").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                      ftlTotal={form.watch("forecastRows")?.filter(r => r.brand === "Freightliner" && r.type === "Direct Fleet").reduce((sum, r) => sum + (r.qty || 0), 0) || 0}
                    />
                  </div>

                  <Card className="flex-1 flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle>Forecast Orders</CardTitle>
                        <Button type="button" onClick={handleAddRow} variant="outline" size="sm" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Order
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      {fields.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-center text-muted-foreground">No orders added. Click "Add Order" to start.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-1 overflow-y-auto">
                          <div className="grid grid-cols-[40px_70px_250px_100px_140px_200px_140px_140px_160px_80px] gap-2 font-semibold text-xs mb-2">
                            <div></div>
                            <div>QTY</div>
                            <div>Customer</div>
                            <div>Type</div>
                            <div>Brand</div>
                            <div>Model</div>
                            <div>Source</div>
                            <div>BDM</div>
                            <div>Est. Delivery</div>
                            <div>Upside</div>
                          </div>
                          {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-[40px_70px_250px_100px_140px_200px_140px_140px_160px_80px] gap-2 focus-within:bg-primary/5">
                              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="h-7 w-7 p-0">
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                              <FormField control={form.control} name={`forecastRows.${index}.qty`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" {...field} value={field.value ?? ''} className="h-9 text-sm" />
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.customerName`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} className="h-9 text-sm" />
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.customerType`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Existing">Existing</SelectItem>
                                        <SelectItem value="New">New</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.brand`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                                        <SelectItem value="Freightliner">Freightliner</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.model`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} className="h-9 text-sm" />
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.type`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Retail">Retail</SelectItem>
                                        <SelectItem value="Indirect Fleet">Indirect Fleet</SelectItem>
                                        <SelectItem value="Direct Fleet">Direct Fleet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.bdm`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Met in Person">Met in Person</SelectItem>
                                        <SelectItem value="Relationship">Relationship</SelectItem>
                                        <SelectItem value="Supported">Supported</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.estimatedDelivery`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} placeholder="Q1 2025" className="h-9 text-sm" />
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`forecastRows.${index}.upside`} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center justify-center h-9">
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )} />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Orders Received</CardTitle>
                      <CardDescription>Track orders received this week</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="mbtOrdersReceived" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Orders</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="ftlOrdersReceived" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Orders</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meeting Activity</CardTitle>
                      <CardDescription>Number of meetings held last week</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="conquestMeetings" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conquest Meetings *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="customerMeetings" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Meetings *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pipeline Tab */}
                <TabsContent value="pipeline" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pipeline Snapshot</CardTitle>
                      <CardDescription>Track pipeline growth and quarterly forecasts</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-6">
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-base">Pipeline Growth</h3>
                        <FormField control={form.control} name="mbtPipelineGrowth" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mercedes-Benz *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="ftlPipelineGrowth" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Freightliner *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-base">This Quarter</h3>
                        <FormField control={form.control} name="mbtPipelineThisQtr" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mercedes-Benz *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="ftlPipelineThisQtr" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Freightliner *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-base">Next Quarter</h3>
                        <FormField control={form.control} name="mbtPipelineNextQtr" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mercedes-Benz *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="ftlPipelineNextQtr" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Freightliner *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Lost Tab */}
                <TabsContent value="lost" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lost Opportunities</CardTitle>
                      <CardDescription>Track orders lost this week (optional)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Optional - add lost order details here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* BDM Visitations Tab */}
                <TabsContent value="bdmVisitations" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>BDM Visitations</CardTitle>
                      <CardDescription>Optional visitation tracking</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Skip this step or add visitation details.</p>
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
                />
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
