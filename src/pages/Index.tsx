import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Search, Target } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="max-w-3xl mx-auto text-center space-y-16">
        {/* Welcome Title */}
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-2">
            Welcome, Gary
          </h1>
        </div>

        {/* What would you like to do today */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">
            What would you like to do today?
          </h2>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <Button
              onClick={() => navigate("/performance")}
              variant="outline"
              size="lg"
              className="h-48 flex flex-col items-center justify-center gap-6 px-12 hover:bg-accent hover:scale-105 transition-all"
            >
              <TrendingUp size={96} />
              <span className="text-lg font-medium text-center leading-relaxed">
                Dealer<br />Performance
              </span>
            </Button>

            <Button
              onClick={() => navigate("/forecast")}
              variant="outline"
              size="lg"
              className="h-48 flex flex-col items-center justify-center gap-6 px-12 hover:bg-accent hover:scale-105 transition-all"
            >
              <Search size={96} />
              <span className="text-lg font-medium text-center leading-relaxed">
                Dealer<br />Forecast
              </span>
            </Button>

            <Button
              onClick={() => navigate("/business-plan")}
              variant="outline"
              size="lg"
              className="h-48 flex flex-col items-center justify-center gap-6 px-8 hover:bg-accent hover:scale-105 transition-all"
            >
              <Target size={96} />
              <span className="text-lg font-medium text-center leading-relaxed">
                Business Plan<br />Progress
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
