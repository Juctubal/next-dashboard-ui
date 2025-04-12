"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Define the type for calendar events
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type?: string;
}

// Define the props for the BigCalendar component
interface BigCalendarProps {
  events: CalendarEvent[];
}

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom event styling based on event type
const eventStyleGetter = (event: CalendarEvent) => {
  let style: React.CSSProperties = {
    borderRadius: "4px",
    opacity: 0.8,
    color: "#fff",
    border: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 4px",
  };

  switch (event.type) {
    case "conditioning":
      style.backgroundColor = "#3b82f6"; // blue
      break;
    case "sparring":
      style.backgroundColor = "#ef4444"; // red
      break;
    case "medical":
      style.backgroundColor = "#10b981"; // green
      break;
    default:
      style.backgroundColor = "#6b7280"; // gray
  }

  return { style };
};

const BigCalendar = ({ events }: BigCalendarProps) => {
  return (
    <div className="h-[700px] bg-white rounded-lg shadow-sm p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        views={["month", "week", "day"]}
        defaultView="week"
        tooltipAccessor={(event) => `${event.title} (${event.type})`}
        popup
        selectable
        className="rbc-calendar"
      />
    </div>
  );
};

export default BigCalendar;
