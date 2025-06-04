"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import InputField from "../InputField";
import { toast } from "react-hot-toast";
import Notification from "../ui/Notification";

const medicalSchema = z.object({
  gamefowlIds: z
    .array(z.string())
    .min(1, "At least one gamefowl must be selected"),
  name: z.string().min(1, "Medicine name is required"),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type MedicalFormData = z.infer<typeof medicalSchema>;

type Gamefowl = {
  id: number;
  name: string;
  bloodline?: string;
  status?: string;
};

const MedicalForm = ({
  type,
  data,
  recordType,
  onClose,
}: {
  type: "create" | "update";
  data?: any;
  recordType: "vaccine" | "deworming";
  onClose?: () => void;
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedGamefowls, setSelectedGamefowls] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter gamefowls based on search query and exclude deceased/sold
  const filteredGamefowls = useMemo(() => {
    // First filter out deceased and sold gamefowls
    const availableGamefowls = gamefowls.filter((gamefowl) => {
      const status = gamefowl.status?.toUpperCase();
      return status !== "DECEASED" && status !== "SOLD";
    });

    // Then apply search filter if there's a search query
    if (!searchQuery.trim()) {
      return availableGamefowls;
    }

    const query = searchQuery.toLowerCase().trim();
    return availableGamefowls.filter((gamefowl) => {
      const name = gamefowl.name.toLowerCase();
      const id = gamefowl.id.toString();
      const bloodline = gamefowl.bloodline?.toLowerCase() || "";

      return (
        name.includes(query) || id.includes(query) || bloodline.includes(query)
      );
    });
  }, [gamefowls, searchQuery]);

  useEffect(() => {
    const fetchGamefowls = async () => {
      try {
        const response = await fetch("/api/gamefowl/list");
        if (!response.ok) {
          throw new Error("Failed to fetch gamefowls");
        }
        const data = await response.json();
        setGamefowls(data);
      } catch (error) {
        console.error("Error fetching gamefowls:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGamefowls();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MedicalFormData>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      gamefowlIds: data?.gamefowlId ? [data.gamefowlId.toString()] : [],
      name: data?.name || "",
      notes: data?.notes || "",
      date: data?.vaccinationDate
        ? new Date(data.vaccinationDate).toISOString().split("T")[0]
        : data?.dewormDate
        ? new Date(data.dewormDate).toISOString().split("T")[0]
        : "",
    },
  });

  // Set the gamefowl ID after the gamefowls are loaded
  useEffect(() => {
    if (data?.gamefowlId && gamefowls.length > 0) {
      const initialIds = [data.gamefowlId.toString()];
      setValue("gamefowlIds", initialIds);
      setSelectedGamefowls(initialIds);
    }
  }, [data?.gamefowlId, gamefowls, setValue]);

  const handleGamefowlSelection = (gamefowlId: string) => {
    const newSelection = selectedGamefowls.includes(gamefowlId)
      ? selectedGamefowls.filter((id) => id !== gamefowlId)
      : [...selectedGamefowls, gamefowlId];

    setSelectedGamefowls(newSelection);
    setValue("gamefowlIds", newSelection);
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredGamefowls.map((g) => g.id.toString());
    setSelectedGamefowls(allFilteredIds);
    setValue("gamefowlIds", allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedGamefowls([]);
    setValue("gamefowlIds", []);
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const onSubmit = async (formData: MedicalFormData) => {
    try {
      setIsSubmitting(true);
      const endpoint = `/api/${recordType}s`;

      // Add a minimum loading time of 2 seconds for better UX
      const startTime = Date.now();

      // For update operations, we still handle single records
      if (type === "update") {
        const requestData = {
          ...formData,
          gamefowlId: formData.gamefowlIds[0], // Use the first selected gamefowl for updates
          id: data?.id,
          date: formData.date,
        };

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error("Failed to update medical record");
        }
      } else {
        // For create operations, handle multiple gamefowls
        const promises = formData.gamefowlIds.map((gamefowlId) => {
          const requestData = {
            gamefowlId,
            name: formData.name,
            notes: formData.notes,
            date: formData.date,
          };

          return fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          });
        });

        const responses = await Promise.all(promises);

        // Check if all requests were successful
        const failedResponses = responses.filter((response) => !response.ok);
        if (failedResponses.length > 0) {
          throw new Error(
            `Failed to save ${failedResponses.length} medical record(s)`
          );
        }
      }

      // Calculate how much time has passed
      const elapsedTime = Date.now() - startTime;
      const minimumLoadingTime = 1500; // 1.5 seconds minimum

      // If the operation took less than the minimum time, wait for the remainder
      if (elapsedTime < minimumLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumLoadingTime - elapsedTime)
        );
      }

      // Show success message
      const recordCount = type === "create" ? formData.gamefowlIds.length : 1;
      const recordText = recordCount === 1 ? "record" : "records";

      setNotification({
        message: `${
          recordType === "vaccine" ? "Vaccine" : "Deworming"
        } ${recordText} ${
          type === "create" ? "added" : "updated"
        } successfully${
          recordCount > 1 ? ` for ${recordCount} gamefowls` : ""
        }`,
        type: "success",
      });

      // Close the modal after a longer delay (2 seconds)
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent("closeModal"));
        }
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Error saving medical record:", error);
      setNotification({
        message: `Failed to ${type} ${recordType} record${
          type === "create" && formData.gamefowlIds.length > 1 ? "s" : ""
        }`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-green-500 dark:text-green-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 dark:text-gray-200">
          {recordType === "vaccine" ? "Vaccine" : "Deworming"} Record{" "}
          {type === "create" ? "Added" : "Updated"} Successfully!
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          The {recordType} record has been{" "}
          {type === "create" ? "created" : "updated"}.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
        <div className="space-y-2">
          <label
            htmlFor="gamefowls"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Gamefowl{type === "create" ? "s" : ""}{" "}
            {type === "create" && "(Select multiple)"}
          </label>

          {type === "create" ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, ID, or bloodline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {/* Select All/Deselect All Buttons */}
              {filteredGamefowls.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                  >
                    Select All ({filteredGamefowls.length})
                  </button>
                  {selectedGamefowls.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Deselect All
                    </button>
                  )}
                </div>
              )}

              {/* Multiple selection checkboxes */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto bg-white dark:bg-gray-700">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Loading gamefowls...
                  </div>
                ) : filteredGamefowls.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "No gamefowls found matching your search."
                      : "No gamefowls available."}
                  </div>
                ) : (
                  filteredGamefowls.map((gamefowl) => (
                    <label
                      key={gamefowl.id}
                      className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGamefowls.includes(
                          gamefowl.id.toString()
                        )}
                        onChange={() =>
                          handleGamefowlSelection(gamefowl.id.toString())
                        }
                        className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          {gamefowl.name} (ID: {gamefowl.id})
                        </span>
                        {gamefowl.bloodline && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Bloodline: {gamefowl.bloodline}
                          </span>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Single selection for update mode
            <select
              id="gamefowls"
              value={selectedGamefowls[0] || ""}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedGamefowls(value ? [value] : []);
                setValue("gamefowlIds", value ? [value] : []);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              required
              disabled={isLoading}
            >
              <option value="">Select a gamefowl</option>
              {filteredGamefowls.map((gamefowl) => (
                <option key={gamefowl.id} value={gamefowl.id}>
                  {gamefowl.name} (ID: {gamefowl.id})
                  {gamefowl.bloodline ? ` - ${gamefowl.bloodline}` : ""}
                </option>
              ))}
            </select>
          )}

          {selectedGamefowls.length > 0 && type === "create" && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedGamefowls.length} gamefowl
              {selectedGamefowls.length !== 1 ? "s" : ""} selected
            </p>
          )}

          {errors.gamefowlIds && (
            <p className="text-red-500 text-sm">{errors.gamefowlIds.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Medicine Name
          </label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Date Administered
          </label>
          <input
            type="date"
            id="date"
            {...register("date")}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required
          />
          {errors.date && (
            <p className="text-red-500 text-sm">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            {...register("notes")}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            rows={4}
          />
          {errors.notes && (
            <p className="text-red-500 text-sm">{errors.notes.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={
              onClose ||
              (() => window.dispatchEvent(new CustomEvent("closeModal")))
            }
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting || isLoading || selectedGamefowls.length === 0
            }
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
                <span className="font-medium">
                  {type === "create" ? "Creating..." : "Updating..."}
                </span>
              </>
            ) : type === "create" ? (
              `Add ${
                recordType === "vaccine" ? "Vaccine" : "Deworming"
              } Record${selectedGamefowls.length > 1 ? "s" : ""}`
            ) : (
              `Update ${
                recordType === "vaccine" ? "Vaccine" : "Deworming"
              } Record`
            )}
          </button>
        </div>
      </form>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={handleNotificationClose}
        />
      )}
    </>
  );
};

export default MedicalForm;
