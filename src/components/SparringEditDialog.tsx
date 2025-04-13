"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SparringEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sparringId: number;
  initialNotes: string;
}

export default function SparringEditDialog({
  isOpen,
  onOpenChange,
  sparringId,
  initialNotes,
}: SparringEditDialogProps) {
  const [editNotes, setEditNotes] = useState(initialNotes);

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/sparring/${sparringId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: editNotes }),
      });

      if (!response.ok) {
        throw new Error("Failed to update sparring record");
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating sparring record:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sparring Notes</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={editNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setEditNotes(e.target.value)
            }
            placeholder="Enter notes..."
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
