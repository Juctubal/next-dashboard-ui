"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TaskDetails {
  id: string;
  title: string;
  date: Date;
  type: "conditioning" | "sparring" | "medical";
  status: "upcoming" | "completed" | "overdue";
  sparringId?: number;
  conditioningId?: number;
  medicalId?: number;
  notes?: string;
  // Additional fields for different task types
  gamefowl1?: {
    id: number;
    name: string;
    img: string | null;
  };
  gamefowl2?: {
    id: number;
    name: string;
    img: string | null;
  };
  winner?: {
    id: number;
    name: string;
  } | null;
  loser?: {
    id: number;
    name: string;
  } | null;
  winner_elo_change?: number;
  loser_elo_change?: number;
  // Conditioning specific fields
  programName?: string;
  startDate?: Date;
  endDate?: Date;
  handler?: string;
  // Medical specific fields
  medicalType?: string;
  dosage?: string;
  administeredBy?: string;
}

interface TaskDetailsModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailsModal({
  taskId,
  onClose,
}: TaskDetailsModalProps) {
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
        if (type === "sparring") {
          response = await fetch(`/api/sparring/${id}`);
        } else if (type === "conditioning") {
          response = await fetch(`/api/conditioning/${id}`);
        } else if (type === "medical") {
          response = await fetch(`/api/medical/${id}`);
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
          date: new Date(
            data.date ||
              data.sparringDate ||
              data.startDate ||
              data.vaccinationDate ||
              data.dewormDate
          ),
          type: type as "conditioning" | "sparring" | "medical",
          status: "completed", // Default to completed for historical data
          notes: data.notes,
          ...data,
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
      case "sparring":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gamefowl 1 */}
              {task.gamefowl1 && (
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {task.gamefowl1.name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {task.gamefowl1.img ? (
                        <Image
                          src={task.gamefowl1.img}
                          alt={task.gamefowl1.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">
                          {task.gamefowl1.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {task.gamefowl1.id}
                      </p>
                      {task.winner?.id === task.gamefowl1.id && (
                        <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                          Winner
                        </span>
                      )}
                      {task.loser?.id === task.gamefowl1.id && (
                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                          Loser
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Gamefowl 2 */}
              {task.gamefowl2 && (
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {task.gamefowl2.name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {task.gamefowl2.img ? (
                        <Image
                          src={task.gamefowl2.img}
                          alt={task.gamefowl2.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">
                          {task.gamefowl2.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {task.gamefowl2.id}
                      </p>
                      {task.winner?.id === task.gamefowl2.id && (
                        <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                          Winner
                        </span>
                      )}
                      {task.loser?.id === task.gamefowl2.id && (
                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                          Loser
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Elo Changes */}
            {task.winner_elo_change !== undefined &&
              task.loser_elo_change !== undefined && (
                <div className="mt-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Elo Rating Changes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <ArrowUp className="w-4 h-4 mr-1" />
                        <span className="font-medium">
                          {task.winner_elo_change} points
                        </span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        for {task.winner?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <ArrowDown className="w-4 h-4 mr-1" />
                        <span className="font-medium">
                          {task.loser_elo_change} points
                        </span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        for {task.loser?.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </>
        );

      case "conditioning":
        return (
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Conditioning Program
            </h3>
            <div className="space-y-4">
              {task.programName && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Program
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.programName}
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

              {task.handler && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Handler
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.handler}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "medical":
        return (
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Medical Record
            </h3>
            <div className="space-y-4">
              {task.medicalType && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Type
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.medicalType}
                  </p>
                </div>
              )}

              {task.dosage && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dosage
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.dosage}
                  </p>
                </div>
              )}

              {task.administeredBy && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Administered By
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {task.administeredBy}
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
                  task.status === "completed"
                    ? "text-green-600 dark:text-green-400"
                    : task.status === "overdue"
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
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
