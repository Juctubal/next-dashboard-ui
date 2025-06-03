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
  EventType,
  AgeCategory,
} from "@prisma/client";
import FormModal from "@/components/FormModal";
import EventResultForm from "@/components/EventResultForm";
import { format } from "date-fns";
import { EventWithRelations } from "@/types/event";


interface EventWithRelationsFixed extends Omit<EventWithRelations, 'eventDate'> {
  isArchived: boolean;
  eventDate: string | Date; 
}

const EventTableRow = ({ item, role }: { item: EventWithRelationsFixed; role: string }) => {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<EventStatus>(item.status);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentStatus(item.status);
  }, [item.status]);

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

  const handleStatusChange = (newStatus: EventStatus) => {
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

  const handleArchiveToggle = async (archive: boolean) => {
    if (archive) {
      const confirmed = window.confirm("Are you sure you want to archive this event?");
      if (!confirmed) return;
    }
    setIsArchiving(true);
    try {
      // Log the request for debugging
      console.log(`[CLIENT] Archiving event ${item.id}:`, { 
        id: item.id,
        archive, 
        currentStatus: item.isArchived 
      });
      
      // Use the working archive-test API endpoint instead of the direct event archive endpoint
      const requestBody = { 
        type: "event", 
        id: item.id, 
        isArchived: archive === true 
      };
      console.log('[CLIENT] Request payload:', requestBody);
      
      const response = await fetch(`/api/archive-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        cache: 'no-store' // Prevent caching
      });
      
      console.log('[CLIENT] Response status:', response.status);
      
      // Parse the response body
      let responseData;
      try {
        responseData = await response.json();
        console.log('[CLIENT] API response data:', responseData);
      } catch (parseError) {
        console.error('[CLIENT] Failed to parse response:', parseError);
      }
      
      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to update archive status");
      }
      
      // Update succeeded in the database
      if (archive) {
        toast.success("Event successfully archived");
        
        // If we're currently viewing the non-archived list, hide the row
        const showArchived = new URLSearchParams(window.location.search).get("showArchived") === "true";
        console.log('[CLIENT] Current view mode:', { showArchived });
        
        if (!showArchived) {
          console.log('[CLIENT] Hiding row and preparing for page refresh');
          // Get the parent row and hide it
          const row = document.getElementById(`event-row-${item.id}`);
          if (row) {
            row.style.display = "none";
          }
        }
        
        // CRITICAL FIX: Force a complete page reload, not just a client-side refresh
        // This ensures we get fresh data from the server
        console.log('[CLIENT] Forcing complete page reload in 1 second');
        setTimeout(() => {
          console.log('[CLIENT] Performing hard reload after event archive action');
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('_cb', Date.now().toString());
          window.location.href = currentUrl.toString();
        }, 1000);
      } else {
        toast.success("Event unarchived");
        // For unarchiving, also force a full page reload with cache busting to ensure fresh data
        console.log('[CLIENT] Preparing for page refresh after unarchive');
        setTimeout(() => {
          console.log('[CLIENT] Performing hard reload after event unarchive action');
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('_cb', Date.now().toString());
          window.location.href = currentUrl.toString();
        }, 1000);
      }
    } catch (error) {
      console.error("[CLIENT] Archive toggle error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update archive status");
    } finally {
      setIsArchiving(false);
    }
  };



  useEffect(() => {
    setCurrentStatus(item.status);
  }, [item.status]);

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

  const formatDate = (dateInput: string | Date) => {
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <>
      <tr
        id={`event-row-${item.id}`}
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
          {formatDate(item.eventDate)}
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
              {currentStatus ? currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase() : 'Unknown'}
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
            <button
              onClick={() => handleArchiveToggle(!item.isArchived)}
              disabled={isArchiving}
              className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                item.isArchived
                  ? "bg-gray-200 text-gray-500 border-gray-300 hover:bg-gray-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
              }`}
              title={item.isArchived ? "Unarchive Event" : "Archive Event"}
            >
              {item.isArchived ? "Unarchive" : "Archive"}
            </button>
          </div>
        </td>
      </tr>
      {showResultForm && (
        <EventResultForm
          event={{
            ...item,
            eventDate: item.eventDate instanceof Date ? item.eventDate : new Date(item.eventDate)
          } as any}
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
