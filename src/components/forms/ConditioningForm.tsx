"use client";

import { useState, useEffect } from "react";
import {
  Conditioning,
  Gamefowl,
  Event,
  ConditioningProgram,
  Handler,
} from "@prisma/client";

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
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
          className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
          required
        >
          <option value="">Select a conditioning program</option>
          {options.conditioningPrograms.map((program) => (
            <option key={program.id} value={program.id}>
              {program.programName}
            </option>
          ))}
        </select>
      </div>
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
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ConditioningForm;
