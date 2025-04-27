"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Incubation, IncubationStatus } from "@prisma/client";

// Extend the Incubation type to include breedingId
type ExtendedIncubation = Incubation & {
  breedingId?: number;
};

interface IncubationFormProps {
  type: "create" | "update";
  data?: ExtendedIncubation;
  onClose: () => void;
  breedingId?: number;
}

const IncubationForm = ({
  type,
  data,
  onClose,
  breedingId,
}: IncubationFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    incStart: data?.incStart
      ? new Date(data.incStart).toISOString().split("T")[0]
      : "",
    eggCount: data?.eggCount?.toString() || "",
    status: (data?.status || "ONGOING") as IncubationStatus,
    breedingId: breedingId || data?.breedingId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add a delay to match event creation loading time
      await new Promise((resolve) => setTimeout(resolve, 800));

      const url =
        type === "create" ? "/api/incubation" : `/api/incubation/${data?.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${type} incubation record`);
      }

      toast.success(`Incubation record ${type}d successfully`);
      router.refresh();
      onClose();
    } catch (error) {
      console.error(`Error ${type}ing incubation record:`, error);
      toast.error(`Failed to ${type} incubation record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={formData.incStart}
            onChange={(e) =>
              setFormData({ ...formData, incStart: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ggPurple focus:border-ggPurple dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Eggs
          </label>
          <input
            type="number"
            min="1"
            value={formData.eggCount}
            onChange={(e) =>
              setFormData({ ...formData, eggCount: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ggPurple focus:border-ggPurple dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        {type === "create" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as IncubationStatus,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ggPurple focus:border-ggPurple dark:bg-gray-700 dark:text-white"
            >
              <option value="ONGOING">Ongoing</option>
              <option value="FINISHED">Finished</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-ggPurple text-white rounded-md hover:bg-ggPurpleDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{type === "create" ? "Creating..." : "Updating..."}</span>
            </>
          ) : type === "create" ? (
            "Create"
          ) : (
            "Update"
          )}
        </button>
      </div>
    </form>
  );
};

export default IncubationForm;
