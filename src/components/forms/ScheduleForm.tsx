"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import InputField from "../InputField";

const schema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  taskType: z.string().min(1, "Task type is required"),
  taskCategory: z.string().min(1, "Task category is required"),
  taskDesc: z.string().min(1, "Task description is required"),
  staffId: z.string().optional(),
  staffType: z.enum(["HANDLER", "BREEDER"]).optional(),
});

type Inputs = z.infer<typeof schema>;

type Staff = {
  id: string;
  first_name: string;
  last_name: string;
  role: "HANDLER" | "BREEDER";
};

const ScheduleForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: data || {},
  });

  const selectedStaffType = watch("staffType");

  // Fetch staff data
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/staff");
        if (response.ok) {
          const data = await response.json();
          setStaff(data);
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    };
    fetchStaff();
  }, []);

  // Filter staff based on selected staff type
  useEffect(() => {
    if (selectedStaffType) {
      const filtered = staff.filter((s) => s.role === selectedStaffType);
      setFilteredStaff(filtered);
      // Clear staffId if the selected staff type changes
      setValue("staffId", "");
    } else {
      setFilteredStaff([]);
      setValue("staffId", "");
    }
  }, [selectedStaffType, staff, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formDataObj.append(key, value);
        }
      });

      console.log("Submitting form data:", Object.fromEntries(formDataObj));

      const result =
        type === "create"
          ? await fetch("/api/schedules", {
              method: "POST",
              body: formDataObj,
            })
          : await fetch(`/api/schedules/${data.id}`, {
              method: "PUT",
              body: formDataObj,
            });

      const responseData = await result.json();

      if (result.ok) {
        setSuccessMessage("Schedule successfully created!");
        // Wait for 1.5 seconds before closing the modal and refreshing
        setTimeout(() => {
          // Close the modal
          window.dispatchEvent(new CustomEvent("closeModal"));
          // Refresh the page to show the new data
          router.refresh();
        }, 1500);
      } else {
        setError(
          responseData.details
            ? `Error: ${responseData.details}`
            : responseData.error || "An error occurred"
        );
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="flex flex-col gap-6 p-6" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 dark:text-gray-400">
          Task Name
        </label>
        <input
          className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          {...register("taskName")}
          defaultValue={data?.taskName}
        />
        {errors.taskName?.message && (
          <p className="text-xs text-red-400 dark:text-red-400">
            {errors.taskName.message.toString()}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 dark:text-gray-400">
          Task Type
        </label>
        <select
          className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          {...register("taskType")}
          defaultValue={data?.taskType}
        >
          <option value="">Select Task Type</option>
          <option value="RECURRING">Recurring</option>
          <option value="ONETIME">One Time</option>
        </select>
        {errors.taskType?.message && (
          <p className="text-xs text-red-400 dark:text-red-400">
            {errors.taskType.message.toString()}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 dark:text-gray-400">
          Task Category
        </label>
        <select
          className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          {...register("taskCategory")}
          defaultValue={data?.taskCategory}
        >
          <option value="">Select Task Category</option>
          <option value="FEEDING">Feeding</option>
          <option value="VACCINATION">Vaccination</option>
          <option value="DEWORMING">Deworming</option>
        </select>
        {errors.taskCategory?.message && (
          <p className="text-xs text-red-400 dark:text-red-400">
            {errors.taskCategory.message.toString()}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 dark:text-gray-400">
          Task Description
        </label>
        <textarea
          className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          {...register("taskDesc")}
          defaultValue={data?.taskDesc}
          rows={4}
        />
        {errors.taskDesc?.message && (
          <p className="text-xs text-red-400 dark:text-red-400">
            {errors.taskDesc.message.toString()}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 dark:text-gray-400">
          Staff Type
        </label>
        <select
          className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          {...register("staffType")}
          defaultValue={data?.staffType}
        >
          <option value="">Select Staff Type</option>
          <option value="HANDLER">Handler</option>
          <option value="BREEDER">Breeder</option>
        </select>
        {errors.staffType?.message && (
          <p className="text-xs text-red-400 dark:text-red-400">
            {errors.staffType.message.toString()}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 dark:text-gray-400">
          Staff
        </label>
        <select
          className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          {...register("staffId")}
          defaultValue={data?.staffId}
          disabled={!selectedStaffType}
        >
          <option value="">
            {selectedStaffType
              ? `Select ${selectedStaffType}`
              : "Select staff type first"}
          </option>
          {filteredStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} - {s.first_name} {s.last_name}
            </option>
          ))}
        </select>
        {errors.staffId?.message && (
          <p className="text-xs text-red-400 dark:text-red-400">
            {errors.staffId.message.toString()}
          </p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {successMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <p className="text-green-500 text-lg font-semibold">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("closeModal"));
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max self-center transition-colors mt-4"
        >
          {isSubmitting
            ? "Creating..."
            : type === "create"
            ? "Create Schedule"
            : "Update Schedule"}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;
