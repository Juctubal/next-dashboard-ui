"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { EventType, AgeCategory, EventStatus } from "@prisma/client";
import { createEvent, updateEvent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  eventName: z.string().min(1, { message: "Event name is required!" }),
  eventType: z.nativeEnum(EventType, { message: "Event type is required!" }),
  ageCategory: z.nativeEnum(AgeCategory, {
    message: "Age category is required!",
  }),
  eventDate: z.string().min(1, { message: "Event date is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  status: z.nativeEnum(EventStatus, { message: "Status is required!" }),
});

type Inputs = z.infer<typeof schema>;

const EventForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: data || {},
  });

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });

      const result =
        type === "create"
          ? await createEvent(formDataObj)
          : await updateEvent(data.id, formDataObj);

      if (result.success) {
        // Close the modal
        window.dispatchEvent(new CustomEvent("closeModal"));
        // Refresh the page to show the new data
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="flex flex-col gap-8 p-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold dark:text-white">
        {type === "create" ? "Create" : "Update"} Event
      </h1>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <InputField
          label="Event Name"
          name="eventName"
          defaultValue={data?.eventName}
          register={register}
          error={errors?.eventName}
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Event Type
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            {...register("eventType")}
            defaultValue={data?.eventType}
          >
            <option value="">Select Event Type</option>
            {Object.values(EventType).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {errors.eventType?.message && (
            <p className="text-xs text-red-400 dark:text-red-400">
              {errors.eventType.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Age Category
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            {...register("ageCategory")}
            defaultValue={data?.ageCategory}
          >
            <option value="">Select Age Category</option>
            {Object.values(AgeCategory).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.ageCategory?.message && (
            <p className="text-xs text-red-400 dark:text-red-400">
              {errors.ageCategory.message.toString()}
            </p>
          )}
        </div>

        <InputField
          label="Event Date"
          name="eventDate"
          type="date"
          defaultValue={
            data?.eventDate
              ? new Date(data.eventDate).toISOString().split("T")[0]
              : ""
          }
          register={register}
          error={errors?.eventDate}
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Description
          </label>
          <textarea
            className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            {...register("description")}
            defaultValue={data?.description}
            rows={4}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400 dark:text-red-400">
              {errors.description.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Status
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            {...register("status")}
            defaultValue={data?.status}
          >
            <option value="">Select Status</option>
            {Object.values(EventStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400 dark:text-red-400">
              {errors.status.message.toString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={() => {
            // Close the modal
            window.dispatchEvent(new CustomEvent("closeModal"));
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-ggPurple text-white rounded-md disabled:opacity-50 hover:bg-ggPurple/90 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Processing..."
            : type === "create"
            ? "Create"
            : "Update"}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
