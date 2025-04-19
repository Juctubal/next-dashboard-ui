"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { Breeding, Gamefowl } from "@prisma/client";
import FormModal from "@/components/FormModal";

type BreedingWithRelations = Breeding & {
  sire: Gamefowl;
  dam: Gamefowl;
  startDate: Date;
  endDate: Date | null;
};

type BreedingStatus = "ONGOING" | "FINISHED";

interface BreedingTableRowProps {
  item: BreedingWithRelations;
}

const BreedingTableRow = ({ item }: BreedingTableRowProps) => {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<BreedingStatus>(
    item.status as BreedingStatus
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showEggCountingConfirmation, setShowEggCountingConfirmation] =
    useState(false);
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

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await fetch(`/api/breeding/${item.id}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isArchived: !item.isArchived }),
      });

      if (!response.ok) {
        throw new Error("Failed to update archive status");
      }

      toast.success(
        `Breeding record ${
          item.isArchived ? "unarchived" : "archived"
        } successfully`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating archive status:", error);
      toast.error("Failed to update archive status");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleStatusChange = async (newStatus: BreedingStatus) => {
    if (newStatus === "FINISHED") {
      setShowFinishConfirmation(true);
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/breeding/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setCurrentStatus(newStatus);
      toast.success("Status updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
      setIsEditingStatus(false);
    }
  };

  const confirmFinishStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/breeding/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "FINISHED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setCurrentStatus("FINISHED");
      toast.success("Breeding marked as finished");
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
      setIsEditingStatus(false);
      setShowFinishConfirmation(false);
    }
  };

  const toggleStatusEdit = () => {
    setIsEditingStatus(!isEditingStatus);
  };

  const handleEggCountingClick = () => {
    setShowEggCountingConfirmation(true);
  };

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
    >
      <td className="p-4 dark:text-gray-200">{item.id}</td>
      <td className="p-4 dark:text-gray-200">
        <div className="flex flex-col">
          <span className="font-medium">{item.sire.name}</span>
          <span className="text-xs text-gray-500">ID: {item.sireId}</span>
        </div>
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        <div className="flex flex-col">
          <span className="font-medium">{item.dam.name}</span>
          <span className="text-xs text-gray-500">ID: {item.damId}</span>
        </div>
      </td>
      <td className="hidden lg:table-cell p-4 dark:text-gray-200">
        {new Date(item.startDate).toLocaleDateString()}
      </td>
      <td className="hidden lg:table-cell p-4 dark:text-gray-200">
        {item.endDate ? new Date(item.endDate).toLocaleDateString() : "-"}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.notes}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        <div className="relative flex items-center gap-2">
          <button
            onClick={toggleStatusEdit}
            className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
              currentStatus === "ONGOING"
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
          </button>
          {currentStatus === "FINISHED" && (
            <button
              onClick={handleEggCountingClick}
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/egg.png"
                alt="Finished indicator"
                width={12}
                height={12}
              />
            </button>
          )}
          {isEditingStatus && (
            <div
              ref={statusDropdownRef}
              className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700"
            >
              <div className="py-1">
                <button
                  onClick={() => handleStatusChange("ONGOING")}
                  disabled={isUpdatingStatus || currentStatus === "ONGOING"}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    currentStatus === "ONGOING"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Ongoing
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
          {showFinishConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Mark this as finished?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to mark this breeding as finished?
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowFinishConfirmation(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmFinishStatus}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingStatus ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showEggCountingConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Incubation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Proceed to Incubation?
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowEggCountingConfirmation(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowEggCountingConfirmation(false);
                      // TODO: Add navigation to egg counting page
                      router.push(`/list/egg-counting?breedingId=${item.id}`);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <FormModal table="breeding" type="update" data={item} />
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-ggYellow"
          >
            <Image
              src={item.isArchived ? "/unarchive.svg" : "/archive.svg"}
              alt={item.isArchived ? "Unarchive" : "Archive"}
              width={16}
              height={16}
            />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BreedingTableRow;
