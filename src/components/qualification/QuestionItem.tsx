import { useState } from "react";
import { Plus, Minus, HelpCircle, FileText } from "lucide-react";
import { QuestionData, QuestionState } from "@/types/scorecard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface QuestionItemProps {
  question: string;
  data: QuestionData;
  onStateChange: (state: QuestionState) => void;
  onNoteChange: (note: string) => void;
  disabled?: boolean;
}

export const QuestionItem = ({ question, data, onStateChange, onNoteChange, disabled = false }: QuestionItemProps) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState(data.note);
  
  const states: QuestionState[] = ["blank", "unknown", "positive", "negative"];
  
  const getNextState = (current: QuestionState): QuestionState => {
    const currentIndex = states.indexOf(current);
    return states[(currentIndex + 1) % states.length];
  };

  const handleClick = () => {
    if (!disabled) {
      onStateChange(getNextState(data.state));
    }
  };

  const handleNoteSave = () => {
    if (!disabled) {
      onNoteChange(noteText);
      setIsNotesOpen(false);
    }
  };

  const hasNotes = data.note && data.note.trim().length > 0;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex-1 text-left flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all duration-200",
          !disabled && "hover:shadow-md hover:-translate-y-0.5",
          disabled && "cursor-not-allowed opacity-60",
          data.state === "blank" && "border-border bg-card hover:border-muted-foreground/30",
          data.state === "unknown" && "border-warning bg-warning/5 hover:border-warning hover:bg-warning/10",
          data.state === "positive" && "border-success bg-success/5 hover:border-success hover:bg-success/10",
          data.state === "negative" && "border-destructive bg-destructive/5 hover:border-destructive hover:bg-destructive/10"
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-all",
            data.state === "blank" && "bg-muted",
            data.state === "unknown" && "bg-warning/20",
            data.state === "positive" && "bg-success/20",
            data.state === "negative" && "bg-destructive/20"
          )}
        >
          {data.state === "unknown" && <HelpCircle className="w-5 h-5 text-warning" />}
          {data.state === "positive" && <Plus className="w-5 h-5 text-success font-bold" />}
          {data.state === "negative" && <Minus className="w-5 h-5 text-destructive font-bold" />}
        </div>
        
        <span className="flex-1 text-sm font-medium text-foreground">{question}</span>
      </button>

      <Dialog open={isNotesOpen} onOpenChange={disabled ? undefined : setIsNotesOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className={cn(
              "flex-shrink-0 relative",
              hasNotes && "border-primary bg-primary/10 hover:bg-primary/20"
            )}
          >
            <FileText className={cn("w-4 h-4", hasNotes && "text-primary")} />
            {hasNotes && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{question}</DialogTitle>
            <p className="text-sm text-muted-foreground">Evidence to support and notes</p>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your notes here..."
              className="min-h-[150px]"
              disabled={disabled}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNotesOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleNoteSave} disabled={disabled}>
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
