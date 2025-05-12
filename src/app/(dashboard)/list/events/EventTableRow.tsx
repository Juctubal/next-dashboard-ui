"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Event, EventStatus, ConditioningStatus } from "@prisma/client";
import FormModal from "@/components/FormModal";

type EventWithRelations = Event & {
  gamefowl: {
    gamefowl: {
      id: number;
      name: string;
    };
  }[];
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
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<EventStatus>(
    item.status as EventStatus
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleStatusChange = async (newStatus: EventStatus) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/event/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update event status");
        return;
      }

      setCurrentStatus(newStatus);
      setIsEditingStatus(false);
      toast.success("Event status updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Failed to update event status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const toggleStatusEdit = () => {
    setIsEditingStatus(!isEditingStatus);
  };

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
    >
      <td className="flex items-center gap-4 p-4 dark:text-gray-200">
        {item.eventName}
      </td>
      <td className="hidden md:table-cell dark:text-gray-200">
        {item.eventType}
      </td>
      <td className="hidden md:table-cell text-center align-middle dark:text-gray-200">
        {item.ageCategory}
      </td>
      <td className="hidden md:table-cell dark:text-gray-200">
        {new Intl.DateTimeFormat("en-US").format(item.eventDate)}
      </td>
      <td className="hidden md:table-cell dark:text-gray-200">
        {item.gamefowl && item.gamefowl.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.gamefowl.map((gamefowl) => (
              <span
                key={gamefowl.gamefowl.id}
                className="px-2 py-1 bg-ggPurpleLight dark:bg-gray-700 rounded-md text-xs"
              >
                {gamefowl.gamefowl.name} (ID: {gamefowl.gamefowl.id})
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
              onClick={() => router.push(`/list/events/${item.id}`)}
              className="hover:opacity-80 transition-opacity p-1.5"
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
  );
};

export default EventTableRow;
