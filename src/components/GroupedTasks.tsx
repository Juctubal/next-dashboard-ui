"use client";

import { useState } from "react";
import { format } from "date-fns";
import TaskDetailsModal from "./TaskDetailsModal";
import { MoreHorizontal } from "lucide-react";

interface Task {
  id: number;
  taskName: string;
  startDate: Date;
  endDate: Date;
  time_of_day: string;
  reccurencePattern: string;
  status: string;
  completions: {
    id: number;
    recurrentId: number;
    date: Date;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  taskType: string;
  taskCategory: string;
  description: string;
  completionStats: {
    completed: number;
    total: number;
  };
  repeatIndefinitely?: boolean;
}

interface GroupedTasksProps {
  tasks: Task[];
  onTaskStatusChange: (
    recurrentId: number,
    completed: boolean
  ) => Promise<void>;
  onCompletionStatusChange?: (
    recurrentId: number,
    completionId: number,
    completed: boolean
  ) => Promise<void>;
  isUpdating: boolean;
  onViewCalendar?: (taskId: number) => void;
}

export default function GroupedTasks({
  tasks,
  onTaskStatusChange,
  onCompletionStatusChange,
  isUpdating,
  onViewCalendar,
}: GroupedTasksProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [updatingCompletionId, setUpdatingCompletionId] = useState<
    number | null
  >(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const handleTaskClick = (task: Task, event: React.MouseEvent) => {
    // If the click was on the details button or mark as done button, don't trigger expansion
    if (
      (event.target as HTMLElement).closest("button") ||
      (event.target as HTMLElement).closest("svg")
    ) {
      return;
    }

    // Toggle expansion of the task
    setExpandedTaskId(expandedTaskId === task.id ? null : task.id);
  };

  const handleStatusChange = async (taskId: number, completed: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      await onTaskStatusChange(taskId, completed);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCompletionStatusChange = async (
    recurrentId: number,
    completionId: number,
    completed: boolean
  ) => {
    if (!onCompletionStatusChange) return;

    setUpdatingCompletionId(completionId);
    try {
      await onCompletionStatusChange(recurrentId, completionId, completed);
    } finally {
      setUpdatingCompletionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={(e) => handleTaskClick(task, e)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                {task.taskName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {task.reccurencePattern} schedule from{" "}
                {task.startDate
                  ? format(new Date(task.startDate), "MMM d, yyyy")
                  : "N/A"}{" "}
                {!task.repeatIndefinitely && (
                  <>
                    to{" "}
                    {task.endDate
                      ? format(new Date(task.endDate), "MMM d, yyyy")
                      : "N/A"}
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Time: {task.time_of_day}
              </p>
              {!task.repeatIndefinitely && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Completion: {task.completionStats.completed}/
                    {task.completionStats.total}
                  </span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${
                          (task.completionStats.completed /
                            task.completionStats.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === "FINISHED"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {task.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(task);
                    setIsModalOpen(true);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="View Details"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              {!task.repeatIndefinitely && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(task.id, task.status !== "FINISHED");
                  }}
                  disabled={updatingTaskId === task.id}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    task.status === "FINISHED"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  } ${
                    updatingTaskId === task.id
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {updatingTaskId === task.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Updating...
                    </span>
                  ) : task.status === "FINISHED" ? (
                    "Mark all as Not Done"
                  ) : (
                    "Mark all as Done"
                  )}
                </button>
              )}
            </div>
          </div>
          {expandedTaskId === task.id && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Completions
              </h4>
              <div className="space-y-2">
                {task.completions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No completion records yet
                  </p>
                ) : (
                  task.completions.map((completion) => (
                    <div
                      key={completion.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {format(new Date(completion.date), "MMM d, yyyy")}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            completion.completed
                              ? "bg-green-500 text-white"
                              : "bg-yellow-500 text-white"
                          }`}
                        >
                          {completion.completed ? "Completed" : "Not Completed"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompletionStatusChange(
                            task.id,
                            completion.id,
                            !completion.completed
                          );
                        }}
                        disabled={updatingCompletionId === completion.id}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          completion.completed
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        } ${
                          updatingCompletionId === completion.id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {updatingCompletionId === completion.id ? (
                          <span className="flex items-center gap-1">
                            <svg
                              className="animate-spin h-3 w-3"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Updating...
                          </span>
                        ) : completion.completed ? (
                          "Mark as Not Done"
                        ) : (
                          "Mark as Done"
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <TaskDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
      />
    </div>
  );
}
