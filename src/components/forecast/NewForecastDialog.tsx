import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isMonday } from "date-fns";
import { Check, ChevronsUpDown, Building2, MapPin, Plus, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { ForecastStepIndicator } from "./ForecastStepIndicator";
import { ForecastStepNavigation } from "./ForecastStepNavigation";
import { cn } from "@/lib/utils";

const forecastSchema = z.object({
  conquestMeetings: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  customerMeetings: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtPipelineGrowth: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlPipelineGrowth: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtPipelineThisQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  mbtPipelineNextQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlPipelineThisQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  ftlPipelineNextQtr: z.coerce.number().min(0, "Must be 0 or greater").nullable(),
  forecastRows: z.array(z.object({
    qty: z.coerce.number().min(1, "QTY is required").nullable(),
    customerName: z.string().min(1, "Customer Name is required"),
    brand: z.enum(["Mercedes-Benz", "Freightliner"]).nullable(),
    model: z.string().min(1, "Model is required"),
    type: z.enum(["Retail", "Indirect Fleet", "Direct Fleet"]).nullable(),
    estimatedDelivery: z.string().min(1, "Est. Delivery is required"),
  })),
});

type ForecastFormValues = z.infer<typeof forecastSchema>;

const STEPS = [
  { id: 1, label: "BDM Visitations", shortLabel: "BDM Visits", tabValue: "bdmVisitations" },
  { id: 2, label: "Activity", shortLabel: "Activity", tabValue: "activity" },
  { id: 3, label: "Pipeline", shortLabel: "Pipeline", tabValue: "pipeline" },
  { id: 4, label: "Lost Opportunities", shortLabel: "Lost", tabValue: "lost" },
  { id: 5, label: "Orders Received", shortLabel: "Orders", tabValue: "orders" },
  { id: 6, label: "Forecast", shortLabel: "Forecast", tabValue: "forecast" },
];

interface NewForecastDialogProps {
  onSuccess: () => void;
}

export const NewForecastDialog = ({ onSuccess }: NewForecastDialogProps) => {
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

  // Calculate available weeks
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
      mbtPipelineGrowth: null,
      ftlPipelineGrowth: null,
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
        return true;
      case 2:
        return values.conquestMeetings !== null && values.customerMeetings !== null;
      case 3:
        return (
          values.mbtPipelineGrowth !== null &&
          values.ftlPipelineGrowth !== null &&
          values.mbtPipelineThisQtr !== null &&
          values.ftlPipelineThisQtr !== null &&
          values.mbtPipelineNextQtr !== null &&
          values.ftlPipelineNextQtr !== null
        );
      case 4:
      case 5:
        return true;
      case 6:
        return values.forecastRows.length > 0 && values.forecastRows.every(row => 
          row.qty && row.qty > 0 &&
          row.customerName?.trim() &&
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

  const handleAddRow = () => {
    append({
      qty: null,
      customerName: "",
      brand: null,
      model: "",
      type: null,
      estimatedDelivery: "",
    });
  };

  const onSubmit = async (values: ForecastFormValues) => {
    toast({
      title: "Test Mode",
      description: "Forecast submission - closing modal",
    });
    setOpen(false);
    form.reset();
    setCurrentStep(1);
    setCompletedSteps(new Set());
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
            {/* Dealership Selection */}
            <Card className="mb-6 animate-fade-in border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dealership & Period Selection
                </CardTitle>
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
                          className="w-full justify-between"
                        >
                          {localDealershipGroup || "Select group..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 max-h-[320px] overflow-y-auto" align="start" onWheel={(e) => e.stopPropagation()}>
                        <Command>
                          <CommandInput placeholder="Search groups..." />
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
                                      setLocalDealerId(null);
                                      setGroupSearchOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", localDealershipGroup === group ? "opacity-100" : "opacity-0")} />
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
                          <CommandInput placeholder="Search dealerships..." />
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
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", localDealerId === dealer["Dealer ID"] ? "opacity-100" : "opacity-0")} />
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
                      <Select value={localWeekStarting || ""} onValueChange={setLocalWeekStarting}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select week" />
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

            {/* Tabs */}
            <Tabs value={currentTabValue} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="hidden">
                {STEPS.map(step => (
                  <TabsTrigger key={step.id} value={step.tabValue}>{step.label}</TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-2">
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

                <TabsContent value="activity" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meeting Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="conquestMeetings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conquest Meetings *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
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
                            <FormLabel>Customer Meetings *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pipeline" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pipeline Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="mbtPipelineGrowth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>MB Growth *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
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
                              <FormLabel>FTL Growth *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mbtPipelineThisQtr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>MB This Quarter *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
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
                              <FormLabel>FTL This Quarter *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mbtPipelineNextQtr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>MB Next Quarter *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
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
                              <FormLabel>FTL Next Quarter *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="lost" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lost Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Optional - track lost orders here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="orders" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Orders Received</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Optional - record orders received.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="forecast" className="mt-0">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Forecast Orders</CardTitle>
                        <Button type="button" onClick={handleAddRow} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Order
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {fields.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No orders added yet. Click "Add Order" to start.</p>
                      ) : (
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <Card key={field.id} className="p-4">
                              <div className="grid grid-cols-5 gap-3">
                                <FormField
                                  control={form.control}
                                  name={`forecastRows.${index}.qty`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">QTY *</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} value={field.value ?? ''} />
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
                                        <Input {...field} />
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
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Mercedes-Benz">MB</SelectItem>
                                          <SelectItem value="Freightliner">FTL</SelectItem>
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
                                        <Input {...field} />
                                      </FormControl>
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
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="mt-2 gap-2 text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </Button>
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
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
