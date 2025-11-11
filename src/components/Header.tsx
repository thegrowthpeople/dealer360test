import { cn } from "@/lib/utils";
import logo from "@/assets/logo-black.svg";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Download, Presentation } from "lucide-react";
import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";

export const Header = () => {
  const handleExportPDF = () => {
    // Trigger browser print dialog which can save as PDF
    window.print();
  };

  const handleExportPowerPoint = async () => {
    try {
      const pptx = new pptxgen();
      
      // Find the main content area (exclude header and sidebar)
      const mainContent = document.querySelector("main");
      if (!mainContent) return;
      
      // Find all chart rows (space-y-6 > div elements)
      const chartContainers = mainContent.querySelectorAll(".space-y-6 > div");
      
      if (chartContainers.length === 0) {
        // No charts found, capture entire main content
        const canvas = await html2canvas(mainContent as HTMLElement, {
          scale: 2,
          backgroundColor: "#ffffff",
        });
        
        const slide = pptx.addSlide();
        const imgData = canvas.toDataURL("image/png");
        slide.addImage({
          data: imgData,
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 6.5,
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
      } else {
        // Capture each chart row as a separate slide
        for (const container of Array.from(chartContainers)) {
          const canvas = await html2canvas(container as HTMLElement, {
            scale: 2,
            backgroundColor: "#ffffff",
          });
          
          const slide = pptx.addSlide();
          const imgData = canvas.toDataURL("image/png");
          
          // Add chart image
          slide.addImage({
            data: imgData,
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 6.5,
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
