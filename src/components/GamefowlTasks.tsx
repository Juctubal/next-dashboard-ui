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
    title: string;
    start: Date;
    end: Date;
    type?: string;
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
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "completed":
        return "bg-green-50 text-green-700 border border-green-200";
      case "overdue":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
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
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Things to Do</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("conditioning")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "conditioning"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Conditioning
            </button>
            <button
              onClick={() => setFilter("sparring")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "sparring"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sparring
            </button>
            <button
              onClick={() => setFilter("medical")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "medical"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Medical
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-100">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1"></div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
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
            <p className="text-gray-500">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamefowlTasks;
