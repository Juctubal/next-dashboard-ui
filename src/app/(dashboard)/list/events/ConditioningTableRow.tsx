"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Conditioning, ConditioningStatus } from "@prisma/client";
import FormModal from "@/components/FormModal";

interface Gamefowl {
  id: string;
  name: string;
}

interface Handler {
  id: string;
  first_name: string;
  last_name: string;
}

interface Event {
  id: string;
  eventName: string;
}

interface ConditioningProgram {
  id: string;
  programName: string;
}

interface ConditioningItem {
  id: string;
  startDate: string | null;
  endDate: string | null;
  status: ConditioningStatus;
  gamefowls: { gamefowl: Gamefowl }[];
  handler: Handler;
  event: Event | null;
  conProg: ConditioningProgram;
  isArchived: boolean;
}

interface ConditioningTableRowProps {
  item: ConditioningItem;
  role: string;
}

const ConditioningTableRow = ({ item, role }: ConditioningTableRowProps) => {
  const router = useRouter();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ConditioningStatus>(item.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ConditioningStatus | null>(
    null
  );
  const [isArchiving, setIsArchiving] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item.status) {
      setCurrentStatus(item.status);
    }
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleStatusChange = (newStatus: ConditioningStatus) => {
    setPendingStatus(newStatus);
    setShowStatusConfirmation(true);
    setIsEditingStatus(false);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/conditioning/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: pendingStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update conditioning status");
      }

      setCurrentStatus(pendingStatus);
      toast.success("Conditioning status updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating conditioning status:", error);
      toast.error("Failed to update conditioning status");
    } finally {
      setIsUpdatingStatus(false);
      setShowStatusConfirmation(false);
      setPendingStatus(null);
    }
  };

  const handleArchiveToggle = async (archive: boolean) => {
    if (archive) {
      const confirmed = window.confirm("Are you sure you want to archive this conditioning record?");
      if (!confirmed) return;
    }
    setIsArchiving(true);
    try {
      // Log the request for debugging
      console.log(`[CLIENT] Archiving conditioning record ${item.id}:`, { 
        archive, 
        isBoolean: typeof archive === 'boolean',
        conditioningId: item.id
      });
      
      // Use the working archive-test API endpoint instead of the direct conditioning archive endpoint
      const requestBody = { 
        type: "conditioning",
        id: parseInt(item.id), 
        isArchived: archive 
      };
      console.log('[CLIENT] Request payload:', requestBody);
      
      const response = await fetch(`/api/archive-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      });
      
      console.log('[CLIENT] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CLIENT] Archive API error:', errorData);
        throw new Error(errorData.error || "Failed to update archive status");
      }
      
      // Parse the response and log it
      const responseData = await response.json();
      console.log('[CLIENT] Archive API success:', responseData);
      
      // Debug: Verify the change was made by immediately checking the current status
      setTimeout(async () => {
        try {
          const checkResponse = await fetch(`/api/debug?id=${item.id}&type=conditioning`);
          if (checkResponse.ok) {
            const debugData = await checkResponse.json();
            console.log('[CLIENT] Verification check of archived status:', debugData);
          }
        } catch (e) {
          console.error('[CLIENT] Debug verification error:', e);
        }
      }, 500);
      
      // Update succeeded in the database
      if (archive) {
        toast.success("Conditioning record successfully archived");
        
        // If we've archived an item and aren't showing archived items,
        // hide this row immediately by adding a CSS class
        const showArchived = new URLSearchParams(window.location.search).get("showArchived") === "true";
        if (!showArchived) {
          // Get the parent row and add a class to hide it
          const row = document.getElementById(`conditioning-row-${item.id}`);
          if (row) {
            row.style.display = "none";
          }
          
          // IMPORTANT: Force a complete page reload rather than a soft refresh
          // This ensures we get fresh data from the server without any caching
          setTimeout(() => {
            console.log('[CLIENT] Performing hard reload');
            // Add a cache-busting random query parameter
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('_cb', Date.now().toString());
            window.location.href = currentUrl.toString();
          }, 1000);
        } else {
          // For archive page, do a full reload too with cache busting
          setTimeout(() => {
            console.log('[CLIENT] Performing hard reload on archive page');
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('_cb', Date.now().toString());
            window.location.href = currentUrl.toString();
          }, 1000);
        }
      } else {
        toast.success("Conditioning record unarchived");
        
        // For unarchiving, always do a full page reload with cache busting
        setTimeout(() => {
          console.log('[CLIENT] Performing hard reload after unarchive');
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('_cb', Date.now().toString());
          window.location.href = currentUrl.toString();
        }, 1000);
      }
    } catch (error) {
      console.error('[CLIENT] Archive toggle error:', error);
      toast.error("Failed to update archive status");
    } finally {
      setIsArchiving(false);
    }
  };


  const toggleStatusEdit = () => {
    setIsEditingStatus(!isEditingStatus);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Intl.DateTimeFormat("en-US").format(new Date(dateString));
  };

  return (
    <>
      <tr
        id={`conditioning-row-${item.id}`}
        key={item.id}
        className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
      >
        <td className="p-4 dark:text-gray-200">
          <div className="flex flex-wrap gap-1">
            {item.gamefowls?.map(({ gamefowl }) => (
              <span
                key={gamefowl.id}
                className="px-2 py-1 bg-ggPurpleLight dark:bg-gray-700 rounded-md text-xs"
              >
                {gamefowl.name} (ID: {gamefowl.id})
              </span>
            )) || (
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                No gamefowls assigned
              </span>
            )}
          </div>
        </td>
        <td className="p-4 dark:text-gray-200">
          {item.conProg?.programName || "No program assigned"}
        </td>
        <td className="p-4 dark:text-gray-200">
          {item.event?.eventName || "No event"}
        </td>
        <td className="p-4 dark:text-gray-200">
          {item.handler?.first_name} {item.handler?.last_name}
        </td>
        <td className="hidden md:table-cell p-4 dark:text-gray-200">
          {formatDate(item.startDate)}
        </td>
        <td className="hidden md:table-cell p-4 dark:text-gray-200">
          {formatDate(item.endDate)}
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
            <button
              onClick={() => handleArchiveToggle(!item.isArchived)}
              disabled={isArchiving}
              className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                item.isArchived
                  ? "bg-gray-200 text-gray-500 border-gray-300 hover:bg-gray-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
              }`}
              title={item.isArchived ? "Unarchive Conditioning" : "Archive Conditioning"}
            >
              {item.isArchived ? "Unarchive" : "Archive"}
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

export default ConditioningTableRow;
