import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { CalendarEvent } from "@/types";
import { format } from "date-fns";

interface IndividualTaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CalendarEvent | null;
  onTaskStatusChange: (taskId: string, completed: boolean) => void;
  isUpdating: boolean;
}

export default function IndividualTaskDetailsModal({
  isOpen,
  onClose,
  task,
  onTaskStatusChange,
  isUpdating,
}: IndividualTaskDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!task) return null;

  const handleToggleCompletion = async () => {
    setIsLoading(true);
    try {
      await onTaskStatusChange(task.id, !task.completed);
    } catch (error) {
      console.error("Error toggling completion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                >
                  Task Details
                </Dialog.Title>

                <div className="mt-4 space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Task Name
                        </h4>
                        <p className="mt-1 text-gray-900 dark:text-gray-100">
                          {task.title}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Task Type
                        </h4>
                        <p className="mt-1 text-gray-900 dark:text-gray-100">
                          {task.taskType || "N/A"}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Category
                        </h4>
                        <p className="mt-1 text-gray-900 dark:text-gray-100">
                          {task.taskCategory || "N/A"}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </h4>
                        <p className="mt-1 text-gray-900 dark:text-gray-100">
                          {task.description || "N/A"}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Time
                        </h4>
                        <p className="mt-1 text-gray-900 dark:text-gray-100">
                          {format(task.start, "HH:mm")}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Date
                        </h4>
                        <p className="mt-1 text-gray-900 dark:text-gray-100">
                          {format(task.start, "MMMM d, yyyy")}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </h4>
                        <span
                          className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === "FINISHED"
                              ? "bg-green-500 text-white"
                              : "bg-yellow-500 text-white"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isUpdating || isLoading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : task.status === "FINISHED"
                        ? "bg-yellow-100 text-yellow-900 hover:bg-yellow-200 focus-visible:ring-yellow-500"
                        : "bg-green-100 text-green-900 hover:bg-green-200 focus-visible:ring-green-500"
                    }`}
                    onClick={handleToggleCompletion}
                    disabled={isUpdating || isLoading}
                  >
                    {isUpdating || isLoading
                      ? "Updating..."
                      : task.status === "FINISHED"
                      ? "Mark as Not Done"
                      : "Mark as Done"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                    disabled={isUpdating || isLoading}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
