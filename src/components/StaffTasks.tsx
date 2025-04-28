"use client";

import { useState } from "react";
import Image from "next/image";
import { Repeat, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";

interface Event {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  type: string;
  status?: string;
  oneTimeId?: string;
  recurrentId?: string;
}

interface Task {
  id: string;
  title: string;
  date: string;
  status: string;
  isRecurring: boolean;
  recurrentId?: string;
  completed: boolean;
  count?: number;
  firstDate?: Date;
  lastDate?: Date;
  recurrencePattern?: "DAILY" | "WEEKLY" | "OTHER" | "ONE_TIME";
}

interface StaffTasksProps {
  events: {
    id: string;
    title: string;
    start: Date;
    type: string;
    status?: string;
    oneTimeId?: string;
    recurrentId?: string;
  }[];
}

export default function StaffTasks({ events }: StaffTasksProps) {
  const [filter, setFilter] = useState<"all" | "today" | "completed">("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [tasks, setTasks] = useState<Task[]>(() => {
    const mappedTasks = events.map((event) => {
      // Determine the recurrence pattern from the title
      let recurrencePattern: "DAILY" | "WEEKLY" | "OTHER" | "ONE_TIME" =
        "ONE_TIME";

      if (event.recurrentId) {
        if (event.title.includes("(DAILY)")) {
          recurrencePattern = "DAILY";
        } else if (event.title.includes("(WEEKLY)")) {
          recurrencePattern = "WEEKLY";
        } else {
          recurrencePattern = "OTHER";
        }
      }

      return {
        id: event.id,
        title: event.title,
        date: event.start.toISOString(),
        status: event.status || "upcoming",
        isRecurring: !!event.recurrentId,
        recurrentId: event.recurrentId,
        completed: event.status === "completed" || event.status === "finished",
        recurrencePattern,
      };
    });

    return mappedTasks;
  });

  // Get today's date (without time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group tasks by recurrence pattern in the "All" view
  const groupedTasks =
    filter === "all"
      ? tasks.reduce((acc, task) => {
          // For one-time tasks, just add them as is
          if (task.recurrencePattern === "ONE_TIME") {
            acc[task.id] = task;
            return acc;
          }

          // For recurring tasks, group by recurrence pattern and recurrentId
          const key = `${task.recurrencePattern}-${
            task.recurrentId || task.id
          }`;

          if (!acc[key]) {
            acc[key] = {
              ...task,
              // Add a count of occurrences
              count: 1,
              // Store the first occurrence date
              firstDate: new Date(task.date),
              // Store the last occurrence date
              lastDate: new Date(task.date),
            };
          } else {
            // Update the count and date range
            const existingTask = acc[key];
            if (
              existingTask &&
              existingTask.lastDate &&
              existingTask.firstDate
            ) {
              existingTask.count = (existingTask.count || 0) + 1;
              if (new Date(task.date) > existingTask.lastDate) {
                existingTask.lastDate = new Date(task.date);
              }
              if (new Date(task.date) < existingTask.firstDate) {
                existingTask.firstDate = new Date(task.date);
              }
            }
          }
          return acc;
        }, {} as Record<string, Task & { count?: number; firstDate?: Date; lastDate?: Date }>)
      : tasks.reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {} as Record<string, Task>);

  // Convert the grouped tasks back to an array
  const processedTasks = Object.values(groupedTasks);

  // Filter tasks based on the selected filter
  const filteredTasks = processedTasks.filter((task) => {
    // Apply the filter based on the selected tab
    if (filter === "completed") {
      return task.status === "FINISHED" || task.status === "COMPLETED";
    } else if (filter === "today") {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }

    // For "all" filter, show all tasks
    return true;
  });

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
      case "completed":
        return "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
      case "overdue":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "finished":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
    }
  };

  const getTypeIcon = (type: Task["status"]) => {
    switch (type) {
      case "oneTime":
        return <Calendar className="w-5 h-5 text-gray-500" />;
      case "recurrent":
        return <Repeat className="w-5 h-5 text-gray-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRecurrencePatternText = (pattern?: string) => {
    switch (pattern) {
      case "DAILY":
        return "Daily";
      case "WEEKLY":
        return "Weekly";
      case "OTHER":
        return "Recurring";
      case "ONE_TIME":
        return "One-time";
      default:
        return "One-time";
    }
  };

  const getStatusText = (status: Task["status"]) => {
    return (
      {
        upcoming: "Upcoming",
        completed: "Completed",
        overdue: "Overdue",
        assigned: "Assigned",
        finished: "Finished",
      }[status] || status
    );
  };

  // Handle click on any task
  const handleTaskClick = (task: Task) => {
    // Create a taskId in the format "type-id"
    let taskId = "";

    if (task.isRecurring && task.recurrentId) {
      taskId = `recurrent-${task.recurrentId}`;
    } else {
      // Fallback to using the task's own ID if no specific ID is available
      taskId = `${task.isRecurring ? "recurrent" : "oneTime"}-${task.id}`;
    }

    // Format the date as YYYY-MM-DD for the API
    const taskDate = new Date(task.date);
    const formattedDate = taskDate.toISOString().split("T")[0];

    // Dispatch custom event to open the task details modal
    document.dispatchEvent(
      new CustomEvent("openStaffTaskDetailsModal", {
        detail: {
          taskId,
          taskDate: formattedDate,
        },
      })
    );
  };

  // Get expanded tasks for a group
  const getExpandedTasksForGroup = (
    group: Task & { count?: number; firstDate?: Date; lastDate?: Date }
  ) => {
    if (!group.recurrentId) return [];

    // Find all tasks with the same recurrentId
    return tasks.filter((task) => task.recurrentId === group.recurrentId);
  };

  // Check if a task is the first occurrence of a recurring task
  const isFirstOccurrence = (
    task: Task,
    group: Task & { count?: number; firstDate?: Date; lastDate?: Date }
  ) => {
    if (!task.recurrentId || !group.firstDate) return false;

    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);

    const firstDate = new Date(group.firstDate);
    firstDate.setHours(0, 0, 0, 0);

    return taskDate.getTime() === firstDate.getTime();
  };

  const handleStatusUpdate = async (
    taskId: string,
    currentStatus: string,
    isFirstOccurrenceTask = false,
    isGroupedTask = false
  ) => {
    try {
      // Toggle between FINISHED and ASSIGNED
      const newStatus = currentStatus === "FINISHED" ? "ASSIGNED" : "FINISHED";

      // Find the task to determine its type
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        console.error("Task not found");
        return;
      }

      // For recurring tasks, we need to include the specific date in the API call
      const taskDate = new Date(task.date);
      const formattedDate = taskDate.toISOString().split("T")[0];

      let requestBody;

      if (task.isRecurring && task.recurrentId) {
        if (isGroupedTask) {
          // For grouped tasks, update the schedule status
          requestBody = {
            taskId: `recurrent-${task.recurrentId}-all`,
            status: newStatus,
            date: formattedDate,
          };
        } else {
          // For individual tasks, update the completion record
          requestBody = {
            taskId: `recurrent-${task.recurrentId}-${formattedDate}`,
            completed: newStatus === "FINISHED",
            date: formattedDate,
          };
        }
      } else {
        requestBody = {
          taskId: taskId.includes("-") ? taskId : `oneTime-${taskId}`,
          status: newStatus,
          date: formattedDate,
        };
      }

      const response = await fetch("/api/tasks/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      // Update local state
      setTasks((prevTasks) => {
        if (isGroupedTask && task.recurrentId) {
          // For grouped tasks, update the schedule status
          return prevTasks.map((t) =>
            t.recurrentId === task.recurrentId ? { ...t, status: newStatus } : t
          );
        } else {
          // For individual tasks in expanded view, update the completion status
          return prevTasks.map((t) => {
            if (t.isRecurring && task.recurrentId) {
              const taskDate = new Date(t.date);
              const targetDate = new Date(task.date);
              // Only update the specific instance's completion status
              return t.id === taskId &&
                taskDate.getTime() === targetDate.getTime()
                ? { ...t, completed: newStatus === "FINISHED" }
                : t;
            }
            // For one-time tasks, update the status
            return t.id === taskId ? { ...t, status: newStatus } : t;
          });
        }
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  // Toggle expanded state for a group
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Staff Schedule
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "today"
                  ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "completed"
                  ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            // Check if this is a grouped task that can be expanded
            const isGroupedTask = task.count && task.count > 1;
            const groupId = task.recurrentId || task.id;
            const isExpanded = expandedGroups[groupId] || false;

            // Get individual tasks for this group if expanded
            const expandedTasks = isExpanded
              ? getExpandedTasksForGroup(task)
              : [];

            return (
              <div key={task.id}>
                <div
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {isGroupedTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupExpansion(groupId);
                          }}
                          className="mt-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <div className="mt-1">{getTypeIcon(task.status)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-200 truncate">
                            {task.title}
                          </h3>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {getStatusText(task.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {getRecurrencePatternText(task.recurrencePattern)}
                          </span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(task.date)} at {formatTime(task.date)}
                            {/* Show date range for grouped tasks */}
                            {task.count &&
                              task.count > 1 &&
                              task.firstDate instanceof Date &&
                              task.lastDate instanceof Date && (
                                <span className="ml-1 text-xs">
                                  ({task.count.toLocaleString()} occurrences,{" "}
                                  {`${task.firstDate.toLocaleDateString()} - ${task.lastDate.toLocaleDateString()}`}
                                </span>
                              )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Always treat the main task button as a grouped task if it has a recurrentId
                        const isGroupedTask = !!task.recurrentId;
                        console.log("Updating task status:", {
                          taskId: task.id,
                          currentStatus: task.status,
                          isGroupedTask: isGroupedTask,
                          isExpanded,
                        });
                        handleStatusUpdate(
                          task.id,
                          task.status,
                          false,
                          isGroupedTask
                        );
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        task.status === "FINISHED"
                          ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {task.status === "FINISHED"
                        ? "Completed"
                        : "Mark as done"}
                    </button>
                  </div>
                </div>

                {/* Expanded individual tasks */}
                {isExpanded && expandedTasks.length > 0 && (
                  <div className="pl-12 border-l-2 border-gray-100 dark:border-gray-700">
                    {expandedTasks.map((expandedTask) => {
                      // Check if this is the first occurrence of the recurring task
                      const isFirstTask = isFirstOccurrence(expandedTask, task);

                      return (
                        <div
                          key={expandedTask.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => handleTaskClick(expandedTask)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="mt-1">
                                {getTypeIcon(expandedTask.status)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900 dark:text-gray-200 truncate">
                                    {expandedTask.title}
                                  </h3>
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                                      expandedTask.status
                                    )}`}
                                  >
                                    {getStatusText(expandedTask.status)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                  {formatDate(expandedTask.date)} at{" "}
                                  {formatTime(expandedTask.date)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Always treat expanded tasks as individual tasks, never as grouped tasks
                                // Force isGroupedTask to false for all expanded tasks
                                console.log("Updating expanded task status:", {
                                  taskId: expandedTask.id,
                                  currentStatus: expandedTask.status,
                                  isGroupedTask: false,
                                  isExpanded: true,
                                });

                                // Make sure we're passing the correct task ID
                                handleStatusUpdate(
                                  expandedTask.id,
                                  expandedTask.status,
                                  isFirstTask,
                                  false
                                );

                                // Also update the parent task's status if all expanded tasks have the same status
                                const allExpandedTasks =
                                  getExpandedTasksForGroup(task);
                                const allTasksHaveSameStatus =
                                  allExpandedTasks.every(
                                    (t) =>
                                      t.status ===
                                      (expandedTask.status === "FINISHED"
                                        ? "ASSIGNED"
                                        : "FINISHED")
                                  );

                                if (allTasksHaveSameStatus) {
                                  // Update the parent task's status
                                  setTasks((prevTasks) =>
                                    prevTasks.map((t) =>
                                      t.id === task.id
                                        ? {
                                            ...t,
                                            status:
                                              expandedTask.status === "FINISHED"
                                                ? "ASSIGNED"
                                                : "FINISHED",
                                          }
                                        : t
                                    )
                                  );
                                }
                              }}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                expandedTask.status === "FINISHED"
                                  ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              {expandedTask.status === "FINISHED"
                                ? "Completed"
                                : "Mark as done"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
