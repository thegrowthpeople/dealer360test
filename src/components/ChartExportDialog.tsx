import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ChartInfo {
  element: Element;
  title: string;
  index: number;
}

interface ChartExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charts: ChartInfo[];
  onExport: (selectedCharts: ChartInfo[]) => void;
}

export function ChartExportDialog({
  open,
  onOpenChange,
  charts,
  onExport,
}: ChartExportDialogProps) {
  const [selectedCharts, setSelectedCharts] = useState<Set<number>>(new Set());

  // Initialize all charts as selected when dialog opens
  useEffect(() => {
    if (open && charts.length > 0) {
      setSelectedCharts(new Set(charts.map((_, idx) => idx)));
    }
  }, [open, charts]);

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedCharts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCharts(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedCharts(new Set(charts.map((_, idx) => idx)));
  };

  const handleDeselectAll = () => {
    setSelectedCharts(new Set());
  };

  const handleExport = () => {
    const selected = charts.filter((_, idx) => selectedCharts.has(idx));
    if (selected.length > 0) {
      onExport(selected);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export to PowerPoint</DialogTitle>
          <DialogDescription>
            Select which charts to include in your presentation. Each chart will be on a separate slide.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="flex-1"
            >
              Deselect All
            </Button>
          </div>

          <Separator />

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {charts.map((chart, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`chart-${index}`}
                    checked={selectedCharts.has(index)}
                    onCheckedChange={() => handleToggle(index)}
                  />
                  <label
                    htmlFor={`chart-${index}`}
                    className="flex-1 text-sm font-medium leading-relaxed cursor-pointer"
                  >
                    {chart.title}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground">
            {selectedCharts.size} of {charts.length} charts selected
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedCharts.size === 0}
          >
            Export ({selectedCharts.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
