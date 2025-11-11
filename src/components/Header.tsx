import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Download, Presentation } from "lucide-react";
import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";
import { usePerformanceFilters } from "@/contexts/PerformanceFiltersContext";

export const Header = () => {
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

  const handleExportPowerPoint = async () => {
    try {
      const pptx = new pptxgen();
      
      // Find the main content area (exclude header and sidebar)
      const mainContent = document.querySelector("main");
      if (!mainContent) return;
      
      // Find all individual chart cards
      // First get charts from .space-y-6 container (full-width charts)
      const fullWidthCharts = mainContent.querySelectorAll(".space-y-6 > div > div[class*='rounded-xl']");
      // Then get charts from grid layout (4 smaller charts)
      const gridCharts = mainContent.querySelectorAll(".grid > div[class*='rounded-xl']");
      
      // Combine all charts
      const allCharts = [...Array.from(fullWidthCharts), ...Array.from(gridCharts)];
      
      if (allCharts.length === 0) {
        console.warn("No charts found for export");
        return;
      }
      
      const filterLabel = getFilterLabel();
      
      // Capture each chart as a separate slide
      for (const chart of allCharts) {
        // Extract chart title from the card
        const titleElement = chart.querySelector("h3");
        const chartTitle = titleElement ? titleElement.textContent : "Chart";
        
        const canvas = await html2canvas(chart as HTMLElement, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        const slide = pptx.addSlide();
        const imgData = canvas.toDataURL("image/png");
        
        // Add slide title with chart name and filters
        slide.addText(chartTitle || "Chart", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.4,
          fontSize: 18,
          bold: true,
          color: "1a1a1a",
        });
        
        // Add filter information
        slide.addText(filterLabel, {
          x: 0.5,
          y: 0.65,
          w: 9,
          h: 0.3,
          fontSize: 12,
          color: "666666",
        });
        
        // Add chart image (adjusted position to accommodate header)
        slide.addImage({
          data: imgData,
          x: 0.5,
          y: 1.1,
          w: 9,
          h: 5.7,
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
      }
      
      // Save the presentation
      const today = new Date().toISOString().split("T")[0];
      await pptx.writeFile({ fileName: `Performance-Report-${today}.pptx` });
    } catch (error) {
      console.error("Error exporting to PowerPoint:", error);
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
            onClick={handleExportPowerPoint}
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
    </header>
  );
};
