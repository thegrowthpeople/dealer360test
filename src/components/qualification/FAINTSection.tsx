import { useState, useEffect } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { FAINTComponent, QuestionState } from "@/types/scorecard";
import { QuestionItem } from "@/components/qualification/QuestionItem";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FAINTSectionProps {
  title: string;
  color: string;
  component: FAINTComponent;
  questions: string[];
  onUpdate: (index: number, state: QuestionState, note: string) => void;
  forceExpanded?: boolean;
}

export const FAINTSection = ({ 
  title, 
  color, 
  component, 
  questions, 
  onUpdate,
  forceExpanded,
}: FAINTSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    if (typeof forceExpanded === "boolean") {
      setIsExpanded(forceExpanded);
    }
  }, [forceExpanded]);
  
  const positiveCount = component.questions.filter((q) => q.state === "positive").length;
  const negativeCount = component.questions.filter((q) => q.state === "negative").length;
  const notesCount = component.questions.filter((q) => q.note && q.note.trim().length > 0).length;

  const getStatusColor = () => {
    if (positiveCount >= 6) return "bg-success";
    if (positiveCount >= 4) return "bg-warning";
    return "bg-destructive";
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors rounded-t-xl"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center shadow-sm",
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
                  className="bg-success/10 border-success/30 text-success flex items-center gap-1 px-2 py-1"
                >
                  <Plus className="w-3 h-3" />
                  <span className="font-semibold">{positiveCount}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-1 px-2 py-1"
                >
                  <Minus className="w-3 h-3" />
                  <span className="font-semibold">{negativeCount}</span>
                </Badge>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
