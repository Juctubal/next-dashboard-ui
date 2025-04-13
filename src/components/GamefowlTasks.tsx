"use client";

import { useState } from "react";
import Image from "next/image";

interface Task {
  id: string;
  title: string;
  date: Date;
  type: "conditioning" | "sparring" | "medical";
  status: "upcoming" | "completed" | "overdue";
}

interface GamefowlTasksProps {
  events: {
    id: string;
    title: string;
    start: Date;
    type: string;
  }[];
}

const GamefowlTasks = ({ events }: GamefowlTasksProps) => {
  const [filter, setFilter] = useState<
    "all" | "conditioning" | "sparring" | "medical"
  >("all");

  // Convert events to tasks and sort by date
  const tasks: Task[] = events
    .map((event) => {
      const now = new Date();
      const eventDate = new Date(event.start);
      let status: Task["status"] = "upcoming";

      if (eventDate < now) {
        status = "completed";
      } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
        status = "overdue";
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        title: event.title,
        date: event.start,
        type: (event.type as Task["type"]) || "conditioning",
        status,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const filteredTasks = tasks.filter(
    (task) => filter === "all" || task.type === filter
  );

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
      case "completed":
        return "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
      case "overdue":
        return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
    }
  };

  const getTypeIcon = (type: Task["type"]) => {
    switch (type) {
      case "conditioning":
        return "/conditioning.png";
      case "sparring":
        return "/sparring.png";
      case "medical":
        return "/medical.png";
      default:
        return "/task.png";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Things to Do
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
              onClick={() => setFilter("conditioning")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "conditioning"
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Conditioning
            </button>
            <button
              onClick={() => setFilter("sparring")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "sparring"
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Sparring
            </button>
            <button
              onClick={() => setFilter("medical")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "medical"
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Medical
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1"></div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-200 truncate">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {task.date.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {task.date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamefowlTasks;
