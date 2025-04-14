"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import InputField from "../InputField";

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
}: {
  type: "create" | "update";
  data?: any;
  recordType: "vaccine" | "deworming";
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGamefowls = async () => {
      try {
        const response = await fetch("/api/gamefowls");
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
  } = useForm<MedicalFormData>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      gamefowlId: data?.gamefowlId?.toString() || "",
      name: data?.name || "",
      notes: data?.notes || "",
      date: data?.date ? new Date(data.date).toISOString().split("T")[0] : "",
    },
  });

  const onSubmit = async (formData: MedicalFormData) => {
    try {
      setIsSubmitting(true);
      const endpoint = `/api/${recordType}s`;
      const method = type === "create" ? "POST" : "PUT";
      const url = type === "create" ? endpoint : `${endpoint}/${data.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save medical record");
      }

      router.refresh();
    } catch (error) {
      console.error("Error saving medical record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max self-center transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? "Saving..."
          : type === "create"
          ? `Add ${recordType === "vaccine" ? "Vaccine" : "Deworming"} Record`
          : `Update ${
              recordType === "vaccine" ? "Vaccine" : "Deworming"
            } Record`}
      </button>
    </form>
  );
};

export default MedicalForm;
