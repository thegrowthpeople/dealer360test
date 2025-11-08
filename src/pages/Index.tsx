import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, LineChart, BarChart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="max-w-3xl mx-auto text-center space-y-16">
        {/* Welcome Title */}
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-2">
            Welcome, Gary Parker
          </h1>
        </div>

        {/* What would you like to do today */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">
            What would you like to do today?
          </h2>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Button
              onClick={() => navigate("/performance")}
              variant="outline"
              size="lg"
              className="h-32 flex flex-col gap-3 hover:bg-accent hover:scale-105 transition-all"
            >
              <TrendingUp className="h-8 w-8" />
              <span className="text-base font-medium">View Dealer Performance</span>
            </Button>

            <Button
              onClick={() => navigate("/forecast")}
              variant="outline"
              size="lg"
              className="h-32 flex flex-col gap-3 hover:bg-accent hover:scale-105 transition-all"
            >
              <LineChart className="h-8 w-8" />
              <span className="text-base font-medium">Review Forecast</span>
            </Button>

            <Button
              onClick={() => navigate("/business-plan")}
              variant="outline"
              size="lg"
              className="h-32 flex flex-col gap-3 hover:bg-accent hover:scale-105 transition-all"
            >
              <BarChart className="h-8 w-8" />
              <span className="text-base font-medium">Examine Business Plan</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
