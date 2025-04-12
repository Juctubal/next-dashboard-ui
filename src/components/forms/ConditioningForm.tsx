"use client";

import { useState, useEffect } from "react";
import {
  Conditioning,
  ConditioningProgram,
  ConditioningStatus,
  Event,
  Handler,
} from "@prisma/client";

const ConditioningForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: Conditioning & {
    conProg: ConditioningProgram;
    event: Event;
    handler: Handler;
  };
}) => {
  const [formData, setFormData] = useState({
    gamefowlId: data?.gamefowlId || 0,
    eventId: data?.eventId || 0,
    conProgId: data?.conProgId || 0,
    handlerId: data?.handlerId || "",
    startDate: data?.startDate
      ? new Date(data.startDate).toISOString().split("T")[0]
      : "",
    endDate: data?.endDate
      ? new Date(data.endDate).toISOString().split("T")[0]
      : "",
    status: data?.status || ConditioningStatus.PLANNED,
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [programs, setPrograms] = useState<ConditioningProgram[]>([]);
  const [handlers, setHandlers] = useState<Handler[]>([]);

  useEffect(() => {
    // Fetch events, programs, and handlers
    const fetchData = async () => {
      try {
        const [eventsRes, programsRes, handlersRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/conditioning-programs"),
          fetch("/api/handlers"),
        ]);

        const eventsData = await eventsRes.json();
        const programsData = await programsRes.json();
        const handlersData = await handlersRes.json();

        setEvents(eventsData);
        setPrograms(programsData);
        setHandlers(handlersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-4">
        {type === "create" ? "Create" : "Update"} Conditioning
      </h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="gamefowlId" className="font-medium">
          Gamefowl ID
        </label>
        <input
          type="number"
          id="gamefowlId"
          value={formData.gamefowlId}
          onChange={(e) =>
            setFormData({ ...formData, gamefowlId: parseInt(e.target.value) })
          }
          className="border border-gray-300 rounded-md p-2"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eventId" className="font-medium">
          Event
        </label>
        <select
          id="eventId"
          value={formData.eventId}
          onChange={(e) =>
            setFormData({ ...formData, eventId: parseInt(e.target.value) })
          }
          className="border border-gray-300 rounded-md p-2"
          required
        >
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="conProgId" className="font-medium">
          Conditioning Program
        </label>
        <select
          id="conProgId"
          value={formData.conProgId}
          onChange={(e) =>
            setFormData({ ...formData, conProgId: parseInt(e.target.value) })
          }
          className="border border-gray-300 rounded-md p-2"
          required
        >
          <option value="">Select a program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.programName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="handlerId" className="font-medium">
          Handler
        </label>
        <select
          id="handlerId"
          value={formData.handlerId}
          onChange={(e) =>
            setFormData({ ...formData, handlerId: e.target.value })
          }
          className="border border-gray-300 rounded-md p-2"
          required
        >
          <option value="">Select a handler</option>
          {handlers.map((handler) => (
            <option key={handler.id} value={handler.id}>
              {handler.first_name} {handler.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startDate" className="font-medium">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={formData.startDate}
          onChange={(e) =>
            setFormData({ ...formData, startDate: e.target.value })
          }
          className="border border-gray-300 rounded-md p-2"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="endDate" className="font-medium">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={formData.endDate}
          onChange={(e) =>
            setFormData({ ...formData, endDate: e.target.value })
          }
          className="border border-gray-300 rounded-md p-2"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="font-medium">
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
          className="border border-gray-300 rounded-md p-2"
          required
        >
          <option value={ConditioningStatus.PLANNED}>Planned</option>
          <option value={ConditioningStatus.ONGOING}>Ongoing</option>
          <option value={ConditioningStatus.COMPLETED}>Completed</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-ggPurple text-white py-2 px-4 rounded-md border-none w-max self-end"
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ConditioningForm;
