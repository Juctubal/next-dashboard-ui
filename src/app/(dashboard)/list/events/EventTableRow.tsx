"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
  Event,
  EventStatus,
  ConditioningStatus,
  EventGamefowl,
  Gamefowl,
} from "@prisma/client";
import FormModal from "@/components/FormModal";
import EventResultForm from "@/components/EventResultForm";
import { format } from "date-fns";

type EventWithRelations = Event & {
  gamefowl: (EventGamefowl & {
    gamefowl: Gamefowl;
  })[];
  conditioning: {
    id: number;
    status: ConditioningStatus;
  }[];
};

interface EventTableRowProps {
  item: EventWithRelations;
}

const EventTableRow = ({ item }: EventTableRowProps) => {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<EventStatus>(item.status);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditingStatus(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: EventStatus) => {
    setPendingStatus(newStatus);
    setShowStatusConfirmation(true);
    setIsEditingStatus(false);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/events/${item.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      setCurrentStatus(pendingStatus);
      toast.success("Event status updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update event status"
      );
    } finally {
      setIsUpdatingStatus(false);
      setShowStatusConfirmation(false);
      setPendingStatus(null);
    }
  };

  const toggleStatusEdit = () => {
    setIsEditingStatus(!isEditingStatus);
  };

  const handleSubmitResults = async (
    results: { gamefowlId: number; result: string; notes?: string }[]
  ) => {
    try {
      const response = await fetch(`/api/events/${item.id}/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit results");
      }

      setShowResultForm(false);
      toast.success("Event results submitted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error submitting results:", error);
      toast.error("Failed to submit event results");
    }
  };

  return (
    <>
      <tr
        key={item.id}
        className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
      >
        <td className="flex items-center gap-4 p-4 dark:text-gray-200">
          <div className="flex flex-col">
            <span>{item.eventName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ID: {item.id}
            </span>
          </div>
        </td>
        <td className="hidden md:table-cell dark:text-gray-200">
          {item.eventType}
        </td>
        <td className="hidden md:table-cell text-center align-middle dark:text-gray-200">
          {item.ageCategory}
        </td>
        <td className="hidden md:table-cell dark:text-gray-200">
          {format(new Date(item.eventDate), "MMM dd, yyyy")}
        </td>
        <td className="hidden md:table-cell dark:text-gray-200">
          {item.gamefowl && item.gamefowl.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {item.gamefowl.map(({ gamefowl }) => (
                <span
                  key={gamefowl.id}
                  className="px-2 py-1 bg-ggPurpleLight dark:bg-gray-700 rounded-md text-xs"
                >
                  {gamefowl.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">No gamefowls</span>
          )}
        </td>
        <td className="p-4 dark:text-gray-200">
          <div className="relative flex items-center gap-2">
            <button
              onClick={toggleStatusEdit}
              className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                currentStatus === "ASSIGNED"
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
            </button>
            {currentStatus === "FINISHED" && (
              <button
                onClick={() => setShowResultForm(true)}
                className="hover:opacity-80 transition-opacity p-1.5"
                title="Add/View Results"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-green-600"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </button>
            )}
            {isEditingStatus && (
              <div
                ref={statusDropdownRef}
                className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700"
              >
                <div className="py-1">
                  <button
                    onClick={() => handleStatusChange("ASSIGNED")}
                    disabled={isUpdatingStatus || currentStatus === "ASSIGNED"}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      currentStatus === "ASSIGNED"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    Assigned
                  </button>
                  <button
                    onClick={() => handleStatusChange("FINISHED")}
                    disabled={isUpdatingStatus || currentStatus === "FINISHED"}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      currentStatus === "FINISHED"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    Finished
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="flex items-center gap-2">
            <FormModal table="event" type="update" data={item} />
            <FormModal table="event" type="delete" id={item.id} />
          </div>
        </td>
      </tr>
      {showResultForm && (
        <EventResultForm
          event={item}
          onClose={() => setShowResultForm(false)}
          onSubmit={handleSubmitResults}
        />
      )}
      {showStatusConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
              Confirm Status Change
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to update the status to{" "}
              <span className="font-medium">{pendingStatus}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusConfirmation(false);
                  setPendingStatus(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-ggPurple text-white rounded hover:bg-ggPurpleDark disabled:opacity-50"
              >
                {isUpdatingStatus ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventTableRow;
