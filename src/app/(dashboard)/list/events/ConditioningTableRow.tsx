"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Conditioning, ConditioningStatus } from "@prisma/client";
import FormModal from "@/components/FormModal";

type ConditioningWithRelations = Conditioning & {
  conProg: {
    id: number;
    programName: string;
  };
  event: {
    id: number;
    eventName: string;
  } | null;
  handler: {
    id: string;
    first_name: string;
    last_name: string;
  };
  gamefowls: {
    gamefowl: {
      id: number;
      name: string;
    };
  }[];
};

interface ConditioningTableRowProps {
  item: ConditioningWithRelations;
  role: string;
}

const ConditioningTableRow = ({ item, role }: ConditioningTableRowProps) => {
  const router = useRouter();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ConditioningStatus>(
    item.status as ConditioningStatus
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

  const handleStatusChange = async (newStatus: ConditioningStatus) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/conditioning/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update conditioning status");
      }

      setCurrentStatus(newStatus);
      setIsEditingStatus(false);
      toast.success("Conditioning status updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating conditioning status:", error);
      toast.error("Failed to update conditioning status");
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
      <td className="p-4 dark:text-gray-200">
        <div className="flex flex-wrap gap-1">
          {item.gamefowls.map(({ gamefowl }) => (
            <span
              key={gamefowl.id}
              className="px-2 py-1 bg-ggPurpleLight dark:bg-gray-700 rounded-md text-xs"
            >
              {gamefowl.name} (ID: {gamefowl.id})
            </span>
          ))}
        </div>
      </td>
      <td className="p-4 dark:text-gray-200">{item.conProg.programName}</td>
      <td className="p-4 dark:text-gray-200">
        {item.event?.eventName || "No event"}
      </td>
      <td className="p-4 dark:text-gray-200">
        {item.handler.first_name} {item.handler.last_name}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {new Intl.DateTimeFormat("en-US").format(item.startDate)}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.endDate
          ? new Intl.DateTimeFormat("en-US").format(item.endDate)
          : "Not set"}
      </td>
      <td className="p-4 dark:text-gray-200">
        <div className="relative">
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
                  onClick={() => handleStatusChange("COMPLETED")}
                  disabled={isUpdatingStatus || currentStatus === "COMPLETED"}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    currentStatus === "COMPLETED"
                      ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="conditioning" type="update" data={item} />
              <FormModal table="conditioning" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ConditioningTableRow;
