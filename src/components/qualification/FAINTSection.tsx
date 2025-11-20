import { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { FAINTComponent, QuestionState } from "@/types/scorecard";
import { QuestionItem } from "@/components/qualification/QuestionItem";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FAINTSectionProps {
  title: string;
  color: string;
  component: FAINTComponent;
  questions: string[];
  onUpdate: (index: number, state: QuestionState, note: string) => void;
}

export const FAINTSection = ({ title, color, component, questions, onUpdate }: FAINTSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const positiveCount = component.questions.filter((q) => q.state === "positive").length;
  const negativeCount = component.questions.filter((q) => q.state === "negative").length;
  const notesCount = component.questions.filter((q) => q.note && q.note.trim().length > 0).length;

  // Determine color based on positive question count
  const getStatusColor = () => {
    if (positiveCount >= 6) {
      return "bg-success"; // Green - 6 to 8 questions with +
    } else if (positiveCount >= 4) {
      return "bg-warning"; // Amber - 4 to 5 questions with +
    } else {
      return "bg-destructive"; // Red - 0 to 3 questions with +
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-all duration-300 rounded-t-xl w-full text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-110",
              getStatusColor()
            )}
          >
            <span className="text-2xl font-bold text-white">{title[0]}</span>
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {notesCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {notesCount} {notesCount === 1 ? "note" : "notes"} added
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-success/10 border-success/30 text-success hover:bg-success/20 flex items-center gap-1 px-2 py-1"
            >
              <Plus className="w-3 h-3" />
              <span className="font-semibold">{positiveCount}</span>
            </Badge>
            <Badge
              variant="outline"
              className="bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 flex items-center gap-1 px-2 py-1"
            >
              <Minus className="w-3 h-3" />
              <span className="font-semibold">{negativeCount}</span>
            </Badge>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border">
          {questions.map((question, index) => (
            <QuestionItem
              key={index}
              question={question}
              data={component.questions[index]}
              onStateChange={(state) => onUpdate(index, state, component.questions[index].note)}
              onNoteChange={(note) => onUpdate(index, component.questions[index].state, note)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
