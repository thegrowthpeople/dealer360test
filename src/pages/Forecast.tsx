import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

const Forecast = () => {
  return (
    <ComingSoon
      icon={LineChart}
      title="Forecast"
      description="View and manage your delivery forecasts. This feature is coming soon."
    />
  );
};

export default Forecast;
