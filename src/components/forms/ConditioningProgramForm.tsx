"use client";

import { useState, useEffect } from "react";
import { ConditioningProgram, ConditioningActivity } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";

interface ActivityFormData {
  indication: string;
  ageDay: string;
  supplements: string;
  dosage: string;
}

const ConditioningProgramForm = ({
  type,
  data,
  onClose,
}: {
  type: "create" | "update";
  data?: ConditioningProgram;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    programName: data?.programName || "",
    description: data?.description || "",
    conditioningType: data?.conditioningType || "",
    durationDays: data?.durationDays || "",
  });

  const [activities, setActivities] = useState<ActivityFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(type === "update");

  // Fetch existing activities when in update mode
  useEffect(() => {
    const fetchActivities = async () => {
      if (type === "update" && data?.id) {
        try {
          const response = await fetch(
            `/api/conditioning-program/${data.id}/activities`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch activities");
          }
          const activitiesData = await response.json();
          setActivities(
            activitiesData.map((activity: any) => ({
              indication: activity.indication || "",
              ageDay: activity.ageDay || "",
              supplements: activity.supplements || "",
              dosage: activity.dosage || "",
            }))
          );
        } catch (error) {
          console.error("Error fetching activities:", error);
          setNotification({
            message: "Failed to load existing activities",
            type: "error",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [type, data?.id]);

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleAddActivity = () => {
    setActivities([
      ...activities,
      { indication: "", ageDay: "", supplements: "", dosage: "" },
    ]);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (
    index: number,
    field: keyof ActivityFormData,
    value: string
  ) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add a delay to match event creation loading time
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await fetch("/api/conditioning-program", {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data?.id,
          ...formData,
          // Convert empty string to undefined for optional fields
          conditioningType: formData.conditioningType || undefined,
          durationDays: formData.durationDays
            ? Number(formData.durationDays)
            : undefined,
          activities: activities.map((activity) => ({
            indication: activity.indication,
            ageDay: activity.ageDay,
            supplements: activity.supplements,
            dosage: activity.dosage,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${type} conditioning program`);
      }

      // Show success message first
      setNotification({
        message: `Conditioning program successfully ${
          type === "create" ? "created" : "updated"
        }`,
        type: "success",
      });

      // Wait a moment before closing the form
      setTimeout(() => {
        // Close the form
        handleClose();

        // Refresh the page
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error(`Error ${type}ing conditioning program:`, error);
      setNotification({
        message: `Failed to ${type} conditioning program. Please try again.`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          {type === "create" ? "Create" : "Update"} Conditioning Program
        </h2>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="programName"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Program Name
          </label>
          <input
            type="text"
            id="programName"
            value={formData.programName}
            onChange={(e) =>
              setFormData({ ...formData, programName: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
            required
          />
        </div>

        {/* Conditioning Type (optional) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="conditioningType"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Conditioning Type{" "}
            <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <select
            id="conditioningType"
            value={formData.conditioningType}
            onChange={(e) =>
              setFormData({ ...formData, conditioningType: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
          >
            <option value="">Select type</option>
            <option value="BROODING">Brooding</option>
            <option value="BREEDING">Breeding</option>
            <option value="PRIMING">Priming</option>
            <option value="PRE_CONDITIONING">Pre-conditioning</option>
            <option value="CONDITIONING">Conditioning</option>
          </select>
        </div>

        {/* Duration Days (optional) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="durationDays"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Duration (days){" "}
            <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <input
            type="number"
            id="durationDays"
            min="1"
            value={formData.durationDays}
            onChange={(e) =>
              setFormData({ ...formData, durationDays: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
            placeholder="How many days will this program last?"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="description"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
            rows={4}
            required
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Activities
            </h3>
            <button
              type="button"
              onClick={handleAddActivity}
              className="bg-ggPurple p-1.5 rounded-full hover:bg-ggPurple/90 transition-colors flex items-center justify-center"
              title="Add Activity"
            >
              <Image
                src="/create.png"
                alt="Add Activity"
                width={16}
                height={16}
                className="invert"
              />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ggPurple"></div>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-md p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Activity {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(index)}
                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                    title="Remove Activity"
                  >
                    <Image
                      src="/close.png"
                      alt="Remove"
                      width={16}
                      height={16}
                    />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Age/Day*
                    </label>
                    <input
                      type="text"
                      value={activity.ageDay}
                      onChange={(e) =>
                        handleActivityChange(index, "ageDay", e.target.value)
                      }
                      className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Supplements*
                    </label>
                    <input
                      type="text"
                      value={activity.supplements}
                      onChange={(e) =>
                        handleActivityChange(
                          index,
                          "supplements",
                          e.target.value
                        )
                      }
                      className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={activity.dosage}
                      onChange={(e) =>
                        handleActivityChange(index, "dosage", e.target.value)
                      }
                      className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Indication
                    </label>
                    <textarea
                      value={activity.indication}
                      onChange={(e) =>
                        handleActivityChange(
                          index,
                          "indication",
                          e.target.value
                        )
                      }
                      className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-4 rounded-md border-none w-max self-end transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <span>Creating...</span>
            </>
          ) : type === "create" ? (
            "Create"
          ) : (
            "Update"
          )}
        </button>
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

export default ConditioningProgramForm;
