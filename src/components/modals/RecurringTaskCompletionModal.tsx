"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

interface RecurringTaskCompletion {
  id: number;
  recurrentId: number;
  date: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  recurrentSchedule?: {
    id: number;
    schedId: number;
    reccurencePattern: string;
    time_of_day: string;
    startDate: Date;
    endDate: Date;
    schedule?: {
      id: number;
      taskName: string;
      taskDesc?: string;
      taskType: string;
      taskCategory: string;
      status: string;
    };
  };
}

interface RecurringTaskCompletionModalProps {
  completionId: string;
  onClose: () => void;
}

export default function RecurringTaskCompletionModal({
  completionId,
  onClose,
}: RecurringTaskCompletionModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [completion, setCompletion] = useState<RecurringTaskCompletion | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletionDetails = async () => {
      try {
        setIsLoading(true);

        // Fetch the completion details
        const response = await fetch(
          `/api/recurring-task-completion/${completionId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch completion details");
        }

        const data = await response.json();
        setCompletion(data);
      } catch (err) {
        console.error("Error fetching completion details:", err);
        setError("Failed to load completion information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionDetails();
  }, [completionId]);

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Loading Completion Details...
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !completion) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Error
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-red-500 dark:text-red-400">
              {error || "Completion details not found"}
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleToggleCompletion = async () => {
    try {
      const newStatus = completion.completed ? "ASSIGNED" : "FINISHED";

      const response = await fetch("/api/tasks/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: `recurrent-${completion.recurrentId}-${format(
            new Date(completion.date),
            "yyyy-MM-dd"
          )}`,
          status: newStatus,
          date: format(new Date(completion.date), "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update completion status");
      }

      // Update local state
      setCompletion({
        ...completion,
        completed: !completion.completed,
      });
    } catch (error) {
      console.error("Error updating completion status:", error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {completion.recurrentSchedule?.schedule?.taskName ||
              "Task Completion Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Date:</span>{" "}
                {format(new Date(completion.date), "MMMM d, yyyy")}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span
                  className={`flex items-center gap-1 ${
                    completion.completed
                      ? "text-green-600 dark:text-green-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {completion.completed ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Pending</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Task Information
            </h3>
            <div className="space-y-4">
              {completion.recurrentSchedule?.schedule?.taskName && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Task Name
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {completion.recurrentSchedule.schedule.taskName}
                  </p>
                </div>
              )}

              {completion.recurrentSchedule?.schedule?.taskDesc && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Description
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {completion.recurrentSchedule.schedule.taskDesc}
                  </p>
                </div>
              )}

              {completion.recurrentSchedule?.reccurencePattern && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recurrence Pattern
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {completion.recurrentSchedule.reccurencePattern}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completion.recurrentSchedule?.startDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start Date
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {format(
                        new Date(completion.recurrentSchedule.startDate),
                        "MMMM d, yyyy"
                      )}
                    </p>
                  </div>
                )}

                {completion.recurrentSchedule?.endDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {format(
                        new Date(completion.recurrentSchedule.endDate),
                        "MMMM d, yyyy"
                      )}
                    </p>
                  </div>
                )}
              </div>

              {completion.recurrentSchedule?.time_of_day && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Time of Day
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {completion.recurrentSchedule.time_of_day}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button
              variant={completion.completed ? "outline" : "default"}
              onClick={handleToggleCompletion}
              className={
                completion.completed
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }
            >
              {completion.completed ? "Mark as Incomplete" : "Mark as Complete"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
