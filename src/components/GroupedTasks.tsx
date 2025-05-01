"use client";

import { useState } from "react";
import { format } from "date-fns";
import TaskDetailsModal from "./TaskDetailsModal";

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
}

interface GroupedTasksProps {
  tasks: Task[];
  onTaskStatusChange: (
    recurrentId: number,
    completed: boolean
  ) => Promise<void>;
  isUpdating: boolean;
}

export default function GroupedTasks({
  tasks,
  onTaskStatusChange,
  isUpdating,
}: GroupedTasksProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleTaskClick(task)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{task.taskName}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(task.startDate), "PPP")} -{" "}
                {format(new Date(task.endDate), "PPP")}
              </p>
              <p className="text-sm text-gray-500">Time: {task.time_of_day}</p>
              <p className="text-sm text-gray-500">
                Pattern: {task.reccurencePattern}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
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
                  onTaskStatusChange(task.id, task.status !== "FINISHED");
                }}
                disabled={isUpdating}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  task.status === "FINISHED"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isUpdating
                  ? "Updating..."
                  : task.status === "FINISHED"
                  ? "Mark as Not Done"
                  : "Mark as Done"}
              </button>
            </div>
          </div>
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
