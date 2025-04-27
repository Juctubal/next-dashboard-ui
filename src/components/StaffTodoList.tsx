"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Circle, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TodoItem {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  type: string;
  status?: string;
  oneTimeId?: string;
  recurrentId?: string;
  isDailyRecurring?: boolean;
  count?: number;
  firstDate?: Date;
  lastDate?: Date;
}

interface StaffTodoListProps {
  events: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    type: string;
    status?: string;
    oneTimeId?: string;
    recurrentId?: string;
  }[];
}

type TabType = "all" | "upcoming" | "completed";

const StaffTodoList: React.FC<StaffTodoListProps> = ({ events }) => {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    // Convert events to todo items
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      dueDate: event.start,
      // Set completed based on status if available
      completed:
        event.status?.toLowerCase() === "finished" ||
        event.status?.toLowerCase() === "completed",
      type: event.type,
      status: event.status,
      oneTimeId: event.oneTimeId,
      recurrentId: event.recurrentId,
      // Check if this is a daily recurring task
      isDailyRecurring:
        event.type === "recurrent" && event.title.includes("(DAILY)"),
    }));
  });

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [groupDaily, setGroupDaily] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    todoId: string | null;
  }>({
    isOpen: false,
    todoId: null,
  });

  // Get today's date (without time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toggleComplete = async (id: string, currentStatus: string) => {
    try {
      setIsUpdating(id);

      // Toggle between FINISHED and ASSIGNED
      const newStatus = currentStatus === "FINISHED" ? "ASSIGNED" : "FINISHED";

      // Find the todo item
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        console.error("Todo item not found");
        return;
      }

      // Format the taskId based on the type
      let taskId = id;
      if (todo.type === "oneTime" && todo.oneTimeId) {
        taskId = `oneTime-${todo.oneTimeId}`;
      } else if (todo.type === "recurrent" && todo.recurrentId) {
        taskId = `recurrent-${todo.recurrentId}`;
      }

      const response = await fetch("/api/tasks/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          status: newStatus,
          date: todo.dueDate.toISOString(), // Use the specific task date
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      // Update local state
      setTodos((prevTodos) =>
        prevTodos.map((t) =>
          t.id === id
            ? {
                ...t,
                status: newStatus,
                completed: newStatus === "FINISHED",
              }
            : t
        )
      );

      toast.success(`Task marked as ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    } finally {
      setIsUpdating(null);
      setConfirmDialog({ isOpen: false, todoId: null });
    }
  };

  // Sort todos by due date
  const sortedTodos = [...todos].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );

  // Group daily recurring tasks if enabled
  const groupedTodos = groupDaily
    ? sortedTodos.reduce((acc, todo) => {
        // Check if this is a daily recurring task
        const isDailyRecurrent = todo.isDailyRecurring && todo.recurrentId;

        if (isDailyRecurrent && todo.recurrentId) {
          // Use the recurrentId as the key for grouping
          const key = todo.recurrentId;
          if (!acc[key]) {
            acc[key] = {
              ...todo,
              // Add a count of occurrences
              count: 1,
              // Store the first occurrence date
              firstDate: new Date(todo.dueDate),
              // Store the last occurrence date
              lastDate: new Date(todo.dueDate),
            };
          } else {
            // Update the count and last date
            const existingTodo = acc[key];
            if (
              existingTodo &&
              existingTodo.lastDate &&
              existingTodo.firstDate
            ) {
              existingTodo.count = (existingTodo.count || 0) + 1;
              if (new Date(todo.dueDate) > existingTodo.lastDate) {
                existingTodo.lastDate = new Date(todo.dueDate);
              }
              if (new Date(todo.dueDate) < existingTodo.firstDate) {
                existingTodo.firstDate = new Date(todo.dueDate);
              }
            }
          }
        } else {
          // For non-daily tasks, just add them as is
          acc[todo.id] = todo;
        }
        return acc;
      }, {} as Record<string, TodoItem & { count?: number; firstDate?: Date; lastDate?: Date }>)
    : sortedTodos.reduce((acc, todo) => {
        acc[todo.id] = todo;
        return acc;
      }, {} as Record<string, TodoItem>);

  // Convert the grouped todos back to an array
  const processedTodos = Object.values(groupedTodos);

  // Filter todos based on active tab and today only option
  const filteredTodos = processedTodos.filter((todo) => {
    // First apply the tab filter
    let tabMatch = true;
    if (activeTab === "completed") tabMatch = todo.completed;
    if (activeTab === "upcoming") tabMatch = !todo.completed;

    // Then apply the today only filter if enabled
    if (showTodayOnly) {
      const todoDate = new Date(todo.dueDate);
      todoDate.setHours(0, 0, 0, 0);
      return tabMatch && todoDate.getTime() === today.getTime();
    }

    return tabMatch;
  });

  // Count todos by status
  const completedCount = todos.filter((todo) => todo.completed).length;
  const upcomingCount = todos.filter((todo) => !todo.completed).length;

  // Function to get status badge color
  const getStatusBadgeColor = (status?: string) => {
    if (!status)
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
      case "finished":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          To-Do List
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {upcomingCount} upcoming, {completedCount} completed
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "all"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "upcoming"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "completed"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setGroupDaily(!groupDaily)}
          className={`py-2 px-4 text-sm font-medium ${
            groupDaily
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          {groupDaily ? "Ungroup Daily" : "Group Daily"}
        </button>
        <button
          onClick={() => setShowTodayOnly(!showTodayOnly)}
          className={`py-2 px-4 text-sm font-medium ml-auto ${
            showTodayOnly
              ? "text-green-600 border-b-2 border-green-600 dark:text-green-400 dark:border-green-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Today Only
        </button>
      </div>

      {filteredTodos.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          {activeTab === "all"
            ? showTodayOnly
              ? "No tasks for today"
              : "No tasks"
            : activeTab === "upcoming"
            ? showTodayOnly
              ? "No upcoming tasks for today"
              : "No upcoming tasks"
            : showTodayOnly
            ? "No completed tasks for today"
            : "No completed tasks"}
        </p>
      ) : (
        <ul className="space-y-3">
          {filteredTodos.map((todo) => (
            <li
              key={todo.id}
              className={`flex items-start p-3 rounded-lg border ${
                todo.completed
                  ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              }`}
            >
              <button
                onClick={() => {
                  if (!todo.completed) {
                    setConfirmDialog({ isOpen: true, todoId: todo.id });
                  } else {
                    toggleComplete(todo.id, todo.status || "ASSIGNED");
                  }
                }}
                disabled={isUpdating === todo.id}
                className={`mr-3 mt-1 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 ${
                  isUpdating === todo.id ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {todo.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h3
                    className={`font-medium ${
                      todo.completed
                        ? "text-gray-500 line-through dark:text-gray-400"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {todo.title}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {todo.type === "oneTime" ? "One-time" : "Recurring"}
                  </span>
                  {todo.status && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(
                        todo.status
                      )}`}
                    >
                      {todo.status
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  )}
                </div>

                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {format(todo.dueDate, "MMM d, yyyy h:mm a")}
                    {/* Show date range for grouped daily tasks */}
                    {todo.count &&
                      todo.count > 1 &&
                      todo.firstDate &&
                      todo.lastDate && (
                        <span className="ml-1 text-xs">
                          ({todo.count} occurrences,{" "}
                          {`${format(todo.firstDate, "MMM d")} - ${format(
                            todo.lastDate,
                            "MMM d"
                          )}`}
                        </span>
                      )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ isOpen: false, todoId: null });
          }
        }}
      >
        <DialogContent className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Mark task as done?
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to mark this task as completed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ isOpen: false, todoId: null })}
              className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.todoId) {
                  toggleComplete(confirmDialog.todoId, "ASSIGNED");
                  setConfirmDialog({ isOpen: false, todoId: null });
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffTodoList;
