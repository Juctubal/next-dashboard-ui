"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import {
  EventType,
  AgeCategory,
  EventStatus,
  Gamefowl,
  ConditioningStatus,
} from "@prisma/client";
import { createEvent, updateEvent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Notification from "../ui/Notification";

const schema = z.object({
  eventName: z.string().min(1, { message: "Event name is required!" }),
  eventType: z.nativeEnum(EventType, { message: "Event type is required!" }),
  ageCategory: z.nativeEnum(AgeCategory, {
    message: "Age category is required!",
  }),
  eventDate: z.string().min(1, { message: "Event date is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  status: z.nativeEnum(EventStatus, { message: "Status is required!" }),
  gamefowlIds: z.array(z.number()).optional(),
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
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [selectedGamefowls, setSelectedGamefowls] = useState<number[]>([]);
  const [loadingGamefowls, setLoadingGamefowls] = useState(false);
  const [eventType, setEventType] = useState<EventType | "">(
    data?.eventType || ""
  );
  const [ageCategory, setAgeCategory] = useState<AgeCategory | "">(
    data?.ageCategory || ""
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: data
      ? {
          ...data,
          eventDate: data.eventDate
            ? new Date(data.eventDate).toISOString().substring(0, 10)
            : "",
        }
      : {},
  });

  // Watch for changes in eventType and ageCategory
  const watchEventType = watch("eventType");
  const watchAgeCategory = watch("ageCategory");

  // Fetch gamefowls when eventType or ageCategory changes
  useEffect(() => {
    if (watchEventType && watchAgeCategory) {
      fetchGamefowls(watchAgeCategory);
    }
  }, [watchEventType, watchAgeCategory]);

  // Load existing participants when editing
  useEffect(() => {
    if (type === "update" && data?.gamefowls) {
      const gamefowlIds = data.gamefowls.map((g: any) => g.gamefowl.id);
      setSelectedGamefowls(gamefowlIds);
      setValue("gamefowlIds", gamefowlIds);
    } else if (type === "update" && data?.gamefowl) {
      const gamefowlIds = data.gamefowl.map((g: any) => g.gamefowl.id);
      setSelectedGamefowls(gamefowlIds);
      setValue("gamefowlIds", gamefowlIds);
    }
  }, [data, setValue, type]);

  const fetchGamefowls = async (ageCategory: string) => {
    setLoadingGamefowls(true);
    try {
      const response = await fetch(`/api/gamefowls?ageCategory=${ageCategory}`);
      if (!response.ok) {
        throw new Error("Failed to fetch gamefowls");
      }
      const data = await response.json();
      setGamefowls(data);
    } catch (error) {
      console.error("Error fetching gamefowls:", error);
      setError("Failed to load gamefowls");
    } finally {
      setLoadingGamefowls(false);
    }
  };

  const handleGamefowlSelection = (gamefowlId: number) => {
    let newSelectedGamefowls: number[];
    const requiredCount = getRequiredGamefowlCount();

    if (selectedGamefowls.includes(gamefowlId)) {
      // Remove if already selected
      newSelectedGamefowls = selectedGamefowls.filter(
        (id) => id !== gamefowlId
      );
    } else {
      // Check if adding would exceed the required count
      if (selectedGamefowls.length >= requiredCount) {
        setError(
          `You can only select ${requiredCount} gamefowl(s) for this event type`
        );
        return;
      }
      // Add if not already selected
      newSelectedGamefowls = [...selectedGamefowls, gamefowlId];
    }

    setSelectedGamefowls(newSelectedGamefowls);
    setValue("gamefowlIds", newSelectedGamefowls);
    // Clear any previous error when selection is valid
    setError(null);
  };

  const getRequiredGamefowlCount = () => {
    switch (watchEventType) {
      case "TWO_COCK_DERBY":
        return 2;
      case "THREE_COCK_DERBY":
        return 3;
      case "FOUR_COCK_DERBY":
        return 4;
      case "FIVE_COCK_DERBY":
        return 5;
      case "SOLO":
        return 1;
      default:
        return 0;
    }
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setNotification(null);

    // Validate gamefowl selection
    const requiredCount = getRequiredGamefowlCount();
    if (formData.gamefowlIds?.length !== requiredCount) {
      setError(
        `Please select exactly ${requiredCount} gamefowl(s) for this event type`
      );
      setIsSubmitting(false);
      return;
    }

    // If trying to set status to FINISHED, validate conditioning records
    if (formData.status === EventStatus.FINISHED) {
      try {
        const response = await fetch(`/api/event/${data.id}/conditioning`);
        if (!response.ok) {
          throw new Error("Failed to fetch conditioning records");
        }
        const conditioningData = await response.json();

        // Check if there are any conditioning records
        if (!conditioningData || conditioningData.length === 0) {
          setError(
            "Cannot mark event as finished because it has no conditioning records"
          );
          setIsSubmitting(false);
          return;
        }

        // Check if any conditioning records are not completed
        const incompleteConditioning = conditioningData.find(
          (cond: any) => cond.status !== ConditioningStatus.COMPLETED
        );

        if (incompleteConditioning) {
          setError("Please mark all conditioning records as completed first");
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Error checking conditioning records:", error);
        setError("Failed to validate conditioning records");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "gamefowlIds" && Array.isArray(value)) {
          formDataObj.append(key, JSON.stringify(value));
        } else {
          formDataObj.append(key, String(value));
        }
      });

      // Simulate a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result =
        type === "create"
          ? await createEvent(formDataObj)
          : await updateEvent(data.id, formDataObj);

      if (result.success) {
        setNotification({
          message: `Event successfully ${
            type === "create" ? "created" : "updated"
          }!`,
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
          message: result.error || "An error occurred",
          type: "error",
        });
      }
    } catch (err) {
      setNotification({
        message: "An unexpected error occurred",
        type: "error",
      });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
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
              onChange={(e) => {
                setEventType(e.target.value as EventType);
                register("eventType").onChange(e);
              }}
            >
              <option value="">Select Event Type</option>
              {[
                EventType.FIVE_COCK_DERBY,
                EventType.FOUR_COCK_DERBY,
                EventType.THREE_COCK_DERBY,
                EventType.TWO_COCK_DERBY,
                EventType.SOLO,
                EventType.OTHER,
              ].map((type) => (
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
              onChange={(e) => {
                setAgeCategory(e.target.value as AgeCategory);
                register("ageCategory").onChange(e);
              }}
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

          {/* Gamefowl Selection Section */}
          {watchEventType && watchAgeCategory && (
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Select Gamefowls ({selectedGamefowls.length}/
                {getRequiredGamefowlCount()} selected)
              </label>

              {loadingGamefowls ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading gamefowls...
                </div>
              ) : gamefowls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                  {gamefowls.map((gamefowl) => (
                    <div
                      key={gamefowl.id}
                      className={`p-2 rounded-md cursor-pointer ${
                        selectedGamefowls.includes(gamefowl.id)
                          ? "bg-ggPurple text-white"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => handleGamefowlSelection(gamefowl.id)}
                    >
                      <div className="flex justify-between">
                        <span>{gamefowl.name}</span>
                        <span>ID: {gamefowl.id}</span>
                      </div>
                      <div className="text-xs opacity-80">
                        Bloodline: {gamefowl.bloodline}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No gamefowls found for the selected age category
                </div>
              )}
            </div>
          )}

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

        <div className="flex justify-end gap-4">
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md disabled:opacity-50 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
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
              "Create Event"
            ) : (
              "Update Event"
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

export default EventForm;
