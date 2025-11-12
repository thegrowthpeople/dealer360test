import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  
  // Forecast fields
  mbtRetail: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlRetail: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtFleetIndirect: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlFleetIndirect: z.coerce.number().min(0, "Must be 0 or greater"),
  mbtFleetDirect: z.coerce.number().min(0, "Must be 0 or greater"),
  ftlFleetDirect: z.coerce.number().min(0, "Must be 0 or greater"),
});

type ForecastFormValues = z.infer<typeof forecastSchema>;

interface NewForecastDialogProps {
  selectedWeekStarting: string | null;
  selectedDealerId: number | null;
  selectedYear: number | null;
  selectedMonth: number | null;
  onSuccess: () => void;
}

export const NewForecastDialog = ({
  selectedWeekStarting,
  selectedDealerId,
  selectedYear,
  selectedMonth,
  onSuccess,
}: NewForecastDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
      mbtRetail: 0,
      ftlRetail: 0,
      mbtFleetIndirect: 0,
      ftlFleetIndirect: 0,
      mbtFleetDirect: 0,
      ftlFleetDirect: 0,
    },
  });

  const onSubmit = async (values: ForecastFormValues) => {
    if (!selectedWeekStarting) {
      toast({
        title: "Error",
        description: "Please select a week starting date",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDealerId) {
      toast({
        title: "Error",
        description: "Please select a dealership",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("Forecast").insert({
        "Dealer ID": selectedDealerId,
        "Forecast Date": selectedWeekStarting,
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
        "MBT Retail": values.mbtRetail,
        "FTL Retail": values.ftlRetail,
        "MBT Fleet Indirect": values.mbtFleetIndirect,
        "FTL Fleet Indirect": values.ftlFleetIndirect,
        "MBT Fleet Direct": values.mbtFleetDirect,
        "FTL Fleet Direct": values.ftlFleetDirect,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast entry created successfully",
      });

      form.reset();
      setOpen(false);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Forecast Entry</DialogTitle>
          <DialogDescription>
            Create a new forecast entry for{" "}
            {selectedWeekStarting && format(new Date(selectedWeekStarting), "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-4 mt-4">
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

              <TabsContent value="pipeline" className="space-y-4 mt-4">
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

              <TabsContent value="forecast" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Retail</CardTitle>
                    <CardDescription>Enter retail forecast data</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtRetail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Retail</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlRetail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Retail</FormLabel>
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
                    <CardTitle>Indirect Fleet</CardTitle>
                    <CardDescription>Enter indirect fleet forecast data</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtFleetIndirect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Indirect</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlFleetIndirect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Indirect</FormLabel>
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
                    <CardTitle>Direct Fleet</CardTitle>
                    <CardDescription>Enter direct fleet forecast data</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mbtFleetDirect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mercedes-Benz Direct</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ftlFleetDirect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freightliner Direct</FormLabel>
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
            </Tabs>

            <div className="flex justify-end gap-3">
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
