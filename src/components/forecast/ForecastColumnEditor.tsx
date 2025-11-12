import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

interface ForecastColumnEditorProps {
  form: UseFormReturn<any>;
  brandFieldName: string;
  brandLabel: string;
  title: string;
}

export const ForecastColumnEditor = ({
  form,
  brandFieldName,
  brandLabel,
  title,
}: ForecastColumnEditorProps) => {
  const rows = form.watch(brandFieldName) || [];
  const total = rows.reduce((sum: number, row: any) => {
    const qty = typeof row.qty === 'string' ? parseFloat(row.qty) || 0 : (row.qty || 0);
    return sum + qty;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
        <p className="text-sm font-medium text-muted-foreground">{brandLabel}</p>
        <p className="text-2xl font-bold">{total}</p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {Array.from({ length: 15 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[70px_1fr_1fr] gap-2">
            <FormField
              control={form.control}
              name={`${brandFieldName}.${index}.qty`}
              render={({ field }) => (
                <FormItem>
                  {index === 0 && <FormLabel className="text-xs">QTY</FormLabel>}
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm"
                      placeholder="0"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${brandFieldName}.${index}.customer`}
              render={({ field }) => (
                <FormItem>
                  {index === 0 && <FormLabel className="text-xs">Customer</FormLabel>}
                  <FormControl>
                    <Input
                      {...field}
                      className="h-9 text-sm"
                      placeholder="Customer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${brandFieldName}.${index}.model`}
              render={({ field }) => (
                <FormItem>
                  {index === 0 && <FormLabel className="text-xs">Model</FormLabel>}
                  <FormControl>
                    <Input
                      {...field}
                      className="h-9 text-sm"
                      placeholder="Model"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
