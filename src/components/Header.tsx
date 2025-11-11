import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Download, Presentation } from "lucide-react";
import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";
import { useToast } from "@/hooks/use-toast";
import { ChartExportDialog } from "./ChartExportDialog";

interface ChartInfo {
  element: Element;
  title: string;
  index: number;
}

export const Header = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableCharts, setAvailableCharts] = useState<ChartInfo[]>([]);
  
  const {
    selectedBDMId,
    selectedGroup,
    selectedDealerId,
    selectedYear,
    dealerships,
    bdms,
  } = usePerformanceFilters();

  const handleExportPDF = () => {
    // Trigger browser print dialog which can save as PDF
    window.print();
  };

  const getFilterLabel = () => {
    const parts = [];
    
    if (selectedDealerId !== null) {
      const dealer = dealerships.find((d) => d["Dealer ID"] === selectedDealerId);
      if (dealer) {
        parts.push(`${dealer["Dealer Group"]} - ${dealer.Dealership}`);
      }
    } else if (selectedGroup !== null) {
      parts.push(selectedGroup);
    } else if (selectedBDMId !== null) {
      const bdm = bdms.find((b) => b["BDM ID"] === selectedBDMId);
      if (bdm) {
        parts.push(bdm["Full Name"]);
      }
    } else {
      parts.push("All Dealerships");
    }
    
    if (selectedYear) {
      parts.push(`${selectedYear}`);
    }
    
    return parts.join(" | ");
  };

  const handleOpenExportDialog = () => {
    // Find the main content area (exclude header and sidebar)
    const mainContent = document.querySelector("main");
    if (!mainContent) return;
    
    // Find all individual chart cards (Card components have rounded-lg class)
    const fullWidthCharts = mainContent.querySelectorAll(".space-y-6 > div[class*='rounded-']");
    const gridCharts = mainContent.querySelectorAll(".grid > div[class*='rounded-']");
    
    // Combine all charts and extract their information
    const allChartElements = [...Array.from(fullWidthCharts), ...Array.from(gridCharts)];
    
    if (allChartElements.length === 0) {
      toast({
        title: "No Charts Found",
        description: "No charts available to export",
        variant: "destructive",
      });
      return;
    }
    
    const charts: ChartInfo[] = allChartElements.map((element, index) => {
      const titleElement = element.querySelector("h3");
      const title = titleElement ? titleElement.textContent || `Chart ${index + 1}` : `Chart ${index + 1}`;
      return { element, title, index };
    });
    
    setAvailableCharts(charts);
    setDialogOpen(true);
  };

  const handleExportPowerPoint = async (selectedCharts: ChartInfo[]) => {
    try {
      const pptx = new pptxgen();
      
      // Show initial loading toast
      toast({
        title: "Generating PowerPoint",
        description: `Starting export of ${selectedCharts.length} slides...`,
      });
      
      const filterLabel = getFilterLabel();
      
      // Capture each selected chart as a separate slide
      for (let i = 0; i < selectedCharts.length; i++) {
        const chartInfo = selectedCharts[i];
        const chart = chartInfo.element;
        const chartTitle = chartInfo.title;
        
      const canvas = await html2canvas(chart as HTMLElement, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });
      
      const slide = pptx.addSlide();
      const imgData = canvas.toDataURL("image/png");
      
      // Add slide title with chart name and filters
      slide.addText(chartTitle || "Chart", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 20,
        bold: true,
        color: "1a1a1a",
      });
      
      // Add filter information
      slide.addText(filterLabel, {
        x: 0.5,
        y: 0.85,
        w: 9,
        h: 0.3,
        fontSize: 11,
        color: "666666",
      });
      
      // Calculate proper dimensions to maintain aspect ratio and fit on slide
      const maxWidth = 9;
      const maxHeight = 5.2;
      const aspectRatio = canvas.width / canvas.height;
      
      let imgWidth = maxWidth;
      let imgHeight = maxWidth / aspectRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * aspectRatio;
      }
      
      // Center the image horizontally
      const imgX = 0.5 + (maxWidth - imgWidth) / 2;
      
      // Add chart image with proper sizing
      slide.addImage({
        data: imgData,
        x: imgX,
        y: 1.3,
        w: imgWidth,
        h: imgHeight,
      });
        
        // Add footer
        slide.addText("STRICTLY INTERNAL USE ONLY - PRIVATE & CONFIDENTIAL", {
          x: 0.5,
          y: 7,
          w: 9,
          h: 0.3,
          fontSize: 10,
          bold: true,
          align: "center",
        });
        
        // Show progress update for key milestones
        if ((i + 1) % 2 === 0 || i === selectedCharts.length - 1) {
          toast({
            title: "Generating PowerPoint",
            description: `Processing ${i + 1} of ${selectedCharts.length} slides...`,
          });
        }
      }
      
      // Save the presentation
      toast({
        title: "Saving PowerPoint",
        description: "Finalizing your presentation...",
      });
      
      const today = new Date().toISOString().split("T")[0];
      await pptx.writeFile({ fileName: `Performance-Report-${today}.pptx` });
      
      // Show success toast
      toast({
        title: "PowerPoint Generated",
        description: `Successfully created ${selectedCharts.length} slides`,
      });
    } catch (error) {
      console.error("Error exporting to PowerPoint:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PowerPoint presentation",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-20 h-16">
      <div className="px-6 xl:px-12 2xl:px-16 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <a href="https://www.daimlertruck.com.au/" target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="Daimler Truck" className="h-8 dark:invert transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer" />
          </a>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenExportDialog}
            title="Export to PowerPoint"
          >
            <Presentation className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportPDF}
            title="Export to PDF"
          >
            <Download className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
      
      <ChartExportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        charts={availableCharts}
        onExport={handleExportPowerPoint}
      />
    </header>
  );
};
