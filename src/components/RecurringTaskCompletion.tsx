import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface RecurringTaskCompletionProps {
  completionId: number;
  onCompletionChange: (completed: boolean) => void;
}

interface CompletionDetails {
  id: number;
  completed: boolean;
  notes: string | null;
  recurrentSchedule: {
    schedule: {
      title: string;
      description: string | null;
    };
  };
}

export function RecurringTaskCompletion({
  completionId,
  onCompletionChange,
}: RecurringTaskCompletionProps) {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<CompletionDetails | null>(null);

  useEffect(() => {
    if (open) {
      fetchCompletionDetails();
    }
  }, [open]);

  const fetchCompletionDetails = async () => {
    try {
      const response = await fetch(
        `/api/recurring-task-completion/${completionId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch completion details");
      }
      const data = await response.json();
      setDetails(data);
      setCompleted(data.completed);
      setNotes(data.notes || "");
    } catch (error) {
      console.error("Error fetching completion details:", error);
      toast.error("Failed to load completion details");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/recurring-task-completion/${completionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed,
            notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update completion");
      }

      onCompletionChange(completed);
      toast.success("Task completion updated successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error updating completion:", error);
      toast.error("Failed to update task completion");
    } finally {
      setLoading(false);
    }
  };

  if (!details) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {completed ? "Completed" : "Mark as done"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{details.recurrentSchedule.schedule.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="completed"
              checked={completed}
              onCheckedChange={(checked) => setCompleted(checked as boolean)}
            />
            <Label htmlFor="completed">Mark as completed</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this task completion..."
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
