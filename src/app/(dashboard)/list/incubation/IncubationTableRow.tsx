"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Batch, Breeding, Incubation, IncubationStatus } from "@prisma/client";
import FormModal from "@/components/FormModal";

type IncubationWithRelations = Incubation & {
  batch: Batch[];
  breeding?: Breeding & {
    sire: { name: string };
    dam: { name: string };
  };
  isArchived?: boolean;
};

interface IncubationTableRowProps {
  item: IncubationWithRelations;
}

const IncubationTableRow = ({ item }: IncubationTableRowProps) => {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<IncubationStatus>(
    item.status as IncubationStatus
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchFormData, setBatchFormData] = useState({
    eggsHatched: "",
    maleChicks: "",
    femaleChicks: "",
    dateHatched: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);
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
      const response = await fetch(`/api/incubation/${item.id}/archive`, {
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
        `Incubation record ${
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

  const handleStatusChange = async (newStatus: IncubationStatus) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/incubation/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update incubation status");
      }

      setCurrentStatus(newStatus);
      setIsEditingStatus(false);
      toast.success("Incubation status updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating incubation status:", error);
      toast.error("Failed to update incubation status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const toggleStatusEdit = () => {
    setIsEditingStatus(!isEditingStatus);
  };

  const handleBatchClick = () => {
    setShowBatchForm(true);
  };

  const validateChickCounts = (
    eggsHatched: string,
    maleChicks: string,
    femaleChicks: string
  ) => {
    const total = parseInt(eggsHatched) || 0;
    const male = parseInt(maleChicks) || 0;
    const female = parseInt(femaleChicks) || 0;

    if (total === 0) return null;
    if (male + female !== total) {
      return `Total of male (${male}) and female (${female}) chicks must equal total eggs hatched (${total})`;
    }
    return null;
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const eggsHatched = parseInt(batchFormData.eggsHatched);
      const maleChicks = parseInt(batchFormData.maleChicks);
      const femaleChicks = parseInt(batchFormData.femaleChicks);
      const eggCount = item.eggCount;
      const hatchRate = (eggsHatched / eggCount) * 100;

      const error = validateChickCounts(
        batchFormData.eggsHatched,
        batchFormData.maleChicks,
        batchFormData.femaleChicks
      );
      if (error) {
        toast.error(error);
        return;
      }

      const response = await fetch("/api/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hatchRate: hatchRate,
          dateHatched: new Date(batchFormData.dateHatched),
          incubate_id: item.id,
          maleChicks: maleChicks,
          femaleChicks: femaleChicks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create batch record");
      }

      // Close the form first
      setShowBatchForm(false);

      // Show success message about gamefowls being added
      toast.success(
        `Gamefowls successfully added (${maleChicks} male, ${femaleChicks} female)`
      );

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error creating batch record:", error);
      toast.error("Failed to create batch record");
    }
  };

  // Calculate hatch rate based on eggs hatched and total egg count
  const calculateHatchRate = () => {
    if (!batchFormData.eggsHatched || !item.eggCount) return 0;
    const eggsHatched = parseInt(batchFormData.eggsHatched);
    return ((eggsHatched / item.eggCount) * 100).toFixed(2);
  };

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
    >
      <td className="p-4 dark:text-gray-200">{item.id}</td>
      <td className="p-4 dark:text-gray-200">
        {new Date(item.incStart).toLocaleDateString()}
      </td>
      <td className="p-4 dark:text-gray-200">
        {new Date(item.incEnd).toLocaleDateString()}
      </td>
      <td className="p-4 dark:text-gray-200">{item.eggCount}</td>
      <td className="p-4 dark:text-gray-200">
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
              onClick={handleBatchClick}
              className="hover:opacity-80 transition-opacity p-1.5 rounded-full bg-ggYellow"
            >
              <Image
                src="/chick.png"
                alt="Batch indicator"
                width={16}
                height={16}
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
        </div>
      </td>
      <td className="p-4 dark:text-gray-200">
        {item.breeding ? (
          <div className="flex flex-col">
            <span className="font-medium">
              {item.breeding.sire.name} × {item.breeding.dam.name}
            </span>
            <span className="text-xs text-gray-500">
              Breeding ID: {item.breeding.id}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="p-4 dark:text-gray-200">
        <div className="flex items-center gap-2">
          <FormModal table="incubation" type="update" data={item} />
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
      {showBatchForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create Batch Record
            </h3>
            <form onSubmit={handleBatchSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Eggs Hatched (out of {item.eggCount})
                </label>
                <input
                  type="number"
                  min="0"
                  max={item.eggCount}
                  value={batchFormData.eggsHatched}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setBatchFormData({
                      ...batchFormData,
                      eggsHatched: newValue,
                    });
                    setValidationError(
                      validateChickCounts(
                        newValue,
                        batchFormData.maleChicks,
                        batchFormData.femaleChicks
                      )
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ggPurple focus:border-ggPurple dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Male Chicks
                </label>
                <input
                  type="number"
                  min="0"
                  max={parseInt(batchFormData.eggsHatched) || 0}
                  value={batchFormData.maleChicks}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setBatchFormData({
                      ...batchFormData,
                      maleChicks: newValue,
                    });
                    setValidationError(
                      validateChickCounts(
                        batchFormData.eggsHatched,
                        newValue,
                        batchFormData.femaleChicks
                      )
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ggPurple focus:border-ggPurple dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Female Chicks
                </label>
                <input
                  type="number"
                  min="0"
                  max={parseInt(batchFormData.eggsHatched) || 0}
                  value={batchFormData.femaleChicks}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setBatchFormData({
                      ...batchFormData,
                      femaleChicks: newValue,
                    });
                    setValidationError(
                      validateChickCounts(
                        batchFormData.eggsHatched,
                        batchFormData.maleChicks,
                        newValue
                      )
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ggPurple focus:border-ggPurple dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              {validationError && (
                <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
                  {validationError}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hatch Rate (%)
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  {calculateHatchRate()}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Calculated as (eggs hatched / total eggs) × 100
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Hatched
                </label>
                <input
                  type="date"
                  value={batchFormData.dateHatched}
                  onChange={(e) =>
                    setBatchFormData({
                      ...batchFormData,
                      dateHatched: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ggPurple focus:border-ggPurple dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowBatchForm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </tr>
  );
};

export default IncubationTableRow;
