import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    taskName: string;
    taskType: string;
    taskCategory: string;
    description: string;
    reccurencePattern: string;
    time_of_day: string;
    status: string;
    startDate: Date;
    endDate: Date;
  } | null;
}

export default function TaskDetailsModal({
  isOpen,
  onClose,
  task,
}: TaskDetailsModalProps) {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Task Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">Task Name:</div>
            <div className="col-span-3 text-sm text-gray-600">
              {task.taskName}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">Task Type:</div>
            <div className="col-span-3 text-sm text-gray-600">
              {task.taskType}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">Category:</div>
            <div className="col-span-3 text-sm text-gray-600">
              {task.taskCategory}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">
              Description:
            </div>
            <div className="col-span-3 text-sm text-gray-600">
              {task.description}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">Recurrence:</div>
            <div className="col-span-3 text-sm text-gray-600">
              {task.reccurencePattern}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">Time:</div>
            <div className="col-span-3 text-sm text-gray-600">
              {task.time_of_day}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">Status:</div>
            <div className="col-span-3">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === "FINISHED"
                    ? "bg-green-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium text-gray-900">Schedule:</div>
            <div className="col-span-3 text-sm text-gray-600">
              {format(task.startDate, "MMM d, yyyy")} -{" "}
              {format(task.endDate, "MMM d, yyyy")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
