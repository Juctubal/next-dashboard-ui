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
import { EventStatus } from "@prisma/client";

interface Event {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  type: string;
  status?: string;
  oneTimeId?: string;
  recurrentId?: string;
  completionId?: string;
}

interface TodoItem {
  id: string;
  title: string;
  date: string;
  status: string;
  isRecurring: boolean;
  recurrentId?: string;
  completed: boolean;
  completionId?: string;
  type?: string;
  oneTimeId?: string;
  dueDate: Date;
  count?: number;
  firstDate?: Date;
  lastDate?: Date;
}

interface StaffTodoListProps {
  events: Event[];
}

const StaffTodoList: React.FC<StaffTodoListProps> = ({ events }) => {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.start.toISOString(),
      status: event.status || "ASSIGNED",
      isRecurring: event.type === "recurrent",
      recurrentId: event.recurrentId,
      completed: event.status === "FINISHED",
      completionId: event.completionId,
      type: event.type,
      oneTimeId: event.oneTimeId,
      dueDate: event.start,
    }));
  });

  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">(
    "all"
  );
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [groupDaily, setGroupDaily] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    todoId: string | null;
  }>({ isOpen: false, todoId: null });

  // Get today's date (without time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort todos by due date
  const sortedTodos = [...todos].sort((a, b) => {
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  // Group daily recurring tasks if enabled
  const groupedTodos = groupDaily
    ? sortedTodos.reduce((acc, todo) => {
        // Check if this is a daily recurring task
        const isDailyRecurrent = todo.isRecurring && todo.recurrentId;

        if (isDailyRecurrent && todo.recurrentId) {
          const key = `recurrent-${todo.recurrentId}`;
          if (!acc[key]) {
            acc[key] = {
              ...todo,
              count: 1,
              firstDate: todo.dueDate,
              lastDate: todo.dueDate,
            };
          } else {
            acc[key].count = (acc[key].count || 0) + 1;
            if (todo.dueDate < acc[key].firstDate!) {
              acc[key].firstDate = todo.dueDate;
            }
            if (todo.dueDate > acc[key].lastDate!) {
              acc[key].lastDate = todo.dueDate;
            }
          }
        } else {
          acc[todo.id] = todo;
        }
        return acc;
      }, {} as Record<string, TodoItem>)
    : sortedTodos.reduce((acc, todo) => {
        acc[todo.id] = todo;
        return acc;
      }, {} as Record<string, TodoItem>);

  // Convert the grouped todos back to an array
  const processedTodos = Object.values(groupedTodos);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isUpcoming = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const isOverdue = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Filter todos based on active tab and today only option
  const filteredTodos = processedTodos.filter((todo) => {
    // First apply the tab filter
    let tabMatch = true;
    if (activeTab === "completed") tabMatch = todo.completed;
    if (activeTab === "upcoming") tabMatch = !todo.completed;

    // Then apply the today only filter if enabled
    if (showTodayOnly) {
      return tabMatch && isToday(todo.dueDate);
    }

    return tabMatch;
  });

  const handleStatusUpdate = async (
    todo: TodoItem | string,
    newStatus: EventStatus
  ) => {
    try {
      console.log("Starting status update for todo:", todo);

      // If todo is a string, find the todo object
      const todoObj =
        typeof todo === "string" ? todos.find((t) => t.id === todo) : todo;
      if (!todoObj) {
        throw new Error("Todo not found");
      }

      if (!todoObj.completionId) {
        throw new Error("No completion ID found for this task");
      }

      console.log("Using completion ID:", todoObj.completionId);

      const response = await fetch("/api/tasks/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: todoObj.completionId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update task status:", errorData);
        throw new Error("Failed to update task status");
      }

      // Update the local state
      setTodos((prevTodos) =>
        prevTodos.map((t) =>
          t.id === todoObj.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs and filters */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${
              activeTab === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded ${
              activeTab === "upcoming"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`px-3 py-1 rounded ${
              activeTab === "completed"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${
              showTodayOnly
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setShowTodayOnly(!showTodayOnly)}
          >
            Today Only
          </button>
          <button
            className={`px-3 py-1 rounded ${
              groupDaily
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setGroupDaily(!groupDaily)}
          >
            Group Daily
          </button>
        </div>
      </div>

      {/* Todo list */}
      <div className="space-y-2">
        {filteredTodos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div>
              <h3 className="font-medium">{todo.title}</h3>
              <p className="text-sm text-gray-500">
                {formatDate(todo.dueDate)} at {formatTime(todo.dueDate)}
              </p>
              {todo.count && (
                <p className="text-sm text-gray-500">
                  {todo.count} occurrences from {formatDate(todo.firstDate!)} to{" "}
                  {formatDate(todo.lastDate!)}
                </p>
              )}
            </div>
            <button
              className={`px-3 py-1 rounded ${
                todo.completed
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => {
                if (todo.completed) {
                  setConfirmDialog({ isOpen: true, todoId: todo.id });
                } else {
                  handleStatusUpdate(todo, "FINISHED");
                }
              }}
            >
              {todo.completed ? "Completed" : "Mark as done"}
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog({ isOpen: open, todoId: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as incomplete?</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this task as incomplete?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ isOpen: false, todoId: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.todoId) {
                  handleStatusUpdate(confirmDialog.todoId, "ASSIGNED");
                  setConfirmDialog({ isOpen: false, todoId: null });
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffTodoList;
