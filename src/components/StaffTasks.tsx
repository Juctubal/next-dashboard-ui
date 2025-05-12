"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import GroupedTasks from "./GroupedTasks";
import IndividualTaskDetailsModal from "./IndividualTaskDetailsModal";
import { CalendarEvent } from "@/types";
import { toast } from "sonner";

interface StaffTasksProps {
  events: CalendarEvent[];
  onTaskStatusChange?: (taskId: string, completed: boolean) => void;
}

export default function StaffTasks({
  events: initialEvents,
  onTaskStatusChange,
}: StaffTasksProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedView, setSelectedView] = useState<"calendar" | "list">("list");
  const [selectedIndividualTask, setSelectedIndividualTask] =
    useState<CalendarEvent | null>(null);
  const [isIndividualTaskModalOpen, setIsIndividualTaskModalOpen] =
    useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [updatingTasks, setUpdatingTasks] = useState<Record<string, boolean>>(
    {}
  );
  const [completionFilter, setCompletionFilter] = useState<
    "all" | "completed" | "not-completed"
  >("all");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    thisWeek: false,
    nextWeek: false,
    later: false,
  });

  // Filter events based on selected date, view type, and completion status
  const filteredEvents = events.filter((event) => {
    // Apply completion filter first
    if (completionFilter === "completed" && event.type === "oneTime") {
      if (event.status !== "FINISHED") return false;
    } else if (completionFilter === "completed" && !event.completed) {
      return false;
    }

    if (completionFilter === "not-completed" && event.type === "oneTime") {
      if (event.status === "FINISHED") return false;
    } else if (completionFilter === "not-completed" && event.completed) {
      return false;
    }

    // If a specific task is selected, only show events for that task
    if (selectedTaskId !== null && event.type === "recurrent") {
      if (event.recurrentId !== selectedTaskId.toString()) {
        return false;
      }
    }

    // If no date is selected, return all events that pass the completion filter
    if (!date) return true;

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (event.type === "oneTime") {
      // For one-time tasks, always use the task date regardless of view
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);

      return (
        selectedDate.getFullYear() === eventDate.getFullYear() &&
        selectedDate.getMonth() === eventDate.getMonth() &&
        selectedDate.getDate() === eventDate.getDate()
      );
    } else if (selectedView === "calendar") {
      // For calendar view, show recurring tasks based on their completion date
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);

      return (
        selectedDate.getFullYear() === eventDate.getFullYear() &&
        selectedDate.getMonth() === eventDate.getMonth() &&
        selectedDate.getDate() === eventDate.getDate()
      );
    } else {
      // For list view, show recurring tasks within their schedule date range
      const eventStartDate = new Date(event.scheduleStartDate || event.start);
      const eventEndDate = new Date(event.scheduleEndDate || event.end);

      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(0, 0, 0, 0);

      return selectedDate >= eventStartDate && selectedDate <= eventEndDate;
    }
  });

  // Group recurring tasks by their recurrentId for list view
  const recurringTasks = filteredEvents.reduce((acc, event) => {
    if (event.type === "recurrent" && event.recurrentId) {
      if (!acc[event.recurrentId]) {
        // Get all tasks for this recurrentId
        const allTasksForGroup = events.filter(
          (e) => e.type === "recurrent" && e.recurrentId === event.recurrentId
        );

        // Count completed tasks
        const completedTasks = allTasksForGroup.filter(
          (task) => task.completed
        ).length;
        const totalTasks = allTasksForGroup.length;

        // Check if all tasks in the group are completed
        const allTasksCompleted = allTasksForGroup.every(
          (task) => task.completed
        );

        acc[event.recurrentId] = {
          id: parseInt(event.recurrentId),
          taskName: event.title.split(" (")[0], // Remove the pattern from title
          startDate: event.scheduleStartDate || event.start,
          endDate: event.scheduleEndDate || event.end,
          time_of_day: format(event.start, "HH:mm"),
          reccurencePattern: event.title.match(/\((.*?)\)/)?.[1] || "DAILY",
          status: allTasksCompleted ? "FINISHED" : "ASSIGNED",
          taskType: event.taskType,
          taskCategory: event.taskCategory,
          description: event.description,
          completions: [],
          completionStats: {
            completed: completedTasks,
            total: totalTasks,
          },
          repeatIndefinitely: event.repeatIndefinitely || false,
        };
      }
      if (event.completionId) {
        const completion = {
          id: parseInt(event.completionId),
          recurrentId: parseInt(event.recurrentId),
          date: event.start,
          completed: event.completed || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        acc[event.recurrentId].completions.push(completion);
      }
    }
    return acc;
  }, {} as Record<string, any>);

  // Filter one-time tasks for list view
  const oneTimeTasks = filteredEvents.filter(
    (event) => event.type === "oneTime"
  );

  // Helper function to get the start and end of a week
  const getWeekRange = (offset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + offset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  };

  // Helper function to check if a date is in a specific week
  const isDateInWeek = (date: Date, weekOffset: number) => {
    const { startOfWeek, endOfWeek } = getWeekRange(weekOffset);
    return date >= startOfWeek && date <= endOfWeek;
  };

  // Helper function to check if a date is later than next week
  const isDateLater = (date: Date) => {
    const { endOfWeek } = getWeekRange(1);
    return date > endOfWeek;
  };

  // Group events by time period
  const groupedEvents = filteredEvents.reduce(
    (acc, event) => {
      const eventDate = new Date(event.start);
      if (isDateInWeek(eventDate, 0)) {
        acc.thisWeek.push(event);
      } else if (isDateInWeek(eventDate, 1)) {
        acc.nextWeek.push(event);
      } else if (isDateLater(eventDate)) {
        acc.later.push(event);
      }
      return acc;
    },
    { thisWeek: [], nextWeek: [], later: [] } as Record<string, CalendarEvent[]>
  );

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderEventCard = (event: CalendarEvent) => (
    <div
      key={event.id}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
      onClick={() => handleIndividualTaskClick(event)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {event.title}
          </h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(event.start, "EEEE")} • {format(event.start, "PPP")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Time: {format(event.start, "HH:mm")}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              event.status === "FINISHED"
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            {event.status}
          </span>
          {!event.repeatIndefinitely && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskStatusChange(event.id, event.status !== "FINISHED");
              }}
              disabled={updatingTasks[event.id]}
              className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                event.status === "FINISHED"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              } ${
                updatingTasks[event.id] ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {updatingTasks[event.id] ? (
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
              ) : event.status === "FINISHED" ? (
                "Mark as Not Done"
              ) : (
                "Mark as Done"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderSection = (
    title: string,
    events: CalendarEvent[],
    sectionKey: keyof typeof expandedSections
  ) => (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expandedSections[sectionKey] ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({events.length})
          </span>
        </div>
      </button>
      {expandedSections[sectionKey] && (
        <div className="p-4 space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No tasks scheduled
            </p>
          ) : (
            events.map(renderEventCard)
          )}
        </div>
      )}
    </div>
  );

  const handleIndividualTaskClick = (task: CalendarEvent) => {
    setSelectedIndividualTask(task);
    setIsIndividualTaskModalOpen(true);
  };

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    try {
      setUpdatingTasks((prev) => ({ ...prev, [taskId]: true }));

      // Find the task to get its completion ID
      const task = events.find((event) => event.id === taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // For recurring tasks, we need the completion ID
      const completionId =
        task.type === "recurrent" ? task.completionId : taskId;
      if (!completionId) {
        throw new Error("No completion ID found for this task");
      }

      const response = await fetch("/api/tasks/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: completionId,
          status: completed ? "FINISHED" : "ASSIGNED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === taskId
            ? {
                ...event,
                status: completed ? "FINISHED" : "ASSIGNED",
                completed,
              }
            : event
        )
      );

      // Notify parent component
      onTaskStatusChange?.(taskId, completed);

      toast.success(
        `Task marked as ${completed ? "completed" : "not completed"}`
      );
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    } finally {
      setUpdatingTasks((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleGroupedTaskStatusChange = async (
    recurrentId: number,
    completed: boolean,
    isDaily: boolean = false
  ) => {
    try {
      // Find all tasks with this recurrentId
      const tasksToUpdate = events.filter(
        (event) =>
          event.type === "recurrent" &&
          event.recurrentId === recurrentId.toString()
      );

      // Update each task's status
      for (const task of tasksToUpdate) {
        await handleTaskStatusChange(task.id, completed);
      }

      toast.success(
        `All tasks ${completed ? "completed" : "marked as not completed"}`
      );
    } catch (error) {
      console.error("Error updating grouped tasks:", error);
      toast.error("Failed to update all tasks");
    }
  };

  const createDailyTaskCompletions = async (
    recurrentId: number,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      const response = await fetch("/api/tasks/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recurrentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create daily task completions");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(
          data.error || "Failed to create daily task completions"
        );
      }

      // Refresh the events to show the new completion records
      window.location.reload();
    } catch (error) {
      console.error("Error creating daily task completions:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create daily task completions",
        {
          duration: 2000,
          position: "top-center",
        }
      );
    }
  };

  const handleViewCalendar = (taskId: number) => {
    setSelectedTaskId(taskId);
    setSelectedView("calendar");
  };

  const handleCompletionStatusChange = async (
    recurrentId: number,
    completionId: number,
    completed: boolean
  ) => {
    try {
      // Find the task with this completionId
      const taskToUpdate = events.find(
        (event) =>
          event.type === "recurrent" &&
          event.recurrentId === recurrentId.toString() &&
          event.completionId === completionId.toString()
      );

      if (taskToUpdate) {
        await handleTaskStatusChange(taskToUpdate.id, completed);
      }
    } catch (error) {
      console.error("Error updating completion status:", error);
      toast.error("Failed to update task completion status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === "list" ? "default" : "outline"}
            onClick={() => {
              setSelectedView("list");
              setSelectedTaskId(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            List View
          </Button>
          <Button
            variant={selectedView === "calendar" ? "default" : "outline"}
            onClick={() => {
              setSelectedView("calendar");
              setSelectedTaskId(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Calendar View
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={completionFilter === "all" ? "default" : "outline"}
              onClick={() => setCompletionFilter("all")}
              className={`${
                completionFilter === "all"
                  ? "bg-gray-600 hover:bg-gray-700 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              } transition-all duration-200 border-2`}
            >
              All Tasks
            </Button>
            <Button
              variant={completionFilter === "completed" ? "default" : "outline"}
              onClick={() => setCompletionFilter("completed")}
              className={`${
                completionFilter === "completed"
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              } transition-all duration-200 border-2`}
            >
              Completed
            </Button>
            <Button
              variant={
                completionFilter === "not-completed" ? "default" : "outline"
              }
              onClick={() => setCompletionFilter("not-completed")}
              className={`${
                completionFilter === "not-completed"
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              } transition-all duration-200 border-2`}
            >
              Not Completed
            </Button>
          </div>
          <Button
            variant="outline"
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border-2 h-10"
          >
            <input
              type="date"
              className="bg-transparent border-none focus:outline-none text-sm"
              value={date ? format(date, "yyyy-MM-dd") : ""}
              onChange={(e) =>
                setDate(e.target.value ? new Date(e.target.value) : undefined)
              }
            />
          </Button>
        </div>
      </div>

      {selectedView === "calendar" ? (
        <div className="space-y-4">
          {renderSection("This Week", groupedEvents.thisWeek, "thisWeek")}
          {renderSection("Next Week", groupedEvents.nextWeek, "nextWeek")}
          {renderSection("Later", groupedEvents.later, "later")}
        </div>
      ) : (
        <div className="space-y-8">
          {/* One-time Tasks */}
          {oneTimeTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">One-time Tasks</h2>
              <div className="space-y-4">
                {oneTimeTasks.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleIndividualTaskClick(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {event.title}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Date: {format(event.start, "MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Time: {format(event.start, "HH:mm")}
                          </p>
                          {event.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Description: {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === "FINISHED"
                              ? "bg-green-500 text-white"
                              : "bg-yellow-500 text-white"
                          }`}
                        >
                          {event.status}
                        </span>
                        {!event.repeatIndefinitely && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskStatusChange(
                                event.id,
                                event.status !== "FINISHED"
                              );
                            }}
                            disabled={updatingTasks[event.id]}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                              event.status === "FINISHED"
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            } ${
                              updatingTasks[event.id]
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {updatingTasks[event.id]
                              ? "Updating..."
                              : event.status === "FINISHED"
                              ? "Mark as Not Done"
                              : "Mark as Done"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Tasks */}
          {Object.values(recurringTasks).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Tasks</h2>
              <GroupedTasks
                tasks={Object.values(recurringTasks)}
                onTaskStatusChange={handleGroupedTaskStatusChange}
                onCompletionStatusChange={handleCompletionStatusChange}
                isUpdating={Object.values(updatingTasks).some(Boolean)}
                onViewCalendar={handleViewCalendar}
              />
            </div>
          )}

          {oneTimeTasks.length === 0 &&
            Object.values(recurringTasks).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks scheduled for{" "}
                {date ? format(date, "MMMM d, yyyy") : "this date"}
              </div>
            )}
        </div>
      )}

      <IndividualTaskDetailsModal
        isOpen={isIndividualTaskModalOpen}
        onClose={() => {
          if (!updatingTasks[selectedIndividualTask?.id || ""]) {
            setIsIndividualTaskModalOpen(false);
            setSelectedIndividualTask(null);
          }
        }}
        task={selectedIndividualTask}
        onTaskStatusChange={handleTaskStatusChange}
        isUpdating={updatingTasks[selectedIndividualTask?.id || ""] || false}
      />
    </div>
  );
}
