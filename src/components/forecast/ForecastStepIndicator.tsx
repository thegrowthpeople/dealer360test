import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Step {
  id: number;
  label: string;
  shortLabel: string;
}

interface ForecastStepIndicatorProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
  steps: Step[];
}

export const ForecastStepIndicator = ({
  currentStep,
  completedSteps,
  onStepClick,
  steps,
}: ForecastStepIndicatorProps) => {
  const progress = (completedSteps.size / steps.length) * 100;

  return (
    <div className="space-y-4 mb-6 animate-fade-in">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-6 gap-2">
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStepClick(step.id);
              }}
              className={cn(
                "group relative flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                "border-2 text-center cursor-pointer",
                isCompleted && "border-green-500 bg-green-500/10 hover:bg-green-500/20",
                isCurrent && "border-primary bg-primary/10 hover:bg-primary/20",
                !isCompleted && !isCurrent && "border-red-500 bg-red-500/10 hover:bg-red-500/20"
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-red-500 text-white"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "text-xs font-medium leading-tight",
                  isCompleted && "text-green-700 dark:text-green-400",
                  isCurrent && "text-primary",
                  !isCompleted && !isCurrent && "text-red-700 dark:text-red-400"
                )}
              >
                {step.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
