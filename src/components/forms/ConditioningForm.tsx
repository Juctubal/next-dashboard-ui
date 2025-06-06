"use client";

import { useState, useEffect } from "react";
import {
  Conditioning,
  Gamefowl,
  Event,
  ConditioningProgram,
  Handler,
  ConditioningActivity,
  GamefowlSex,
  EventGamefowl,
  ConditioningStatus,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";

// Define a type for activity with date
interface ActivityWithDate extends ConditioningActivity {
  activityDates: string[];
}

interface GamefowlWithEvents extends Gamefowl {
  eventGamefowls?: EventGamefowl[];
}

interface ConditioningWithRelations extends Conditioning {
  gamefowls: {
    gamefowlId: number;
    gamefowl: Gamefowl;
  }[];
}

interface FormData {
  eventId: string;
  conProgId: string;
  handlerId: string;
  startDate: string;
  endDate: string;
  status: ConditioningStatus;
  isForEvent: boolean;
}

const ConditioningForm = ({
  type,
  data,
  onClose,
}: {
  type: "create" | "update";
  data?: ConditioningWithRelations;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState<FormData>({
    eventId: data?.eventId?.toString() || "",
    conProgId: data?.conProgId?.toString() || "",
    handlerId: data?.handlerId || "",
    startDate: data?.startDate
      ? new Date(data.startDate).toISOString().split("T")[0]
      : "",
    endDate: data?.endDate
      ? new Date(data.endDate).toISOString().split("T")[0]
      : "",
    status: data?.status || ConditioningStatus.ASSIGNED,
    isForEvent: !!data?.eventId,
  });

  const [selectedGamefowls, setSelectedGamefowls] = useState<number[]>([]);

  const [options, setOptions] = useState<{
    gamefowls: Gamefowl[];
    events: Event[];
    conditioningPrograms: ConditioningProgram[];
    handlers: Handler[];
  }>({
    gamefowls: [],
    events: [],
    conditioningPrograms: [],
    handlers: [],
  });

  const [programActivities, setProgramActivities] = useState<
    ActivityWithDate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [duplicateDateError, setDuplicateDateError] = useState<{
    [key: number]: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch("/api/conditioning/options");
        if (!response.ok) {
          throw new Error("Failed to fetch options");
        }
        const data = await response.json();
        console.log("Fetched gamefowls data:", data.gamefowls);
        setOptions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch options"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Fetch activities when a conditioning program is selected
  useEffect(() => {
    const fetchActivities = async () => {
      if (!formData.conProgId) {
        setProgramActivities([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/conditioning-program/${formData.conProgId}/activities`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const activities = await response.json();
        setProgramActivities(
          activities.map((activity: ConditioningActivity) => ({
            ...activity,
            activityDates: [],
          }))
        );
      } catch (err) {
        console.error("Error fetching activities:", err);
        setProgramActivities([]);
      }
    };

    fetchActivities();
  }, [formData.conProgId]);

  // Validate dates whenever they change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end < start) {
        setDateError("End date must be after start date");
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [formData.startDate, formData.endDate]);

  // Load existing gamefowls when editing
  useEffect(() => {
    if (data?.gamefowls) {
      setSelectedGamefowls(data.gamefowls.map((g) => g.gamefowlId));
    }
  }, [data]);

  // Fetch existing activity schedules when in update mode
  useEffect(() => {
    const fetchExistingSchedules = async () => {
      if (type === "update" && data?.id) {
        try {
          console.log("Fetching schedules for conditioning ID:", data.id);
          const response = await fetch(
            `/api/conditioning/${data.id}/schedules`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch existing schedules");
          }
          const schedules = await response.json();
          console.log("Received schedules:", schedules);

          // Group schedules by activity ID
          const schedulesByActivity = schedules.reduce(
            (
              acc: { [key: number]: string[] },
              schedule: { activityId: number; date: string }
            ) => {
              if (!acc[schedule.activityId]) {
                acc[schedule.activityId] = [];
              }
              acc[schedule.activityId].push(schedule.date.split("T")[0]);
              return acc;
            },
            {}
          );
          console.log("Grouped schedules by activity:", schedulesByActivity);

          // Update program activities with existing dates
          setProgramActivities((prevActivities) => {
            console.log("Previous activities:", prevActivities);
            const updatedActivities = prevActivities.map((activity) => {
              const dates = schedulesByActivity[activity.id] || [];
              console.log(`Activity ${activity.id} dates:`, dates);
              return {
                ...activity,
                activityDates: dates,
              };
            });
            console.log("Updated program activities:", updatedActivities);
            return updatedActivities;
          });
        } catch (error) {
          console.error("Error fetching existing schedules:", error);
          setError("Failed to load existing activity schedules");
        }
      }
    };

    fetchExistingSchedules();
  }, [type, data?.id, programActivities.length]);

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleGamefowlSelection = (gamefowlId: number) => {
    setSelectedGamefowls((prev) => {
      if (prev.includes(gamefowlId)) {
        return prev.filter((id) => id !== gamefowlId);
      } else {
        return [...prev, gamefowlId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form data
    if (
      !formData.conProgId ||
      !formData.handlerId ||
      !formData.startDate ||
      !formData.endDate
    ) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (formData.isForEvent && !formData.eventId) {
      setError("Please select an event");
      setIsSubmitting(false);
      return;
    }

    // Validate dates before submission
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end < start) {
        setDateError("End date must be after start date");
        setIsSubmitting(false);
        return;
      }
    } else {
      setDateError(null);
    }

    // Validate gamefowl selection
    if (selectedGamefowls.length === 0) {
      setError("Please select at least one gamefowl");
      setIsSubmitting(false);
      return;
    }

    // Validate that all activities have at least one date scheduled
    const activitiesWithoutDates = programActivities.filter(
      (activity) => activity.activityDates.length === 0
    );
    if (activitiesWithoutDates.length > 0) {
      setError("Please schedule at least one date for each activity");
      setIsSubmitting(false);
      return;
    }

    // Prepare activity schedules for submission
    const activitySchedules = programActivities.map((activity) => ({
      activityId: activity.id,
      dates: activity.activityDates,
    }));

    console.log("Submitting activity schedules:", activitySchedules);

    try {
      // Add a delay to match event creation loading time
      await new Promise((resolve) => setTimeout(resolve, 800));

      const requestBody = {
        id: type === "update" ? data?.id : undefined,
        gamefowlIds: selectedGamefowls,
        eventId: formData.isForEvent ? parseInt(formData.eventId) : null,
        conProgId: parseInt(formData.conProgId),
        handlerId: formData.handlerId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        activitySchedules: activitySchedules,
      };

      console.log("Submitting conditioning record with data:", requestBody);

      const response = await fetch("/api/conditioning", {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${type} conditioning record`);
      }

      // Show success message
      setNotification({
        message: `Conditioning record successfully ${
          type === "create" ? "created" : "updated"
        }`,
        type: "success",
      });

      // Wait a moment before refreshing and closing
      setTimeout(() => {
        // Dispatch refresh event to update data
        window.dispatchEvent(new CustomEvent("refreshData"));
        onClose(); // Close the form modal
      }, 1500);
    } catch (error) {
      console.error(`Error ${type}ing conditioning record:`, error);
      setNotification({
        message: `Failed to ${type} conditioning record. Please try again.`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivityDateChange = (
    activityId: number,
    date: string,
    action: "add" | "remove"
  ) => {
    setProgramActivities((prevActivities) =>
      prevActivities.map((activity) => {
        if (activity.id === activityId) {
          if (action === "add") {
            // Check if the date already exists in the array
            if (activity.activityDates.includes(date)) {
              // Set error message for this activity
              setDuplicateDateError((prev) => ({
                ...prev,
                [activityId]: `Date ${date} is already selected for this activity`,
              }));

              // Clear the error after 3 seconds
              setTimeout(() => {
                setDuplicateDateError((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[activityId];
                  return newErrors;
                });
              }, 3000);

              return activity; // Return unchanged if date already exists
            }

            // Clear any existing error for this activity
            setDuplicateDateError((prev) => {
              const newErrors = { ...prev };
              delete newErrors[activityId];
              return newErrors;
            });

            return {
              ...activity,
              activityDates: [...activity.activityDates, date],
            };
          } else {
            return {
              ...activity,
              activityDates: activity.activityDates.filter((d) => d !== date),
            };
          }
        }
        return activity;
      })
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ggPurple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400">Error: {error}</div>
    );
  }

  // Check if dates are selected
  const datesSelected = formData.startDate && formData.endDate && !dateError;

  // Get the selected program
  const selectedProgram = options.conditioningPrograms.find(
    (program) => program.id.toString() === formData.conProgId
  );

  console.log("Selected program:", selectedProgram);
  console.log("Program activities:", programActivities);

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          {type === "create" ? "Create" : "Update"} Conditioning Record
        </h2>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="isForEvent"
            checked={formData.isForEvent}
            onChange={(e) => {
              setFormData({
                ...formData,
                isForEvent: e.target.checked,
                eventId: "",
              });
              setSelectedGamefowls([]); // Clear selected gamefowls when toggling isForEvent
            }}
            className="rounded border-gray-300 dark:border-gray-600 text-ggPurple focus:ring-ggPurple"
          />
          <label
            htmlFor="isForEvent"
            className="text-gray-700 dark:text-gray-300"
          >
            This conditioning record is for an event
          </label>
        </div>

        {formData.isForEvent && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="eventId"
              className="font-medium text-gray-700 dark:text-gray-300"
            >
              Event
            </label>
            <select
              id="eventId"
              value={formData.eventId}
              onChange={(e) =>
                setFormData({ ...formData, eventId: e.target.value })
              }
              className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
              required={formData.isForEvent}
            >
              <option value="">Select an event</option>
              {options.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName}
                </option>
              ))}
            </select>
            {formData.eventId && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Selected Event:</span>{" "}
                  {
                    options.events.find(
                      (event) => event.id.toString() === formData.eventId
                    )?.eventName
                  }
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Event Date:</span>{" "}
                  {options.events.find(
                    (event) => event.id.toString() === formData.eventId
                  )?.eventDate &&
                    new Date(
                      options.events.find(
                        (event) => event.id.toString() === formData.eventId
                      )!.eventDate
                    ).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300">
            Gamefowls ({selectedGamefowls.length} selected)
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-700 max-h-60 overflow-y-auto">
            {formData.isForEvent ? (
              formData.eventId ? (
                options.gamefowls
                  .filter((gamefowl: GamefowlWithEvents) =>
                    gamefowl.eventGamefowls?.some(
                      (eg: EventGamefowl) =>
                        eg.eventId.toString() === formData.eventId
                    )
                  )
                  .map((gamefowl: GamefowlWithEvents) => {
                    console.log("Gamefowl data:", gamefowl);
                    return (
                      <div
                        key={gamefowl.id}
                        className={`p-3 mb-2 rounded-md cursor-pointer transition-colors ${
                          selectedGamefowls.includes(gamefowl.id)
                            ? "bg-ggPurple text-white"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => handleGamefowlSelection(gamefowl.id)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{gamefowl.name}</span>
                          <span className="text-sm opacity-80">
                            ID: {gamefowl.id}
                          </span>
                        </div>
                        <div className="text-sm mt-1 opacity-80">
                          Bloodline: {gamefowl.bloodline}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-amber-500 text-sm p-3">
                  Please select an event first
                </p>
              )
            ) : (
              options.gamefowls.map((gamefowl: GamefowlWithEvents) => {
                console.log("Gamefowl data:", gamefowl);
                return (
                  <div
                    key={gamefowl.id}
                    className={`p-3 mb-2 rounded-md cursor-pointer transition-colors ${
                      selectedGamefowls.includes(gamefowl.id)
                        ? "bg-ggPurple text-white"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => handleGamefowlSelection(gamefowl.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{gamefowl.name}</span>
                      <span className="text-sm opacity-80">
                        ID: {gamefowl.id}
                      </span>
                    </div>
                    <div className="text-sm mt-1 opacity-80">
                      Bloodline: {gamefowl.bloodline}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {formData.isForEvent && !formData.eventId && (
            <p className="text-amber-500 text-sm mt-2">
              Please select an event before choosing gamefowls
            </p>
          )}
        </div>

        {/* Date fields moved before conditioning program selection */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="startDate"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="endDate"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
            required
          />
          {dateError && (
            <p className="text-red-500 text-sm mt-1">{dateError}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="conProgId"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Conditioning Program
          </label>
          <select
            id="conProgId"
            value={formData.conProgId}
            onChange={(e) =>
              setFormData({ ...formData, conProgId: e.target.value })
            }
            className={`border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors ${
              !datesSelected ? "opacity-50 cursor-not-allowed" : ""
            }`}
            required
            disabled={!datesSelected}
          >
            <option value="">
              {datesSelected
                ? "Select a conditioning program"
                : "Select dates first"}
            </option>
            {options.conditioningPrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.programName}
              </option>
            ))}
          </select>
          {!datesSelected && (
            <p className="text-amber-500 text-sm mt-1">
              Please select both start and end dates before choosing a
              conditioning program
            </p>
          )}
        </div>

        {/* Display activities if a program is selected */}
        {formData.conProgId && programActivities.length > 0 && (
          <div className="flex flex-col gap-4 mt-2">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Program Activities
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Schedule activities within the selected date range:{" "}
                {formData.startDate} to {formData.endDate}
              </p>
              {programActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border-b border-gray-200 dark:border-gray-700 py-3 last:border-b-0"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 truncate">
                          Day/Age: {activity.ageDay}
                        </h4>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Supplements:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              let supplements: Array<{
                                name: string;
                                dosage: string;
                                type?: string;
                              }> = [];

                              if (activity.supplements) {
                                try {
                                  // Try to parse as JSON first (new format)
                                  supplements = JSON.parse(
                                    activity.supplements
                                  );
                                } catch {
                                  // If JSON parsing fails, treat as old comma-separated format
                                  const supplementNames =
                                    activity.supplements.split(", ");
                                  const dosages = (activity.dosage || "").split(
                                    ", "
                                  );

                                  supplements = supplementNames.map(
                                    (name: string, index: number) => ({
                                      name: name.trim(),
                                      dosage: (dosages[index] || "").trim(),
                                      type: activity.supplementType || "",
                                    })
                                  );
                                }
                              }

                              return supplements.map((supplement, index) => (
                                <div
                                  key={index}
                                  className="bg-ggPurple/10 dark:bg-ggPurple/20 border border-ggPurple/30 rounded-lg px-3 py-2"
                                >
                                  {supplement.type && (
                                    <div className="text-xs font-semibold text-ggPurple dark:text-ggPurple/80 uppercase tracking-wide">
                                      {supplement.type}
                                    </div>
                                  )}
                                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {supplement.name}
                                  </div>
                                  {supplement.dosage && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {supplement.dosage}
                                    </div>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                        {activity.indication && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Indication:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.indication}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 w-40 flex-shrink-0">
                        <input
                          type="date"
                          min={formData.startDate}
                          max={formData.endDate}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
                          onChange={(e) =>
                            handleActivityDateChange(
                              activity.id,
                              e.target.value,
                              "add"
                            )
                          }
                        />
                        {duplicateDateError[activity.id] && (
                          <p className="text-red-500 text-xs">
                            {duplicateDateError[activity.id]}
                          </p>
                        )}
                        {activity.activityDates.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {activity.activityDates.map((date, index) => (
                              <div
                                key={index}
                                className="flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-full"
                              >
                                <span className="text-sm flex-1">{date}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleActivityDateChange(
                                      activity.id,
                                      date,
                                      "remove"
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700 ml-1 flex-shrink-0"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="handlerId"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Handler
          </label>
          <select
            id="handlerId"
            value={formData.handlerId}
            onChange={(e) =>
              setFormData({ ...formData, handlerId: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
            required
          >
            <option value="">Select a handler</option>
            {options.handlers.map((handler) => (
              <option key={handler.id} value={handler.id}>
                {handler.first_name} {handler.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="status"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as ConditioningStatus,
              })
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
            required
          >
            <option value={ConditioningStatus.ASSIGNED}>Assigned</option>
            <option value={ConditioningStatus.COMPLETED}>Completed</option>
          </select>
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
              <span>{type === "create" ? "Creating..." : "Updating..."}</span>
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

export default ConditioningForm;
