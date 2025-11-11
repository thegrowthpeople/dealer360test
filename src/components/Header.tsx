import { useState } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
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
  
  // Only show export buttons on Performance page
  const showExportButtons = location.pathname === "/performance";

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
    
    // Filter out summary cards (tiles without h3 titles) and only keep actual charts
    const allCharts: ChartInfo[] = allChartElements
      .filter(element => element.querySelector("h3")) // Only include elements with h3 titles
      .map((element, index) => {
        const titleElement = element.querySelector("h3");
        let title = titleElement ? titleElement.textContent || `Chart ${index + 1}` : `Chart ${index + 1}`;
        
        // Override titles for charts
        if (index === 0) {
          title = "Mercedes-Benz Total";
        } else if (index === 1) {
          title = "Freightliner Total";
        } else if (index === 2) {
          title = "Mercedes-Benz Retail";
        } else if (index === 3) {
          title = "Mercedes-Benz Fleet";
        } else if (index === 4) {
          title = "Freightliner Retail";
        } else if (index === 5) {
          title = "Freightliner Fleet";
        }
        
        return { element, title, index };
      });
    
    // Merge charts 3+4 and 5+6 for the picklist
    const charts: ChartInfo[] = [];
    for (let i = 0; i < allCharts.length; i++) {
      if (i === 2 && allCharts[3]) {
        // Merge Mercedes-Benz Retail (index 2) and Fleet (index 3)
        charts.push({
          element: allCharts[i].element, // Store the retail chart element
          title: "Mercedes-Benz Retail vs Fleet",
          index: i,
        });
        // Skip the next chart (Fleet) as it's now merged
        i++;
      } else if (i === 4 && allCharts[5]) {
        // Merge Freightliner Retail (index 4) and Fleet (index 5)
        charts.push({
          element: allCharts[i].element, // Store the retail chart element
          title: "Freightliner Retail vs Fleet",
          index: i,
        });
        // Skip the next chart (Fleet) as it's now merged
        i++;
      } else {
        charts.push(allCharts[i]);
      }
    }
    
    if (charts.length === 0) {
      toast({
        title: "No Charts Found",
        description: "No charts available to export",
        variant: "destructive",
      });
      return;
    }
    
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
        
        // Check if this is Mercedes-Benz Retail vs Fleet merged option
        if (chartTitle === "Mercedes-Benz Retail vs Fleet") {
          // Find both retail and fleet charts from the DOM
          const mainContent = document.querySelector("main");
          if (!mainContent) continue;
          
          const fullWidthCharts = mainContent.querySelectorAll(".space-y-6 > div[class*='rounded-']");
          const gridCharts = mainContent.querySelectorAll(".grid > div[class*='rounded-']");
          const allChartElements = [...Array.from(fullWidthCharts), ...Array.from(gridCharts)]
            .filter(element => element.querySelector("h3"));
          
          const retailChart = allChartElements[2]; // Index 2 is Mercedes-Benz Retail
          const fleetChart = allChartElements[3]; // Index 3 is Mercedes-Benz Fleet
          
          if (retailChart && fleetChart) {
            // Create combined slide for both Mercedes-Benz charts
            const retailCanvas = await html2canvas(retailChart as HTMLElement, {
              scale: 3,
              backgroundColor: "#ffffff",
              logging: false,
              useCORS: true,
            });
            
            const fleetCanvas = await html2canvas(fleetChart as HTMLElement, {
              scale: 3,
              backgroundColor: "#ffffff",
              logging: false,
              useCORS: true,
            });
            
            const slide = pptx.addSlide();
            const retailImgData = retailCanvas.toDataURL("image/png");
            const fleetImgData = fleetCanvas.toDataURL("image/png");
            
            // Add combined title
            const fullTitle = `Mercedes-Benz Retail & Fleet - ${filterLabel}`;
            slide.addText(fullTitle, {
              x: 0.3,
              y: 0.15,
              w: 9,
              h: 0.4,
              fontSize: 18,
              bold: true,
              color: "1a1a1a",
              align: "left",
            });
            
            // Calculate dimensions for side-by-side layout
            const maxWidth = 4.3; // Width for each chart
            const maxHeight = 4.5;
            
            // Retail chart on the left
            const retailAspectRatio = retailCanvas.width / retailCanvas.height;
            let retailImgWidth = maxWidth;
            let retailImgHeight = maxWidth / retailAspectRatio;
            if (retailImgHeight > maxHeight) {
              retailImgHeight = maxHeight;
              retailImgWidth = maxHeight * retailAspectRatio;
            }
            
            slide.addImage({
              data: retailImgData,
              x: 0.5,
              y: 0.7,
              w: retailImgWidth,
              h: retailImgHeight,
            });
            
            // Fleet chart on the right
            const fleetAspectRatio = fleetCanvas.width / fleetCanvas.height;
            let fleetImgWidth = maxWidth;
            let fleetImgHeight = maxWidth / fleetAspectRatio;
            if (fleetImgHeight > maxHeight) {
              fleetImgHeight = maxHeight;
              fleetImgWidth = maxHeight * fleetAspectRatio;
            }
            
            slide.addImage({
              data: fleetImgData,
              x: 5.2,
              y: 0.7,
              w: fleetImgWidth,
              h: fleetImgHeight,
            });
            
            // Add footer
            slide.addText("STRICTLY INTERNAL USE ONLY - PRIVATE & CONFIDENTIAL", {
              x: 0.5,
              y: 5.3,
              w: 9,
              h: 0.2,
              fontSize: 6,
              align: "center",
            });
            
            continue;
          }
        }
        
        // Check if this is Freightliner Retail vs Fleet merged option
        if (chartTitle === "Freightliner Retail vs Fleet") {
          // Find both retail and fleet charts from the DOM
          const mainContent = document.querySelector("main");
          if (!mainContent) continue;
          
          const fullWidthCharts = mainContent.querySelectorAll(".space-y-6 > div[class*='rounded-']");
          const gridCharts = mainContent.querySelectorAll(".grid > div[class*='rounded-']");
          const allChartElements = [...Array.from(fullWidthCharts), ...Array.from(gridCharts)]
            .filter(element => element.querySelector("h3"));
          
          const retailChart = allChartElements[4]; // Index 4 is Freightliner Retail
          const fleetChart = allChartElements[5]; // Index 5 is Freightliner Fleet
          
          if (retailChart && fleetChart) {
            // Create combined slide for both Freightliner charts
            const retailCanvas = await html2canvas(retailChart as HTMLElement, {
              scale: 3,
              backgroundColor: "#ffffff",
              logging: false,
              useCORS: true,
            });
            
            const fleetCanvas = await html2canvas(fleetChart as HTMLElement, {
              scale: 3,
              backgroundColor: "#ffffff",
              logging: false,
              useCORS: true,
            });
            
            const slide = pptx.addSlide();
            const retailImgData = retailCanvas.toDataURL("image/png");
            const fleetImgData = fleetCanvas.toDataURL("image/png");
            
            // Add combined title
            const fullTitle = `Freightliner Retail & Fleet - ${filterLabel}`;
            slide.addText(fullTitle, {
              x: 0.3,
              y: 0.15,
              w: 9,
              h: 0.4,
              fontSize: 18,
              bold: true,
              color: "1a1a1a",
              align: "left",
            });
            
            // Calculate dimensions for side-by-side layout
            const maxWidth = 4.3; // Width for each chart
            const maxHeight = 4.5;
            
            // Retail chart on the left
            const retailAspectRatio = retailCanvas.width / retailCanvas.height;
            let retailImgWidth = maxWidth;
            let retailImgHeight = maxWidth / retailAspectRatio;
            if (retailImgHeight > maxHeight) {
              retailImgHeight = maxHeight;
              retailImgWidth = maxHeight * retailAspectRatio;
            }
            
            slide.addImage({
              data: retailImgData,
              x: 0.5,
              y: 0.7,
              w: retailImgWidth,
              h: retailImgHeight,
            });
            
            // Fleet chart on the right
            const fleetAspectRatio = fleetCanvas.width / fleetCanvas.height;
            let fleetImgWidth = maxWidth;
            let fleetImgHeight = maxWidth / fleetAspectRatio;
            if (fleetImgHeight > maxHeight) {
              fleetImgHeight = maxHeight;
              fleetImgWidth = maxHeight * fleetAspectRatio;
            }
            
            slide.addImage({
              data: fleetImgData,
              x: 5.2,
              y: 0.7,
              w: fleetImgWidth,
              h: fleetImgHeight,
            });
            
            // Add footer
            slide.addText("STRICTLY INTERNAL USE ONLY - PRIVATE & CONFIDENTIAL", {
              x: 0.5,
              y: 5.3,
              w: 9,
              h: 0.2,
              fontSize: 6,
              align: "center",
            });
            
            continue;
          }
        }
        
      const canvas = await html2canvas(chart as HTMLElement, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });
      
      const slide = pptx.addSlide();
      const imgData = canvas.toDataURL("image/png");
      
      // Combine chart title with filter information
      const fullTitle = `${chartTitle} - ${filterLabel}`;
      
      // Add single slide title with chart name and filters
      slide.addText(fullTitle, {
        x: 0.3,
        y: 0.15,
        w: 9,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: "1a1a1a",
        align: "left",
      });
      
      // Calculate proper dimensions to maintain aspect ratio and fit on slide
      const maxWidth = 9;
      const maxHeight = 4.8; // Reduced height to ensure horizontal charts fit better
      const aspectRatio = canvas.width / canvas.height;
      
      let imgWidth = maxWidth;
      let imgHeight = maxWidth / aspectRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * aspectRatio;
      }
      
      // Center the image horizontally
      const imgX = 0.5 + (maxWidth - imgWidth) / 2;
      
      // Add chart image with proper sizing (positioned closer to title)
      slide.addImage({
        data: imgData,
        x: imgX,
        y: 0.7,
        w: imgWidth,
        h: imgHeight,
      });
        
        // Add footer
        slide.addText("STRICTLY INTERNAL USE ONLY - PRIVATE & CONFIDENTIAL", {
          x: 0.5,
          y: 5.3,
          w: 9,
          h: 0.2,
          fontSize: 6,
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
        description: `Successfully created presentation`,
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
          {showExportButtons && (
            <>
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
            </>
          )}
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
