"use client";

import { useState } from "react";
import StaffTasks from "./StaffTasks";
import { CalendarEvent } from "@/types";

interface StaffTasksWrapperProps {
  initialEvents: CalendarEvent[];
}

export default function StaffTasksWrapper({
  initialEvents,
}: StaffTasksWrapperProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  const handleTaskStatusChange = (taskId: string, completed: boolean) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === taskId
          ? {
              ...event,
              status: completed ? "FINISHED" : "ASSIGNED",
              completed,
            }
          : event
      )
    );
  };

  return (
    <StaffTasks events={events} onTaskStatusChange={handleTaskStatusChange} />
  );
}
