"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import InputField from "../InputField";
import { RecurrencePattern, TaskType, EventStatus } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import Notification from "../ui/Notification";

// Define the schema for the form
const schema = z
  .object({
    taskName: z.string().min(1, "Task name is required"),
    taskType: z.string().min(1, "Task type is required"),
    taskCategory: z.string().min(1, "Task category is required"),
    taskDesc: z.string().min(1, "Task description is required"),
    status: z.enum(["ASSIGNED", "FINISHED"]).default("ASSIGNED"),
    staffId: z.string().optional(),
    staffType: z.enum(["handler", "breeder"]).optional(),
    // One-time schedule fields
    taskDate: z.string().optional(),
    // Recurring schedule fields
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    reccurencePattern: z.string().optional(),
    time_of_day: z
      .array(z.string())
      .min(1, "At least one time of day is required"),
    // Weekly specific fields
    weekDays: z.array(z.string()).optional(),
    // Monthly specific fields
    monthDay: z.string().optional(),
    // Custom dates for "Other" pattern
    customDates: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // If taskType is ONETIME, taskDate and time_of_day are required
      if (data.taskType === "ONETIME") {
        return !!data.taskDate && !!data.time_of_day.length;
      }
      // If taskType is RECURRING, startDate, endDate, reccurencePattern, and time_of_day are required
      if (data.taskType === "RECURRING") {
        // For "Other" pattern, we need customDates instead of startDate/endDate
        if (data.reccurencePattern === "CUSTOM") {
          return (
            !!data.reccurencePattern &&
            !!data.time_of_day.length &&
            data.customDates &&
            data.customDates.length > 0
          );
        }
        return (
          !!data.startDate &&
          !!data.endDate &&
          !!data.reccurencePattern &&
          !!data.time_of_day.length
        );
      }
      return true;
    },
    {
      message: "Please fill in all required fields for the selected task type",
      path: ["taskType"],
    }
  );

type Inputs = z.infer<typeof schema>;

type Staff = {
  id: string;
  first_name: string;
  last_name: string;
  role: "handler" | "breeder";
};

const ScheduleForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [duplicateDateError, setDuplicateDateError] = useState<string | null>(
    null
  );

  // Map database fields to form fields
  const mappedData = data
    ? {
        ...data,
        taskDesc: data.descript || data.taskDesc,
        status: data.status || "ASSIGNED",
        taskDate: data.oneTime?.[0]?.taskDate
          ? new Date(data.oneTime[0].taskDate).toISOString().split("T")[0]
          : data.taskDate,
        time_of_day:
          data.oneTime?.length > 0
            ? data.oneTime.map((slot: any) => slot.time_of_day)
            : data.recurrent?.length > 0
            ? data.recurrent.map((slot: any) => slot.time_of_day)
            : data.time_of_day
            ? [data.time_of_day]
            : [],
        startDate: data.recurrent?.[0]?.startDate
          ? new Date(data.recurrent[0].startDate).toISOString().split("T")[0]
          : data.startDate,
        endDate: data.recurrent?.[0]?.endDate
          ? new Date(data.recurrent[0].endDate).toISOString().split("T")[0]
          : data.endDate,
        reccurencePattern:
          data.recurrent?.[0]?.reccurencePattern || data.reccurencePattern,
        weekDays: data.recurrent?.[0]?.weekDays
          ? (() => {
              try {
                // If it's already an array, return it
                if (Array.isArray(data.recurrent[0].weekDays)) {
                  return data.recurrent[0].weekDays;
                }

                // If it's a string that looks like JSON, parse it
                if (
                  typeof data.recurrent[0].weekDays === "string" &&
                  (data.recurrent[0].weekDays.startsWith("[") ||
                    data.recurrent[0].weekDays.startsWith("{"))
                ) {
                  return JSON.parse(data.recurrent[0].weekDays);
                }

                // Otherwise, split by comma
                return data.recurrent[0].weekDays.split(",");
              } catch (error) {
                console.error("Error parsing weekDays:", error);
                return [];
              }
            })()
          : data.weekDays,
        monthDay: data.recurrent?.[0]?.monthDay || data.monthDay,
        customDates: data.recurrent?.[0]?.customDate
          ? (() => {
              try {
                return JSON.parse(data.recurrent[0].customDate);
              } catch (error) {
                console.error("Error parsing customDate:", error);
                return [];
              }
            })()
          : [],
      }
    : {};

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: mappedData,
  });

  // Set initial values for time slots
  useEffect(() => {
    if (data) {
      let timeSlotsToSet: string[] = [];

      // Check for time slots in oneTime schedules
      if (data.oneTime && data.oneTime.length > 0) {
        timeSlotsToSet = data.oneTime.map((slot: any) => slot.time_of_day);
      }
      // Check for time slots in recurrent schedules
      else if (data.recurrent && data.recurrent.length > 0) {
        timeSlotsToSet = data.recurrent.map((slot: any) => slot.time_of_day);
      }
      // Fallback to direct time_of_day if available
      else if (data.time_of_day) {
        timeSlotsToSet = Array.isArray(data.time_of_day)
          ? data.time_of_day
          : [data.time_of_day];
      }

      // Only set time slots if we found any
      if (timeSlotsToSet.length > 0) {
        setTimeSlots(timeSlotsToSet);
      }
    }
  }, [data]);

  // Set initial values for custom dates
  useEffect(() => {
    if (data?.recurrent?.[0]?.customDate) {
      try {
        const parsedDates = JSON.parse(data.recurrent[0].customDate);
        setCustomDates(parsedDates);
        setValue("customDates", parsedDates);
      } catch (error) {
        console.error("Error parsing customDate:", error);
      }
    }
  }, [data, setValue]);

  // Add a new time slot
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, ""]);
  };

  // Remove a time slot
  const removeTimeSlot = (index: number) => {
    const newTimeSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(newTimeSlots);
    setValue("time_of_day", newTimeSlots);
  };

  // Update time slot
  const updateTimeSlot = (index: number, value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = value;
    setTimeSlots(newTimeSlots);
    setValue("time_of_day", newTimeSlots);
  };

  // Initialize selectedWeekDays from data if available
  useEffect(() => {
    if (mappedData.weekDays && Array.isArray(mappedData.weekDays)) {
      setSelectedWeekDays(mappedData.weekDays);
    }
  }, [mappedData.weekDays]);

  // Initialize staff type and staff ID when data is available
  useEffect(() => {
    if (data && data.staffType && data.staffId) {
      // Set the staff type first
      setValue("staffType", data.staffType);

      // We need to wait for the staff to be loaded before setting the staff ID
      if (staff.length > 0) {
        const staffExists = staff.some((s) => s.id === data.staffId);
        if (staffExists) {
          setValue("staffId", data.staffId);
        }
      }
    }
  }, [data, staff, setValue]);

  // Set staff fields for non-admin users
  useEffect(() => {
    if (user && user.publicMetadata.role !== "admin") {
      setValue("staffId", user.id);
      // Convert role to lowercase to match Prisma enum values
      setValue(
        "staffType",
        (user.publicMetadata.role as string).toLowerCase() as
          | "handler"
          | "breeder"
      );
    }
  }, [user, setValue]);

  // Update customDates in form data when they change
  useEffect(() => {
    setValue("customDates", customDates);
  }, [customDates, setValue]);

  const selectedStaffType = watch("staffType");
  const selectedTaskType = watch("taskType");
  const selectedRecurrencePattern = watch("reccurencePattern");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // Function to check if a day falls within the date range
  const isDayInRange = (day: string) => {
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayIndex = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].indexOf(day);

    // Create a date object for the first occurrence of this day in the range
    const firstDay = new Date(start);
    const daysUntilFirst = (dayIndex - start.getDay() + 7) % 7;
    firstDay.setDate(start.getDate() + daysUntilFirst);

    return firstDay <= end;
  };

  // Function to get disabled state for a day
  const isDayDisabled = (day: string) => {
    return !isDayInRange(day);
  };

  // Fetch staff data
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/staff");
        if (response.ok) {
          const data = await response.json();
          setStaff(data);

          // If we're in update mode and have staff data, set the staff ID
          if (type === "update" && mappedData.staffType && mappedData.staffId) {
            const staffExists = data.some(
              (s: Staff) => s.id === mappedData.staffId
            );
            if (staffExists) {
              setValue("staffId", mappedData.staffId);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    };
    fetchStaff();
  }, [type, mappedData.staffType, mappedData.staffId, setValue]);

  // Filter staff based on selected staff type
  useEffect(() => {
    if (selectedStaffType) {
      const filtered = staff.filter((s) => s.role === selectedStaffType);
      setFilteredStaff(filtered);

      // Only clear staffId if the selected staff type changes and we're not in update mode
      // or if the staff type doesn't match the current staff's type
      if (type !== "update" || !mappedData.staffId) {
        setValue("staffId", "");
      }
    } else {
      setFilteredStaff([]);
      setValue("staffId", "");
    }
  }, [selectedStaffType, staff, setValue, type, mappedData.staffId]);

  // Handle week day selection
  const handleWeekDayChange = (day: string) => {
    if (selectedWeekDays.includes(day)) {
      setSelectedWeekDays(selectedWeekDays.filter((d) => d !== day));
      setValue(
        "weekDays",
        selectedWeekDays.filter((d) => d !== day)
      );
    } else {
      const newWeekDays = [...selectedWeekDays, day];
      setSelectedWeekDays(newWeekDays);
      setValue("weekDays", newWeekDays);
    }
  };

  const handleCustomDateChange = (date: string, action: "add" | "remove") => {
    if (action === "add") {
      // Check if the date already exists in the array
      if (customDates.includes(date)) {
        setDuplicateDateError(`Date ${date} is already selected`);

        // Clear the error after 3 seconds
        setTimeout(() => {
          setDuplicateDateError(null);
        }, 3000);

        return;
      }

      const newDates = [...customDates, date];
      setDuplicateDateError(null);
      setCustomDates(newDates);
      setValue("customDates", newDates);
    } else {
      const newDates = customDates.filter((d) => d !== date);
      setCustomDates(newDates);
      setValue("customDates", newDates);
    }
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setNotification(null);

    try {
      // Add a delay to match event creation loading time
      await new Promise((resolve) => setTimeout(resolve, 800));

      // For non-admin users, ensure staffId and staffType are set
      if (user && user.publicMetadata.role !== "admin") {
        formData.staffId = user.id;
        // Convert role to lowercase to match Prisma enum values
        formData.staffType = (
          user.publicMetadata.role as string
        ).toLowerCase() as "handler" | "breeder";
      }

      // Create FormData object
      const formDataToSend = new FormData();

      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array values (like weekDays)
            value.forEach((item) => formDataToSend.append(key, item));
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      // Add custom dates for "Other" pattern
      if (formData.reccurencePattern === "CUSTOM" && customDates.length > 0) {
        // Send all custom dates as a comma-separated string
        formDataToSend.append("customDates", customDates.join(","));
        console.log("Sending custom dates:", customDates);
      }

      // Add ID if it exists (for updates)
      if (data?.id) {
        formDataToSend.append("id", data.id.toString());
      }

      const response = await fetch(
        type === "create" ? "/api/schedules" : `/api/schedules/${data.id}`,
        {
          method: type === "create" ? "POST" : "PUT",
          body: formDataToSend,
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        setNotification({
          message:
            type === "create"
              ? "Schedule successfully created!"
              : "Schedule successfully updated!",
          type: "success",
        });

        // Show success message for 1.5 seconds before closing the modal and refreshing
        setTimeout(() => {
          // Close the modal
          window.dispatchEvent(new CustomEvent("closeModal"));
          // Refresh the page to show the new data
          router.refresh();
        }, 1500);
      } else {
        setNotification({
          message: responseData.details
            ? `Error: ${responseData.details}`
            : responseData.error || "An error occurred",
          type: "error",
        });
        console.error("Form submission error:", responseData);

        // For errors, keep the notification visible for at least 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
    } catch (err) {
      setNotification({
        message: "An unexpected error occurred",
        type: "error",
      });
      console.error("Form submission error:", err);

      // For errors, keep the notification visible for at least 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
    setIsSubmitting(false);
  });

  return (
    <>
      <form className="flex flex-col gap-6 p-6" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Task Name
          </label>
          <input
            className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            {...register("taskName")}
            defaultValue={mappedData.taskName}
          />
          {errors.taskName?.message && (
            <p className="text-xs text-red-400 dark:text-red-400">
              {errors.taskName.message.toString()}
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
            defaultValue={mappedData.taskDesc}
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
            Task Status
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            {...register("status")}
            defaultValue={mappedData.status}
          >
            <option value="ASSIGNED">Assigned</option>
            <option value="FINISHED">Finished</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400 dark:text-red-400">
              {errors.status.message.toString()}
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
            defaultValue={mappedData.taskCategory}
          >
            <option value="">Select Task Category</option>
            <option value="FEEDING">Feeding</option>
            <option value="VACCINATION">Vaccination</option>
            <option value="DEWORMING">Deworming</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.taskCategory?.message && (
            <p className="text-xs text-red-400 dark:text-red-400">
              {errors.taskCategory.message.toString()}
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
            defaultValue={mappedData.taskType}
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

        {/* Conditional fields based on task type */}
        {selectedTaskType === "ONETIME" && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Task Date
              </label>
              <input
                type="date"
                className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("taskDate")}
                defaultValue={mappedData.taskDate}
              />
              {errors.taskDate?.message && (
                <p className="text-xs text-red-400 dark:text-red-400">
                  {errors.taskDate.message.toString()}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Time of Day
              </label>
              <div className="space-y-2">
                {timeSlots.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                    />
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Another Time
                </button>
              </div>
              {errors.time_of_day?.message && (
                <p className="text-xs text-red-400 dark:text-red-400">
                  {errors.time_of_day.message.toString()}
                </p>
              )}
            </div>
          </>
        )}

        {selectedTaskType === "RECURRING" && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Recurrence Pattern
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("reccurencePattern")}
                defaultValue={mappedData.reccurencePattern}
              >
                <option value="">Select Recurrence Pattern</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="CUSTOM">Custom</option>
              </select>
              {errors.reccurencePattern?.message && (
                <p className="text-xs text-red-400 dark:text-red-400">
                  {errors.reccurencePattern.message.toString()}
                </p>
              )}
            </div>

            {/* Show date range fields only for DAILY and WEEKLY patterns */}
            {selectedRecurrencePattern !== "CUSTOM" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    {...register("startDate")}
                    defaultValue={mappedData.startDate}
                  />
                  {errors.startDate?.message && (
                    <p className="text-xs text-red-400 dark:text-red-400">
                      {errors.startDate.message.toString()}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    {...register("endDate")}
                    defaultValue={mappedData.endDate}
                  />
                  {errors.endDate?.message && (
                    <p className="text-xs text-red-400 dark:text-red-400">
                      {errors.endDate.message.toString()}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Custom date selection for "Custom" pattern */}
            {selectedRecurrencePattern === "CUSTOM" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  Select Custom Dates
                </label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleCustomDateChange(e.target.value, "add");
                          e.target.value = ""; // Clear the input after adding
                        }
                      }}
                    />
                  </div>

                  {duplicateDateError && (
                    <p className="text-xs text-red-400 dark:text-red-400">
                      {duplicateDateError}
                    </p>
                  )}

                  {customDates.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                      <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Selected Dates:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {customDates.map((date, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md"
                          >
                            <span className="text-sm">{date}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCustomDateChange(date, "remove")
                              }
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="hidden"
                  {...register("customDates")}
                  value={JSON.stringify(customDates)}
                />
              </div>
            )}

            {/* Time picker for all recurrence patterns */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Time of Day
              </label>
              <div className="space-y-2">
                {timeSlots.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                    />
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Another Time
                </button>
              </div>
              {errors.time_of_day?.message && (
                <p className="text-xs text-red-400 dark:text-red-400">
                  {errors.time_of_day.message.toString()}
                </p>
              )}
            </div>

            {/* Weekly specific fields */}
            {selectedRecurrencePattern === "WEEKLY" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  Days of the Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <div key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        id={day}
                        checked={selectedWeekDays.includes(day)}
                        onChange={() => handleWeekDayChange(day)}
                        disabled={isDayDisabled(day)}
                        className={`mr-2 ${
                          isDayDisabled(day)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      />
                      <label
                        htmlFor={day}
                        className={`text-xs ${
                          isDayDisabled(day)
                            ? "text-gray-400 dark:text-gray-500"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
                <input
                  type="hidden"
                  {...register("weekDays")}
                  value={JSON.stringify(selectedWeekDays)}
                />
              </div>
            )}
          </>
        )}

        {/* Only show staff fields for admin users */}
        {user?.publicMetadata.role === "admin" && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Staff Type
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("staffType")}
                defaultValue={mappedData.staffType}
              >
                <option value="">Select Staff Type</option>
                <option value="handler">Handler</option>
                <option value="breeder">Breeder</option>
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
                defaultValue={mappedData.staffId}
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
          </>
        )}

        {/* Show staff fields for handler users with pre-filled values */}
        {user?.publicMetadata.role === "handler" && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Staff Type
              </label>
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value="handler"
                disabled
              />
              <input type="hidden" {...register("staffType")} value="handler" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Staff
              </label>
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={user?.id || ""}
                disabled
              />
              <input
                type="hidden"
                {...register("staffId")}
                value={user?.id || ""}
              />
            </div>
          </>
        )}

        {/* Hidden fields for non-admin and non-handler users */}
        {user?.publicMetadata.role !== "admin" &&
          user?.publicMetadata.role !== "handler" && (
            <>
              <input
                type="hidden"
                {...register("staffId")}
                value={user?.id || ""}
              />
              <input
                type="hidden"
                {...register("staffType")}
                value={(user?.publicMetadata.role as string) || ""}
              />
            </>
          )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("closeModal"));
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                {type === "create" ? "Creating..." : "Updating..."}
              </>
            ) : type === "create" ? (
              "Create Schedule"
            ) : (
              "Update Schedule"
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

export default ScheduleForm;
