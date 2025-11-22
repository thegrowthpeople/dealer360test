import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ForecastStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  isNextDisabled?: boolean;
  nextDisabledReason?: string;
  isSaving?: boolean;
}

export const ForecastStepNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSave,
  isNextDisabled = false,
  nextDisabledReason = "Please complete this step before continuing",
  isSaving = false,
}: ForecastStepNavigationProps) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save & Close"}
        </Button>

        {!isLastStep && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={isNextDisabled}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </span>
            </TooltipTrigger>
            {isNextDisabled && (
              <TooltipContent>
                <p>{nextDisabledReason}</p>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
    </div>
  );
};
