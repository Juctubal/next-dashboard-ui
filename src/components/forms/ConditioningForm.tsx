"use client";

import { useState, useEffect } from "react";
import {
  Conditioning,
  Gamefowl,
  Event,
  ConditioningProgram,
  Handler,
  ConditioningActivity,
} from "@prisma/client";

// Define a type for activity with date
interface ActivityWithDate extends ConditioningActivity {
  activityDates: string[];
}

const ConditioningForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: Conditioning;
}) => {
  const [formData, setFormData] = useState({
    gamefowlId: data?.gamefowlId || "",
    eventId: data?.eventId || "",
    conProgId: data?.conProgId || "",
    handlerId: data?.handlerId || "",
    startDate: data?.startDate
      ? new Date(data.startDate).toISOString().split("T")[0]
      : "",
    endDate: data?.endDate
      ? new Date(data.endDate).toISOString().split("T")[0]
      : "",
    status: data?.status || "PENDING",
  });

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

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch("/api/conditioning/options");
        if (!response.ok) {
          throw new Error("Failed to fetch options");
        }
        const data = await response.json();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates before submission
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end < start) {
        setDateError("End date must be after start date");
        return;
      }
    }

    // Handle form submission
    console.log("Form submitted:", formData);
    console.log("Activities with dates:", programActivities);
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
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        {type === "create" ? "Create" : "Update"} Conditioning Record
      </h2>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="gamefowlId"
          className="font-medium text-gray-700 dark:text-gray-300"
        >
          Gamefowl
        </label>
        <select
          id="gamefowlId"
          value={formData.gamefowlId}
          onChange={(e) =>
            setFormData({ ...formData, gamefowlId: e.target.value })
          }
          className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
          required
        >
          <option value="">Select a gamefowl</option>
          {options.gamefowls.map((gamefowl) => (
            <option key={gamefowl.id} value={gamefowl.id}>
              {gamefowl.id} - {gamefowl.name}
            </option>
          ))}
        </select>
      </div>
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
          required
        >
          <option value="">Select an event</option>
          {options.events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventName}
            </option>
          ))}
        </select>
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
        {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
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
                        {activity.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </p>
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
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
          required
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-ggPurple text-white py-2 px-4 rounded-md border-none w-max self-end hover:bg-ggPurple/90 transition-colors"
        disabled={!datesSelected}
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ConditioningForm;
