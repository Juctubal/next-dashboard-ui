"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import InputField from "../InputField";
import { toast } from "react-hot-toast";
import Notification from "../ui/Notification";

const medicalSchema = z.object({
  gamefowlId: z.string().min(1, "Gamefowl ID is required"),
  name: z.string().min(1, "Medicine name is required"),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type MedicalFormData = z.infer<typeof medicalSchema>;

type Gamefowl = {
  id: number;
  name: string;
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
  } = useForm<MedicalFormData>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      gamefowlId: data?.gamefowlId?.toString() || "",
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
      setValue("gamefowlId", data.gamefowlId.toString());
    }
  }, [data?.gamefowlId, gamefowls, setValue]);

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const onSubmit = async (formData: MedicalFormData) => {
    try {
      setIsSubmitting(true);
      const endpoint = `/api/${recordType}s`;
      const method = type === "create" ? "POST" : "PUT";

      // Prepare the data based on record type
      const requestData = {
        ...formData,
        id: data?.id,
        date: formData.date,
      };

      // Add a minimum loading time of 2 seconds for better UX
      const startTime = Date.now();

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to save medical record");
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
      setNotification({
        message: `${
          recordType === "vaccine" ? "Vaccine" : "Deworming"
        } record ${type === "create" ? "added" : "updated"} successfully`,
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
        message: `Failed to ${type} ${recordType} record`,
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
            htmlFor="gamefowlId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Gamefowl
          </label>
          <select
            id="gamefowlId"
            {...register("gamefowlId")}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required
            disabled={isLoading}
          >
            <option value="">Select a gamefowl</option>
            {gamefowls.map((gamefowl) => (
              <option key={gamefowl.id} value={gamefowl.id}>
                {gamefowl.name} (ID: {gamefowl.id})
              </option>
            ))}
          </select>
          {errors.gamefowlId && (
            <p className="text-red-500 text-sm">{errors.gamefowlId.message}</p>
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
            disabled={isSubmitting || isLoading}
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
              `Add ${recordType === "vaccine" ? "Vaccine" : "Deworming"} Record`
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
