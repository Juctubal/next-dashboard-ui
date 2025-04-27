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

interface TaskDetails {
  id: string;
  title: string;
  date: Date;
  type: "oneTime" | "recurrent";
  status: string;
  taskName?: string;
  taskDesc?: string;
  taskDate?: Date;
  reccurencePattern?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  time_of_day?: string;
}

interface StaffTaskDetailsModalProps {
  taskId: string;
  onClose: () => void;
}

export default function StaffTaskDetailsModal({
  taskId,
  onClose,
}: StaffTaskDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);

        // Extract task type and ID from the taskId
        const [type, id] = taskId.split("-");

        // Fetch the task details based on type
        let response;
        if (type === "oneTime") {
          response = await fetch(`/api/oneTimeSched/${id}`);
        } else if (type === "recurrent") {
          response = await fetch(`/api/recurrentSched/${id}`);
        } else {
          throw new Error("Invalid task type");
        }

        if (!response.ok) {
          throw new Error("Failed to fetch task details");
        }

        const data = await response.json();

        // Format the data for display
        const formattedTask: TaskDetails = {
          id: taskId,
          title: data.title || "Task Details",
          date: new Date(data.taskDate || data.startDate),
          type: type as "oneTime" | "recurrent",
          status: data.status || "PLANNED",
          taskName: data.taskName,
          taskDesc: data.taskDesc,
          taskDate: data.taskDate ? new Date(data.taskDate) : undefined,
          reccurencePattern: data.reccurencePattern,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          notes: data.notes,
          time_of_day: data.time_of_day,
        };

        setTask(formattedTask);
      } catch (err) {
        console.error("Error fetching task details:", err);
        setError("Failed to load task information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Loading Task Details...
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !task) {
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
              {error || "Task details not found"}
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

  // Render different content based on task type
  const renderTaskContent = () => {
    switch (task.type) {
      case "oneTime":
        return (
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              One-Time Task
            </h3>
            <div className="space-y-4">
              {task.taskName && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Task Name
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.taskName}
                  </p>
                </div>
              )}

              {task.taskDesc && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Description
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.taskDesc}
                  </p>
                </div>
              )}

              {task.taskDate && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Scheduled Date
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {format(new Date(task.taskDate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}

              {task.time_of_day && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Time of Day
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.time_of_day}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "recurrent":
        return (
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Recurrent Task
            </h3>
            <div className="space-y-4">
              {task.taskName && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Task Name
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.taskName}
                  </p>
                </div>
              )}

              {task.taskDesc && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Description
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.taskDesc}
                  </p>
                </div>
              )}

              {task.reccurencePattern && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recurrence Pattern
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.reccurencePattern}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.startDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start Date
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {format(new Date(task.startDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}

                {task.endDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {format(new Date(task.endDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {task.time_of_day && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Time of Day
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.time_of_day}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-300">
              No detailed information available for this task.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Date:</span>{" "}
              {format(new Date(task.date), "MMMM d, yyyy")}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`${
                  task.status === "FINISHED"
                    ? "text-green-600 dark:text-green-400"
                    : task.status === "ONGOING"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {task.status.charAt(0) + task.status.slice(1).toLowerCase()}
              </span>
            </p>
          </div>

          {renderTaskContent()}

          {/* Notes Section */}
          {task.notes && (
            <div className="mt-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Notes
              </h3>
              <div className="bg-gray-50 dark:bg-gray-600/50 p-4 rounded-md">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {task.notes}
                </p>
              </div>
            </div>
          )}
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
