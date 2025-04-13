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
  events: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type?: string;
  }[];
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
const eventStyleGetter = (event: any) => {
  let style: any = {
    backgroundColor: "#C3EBFA",
    borderRadius: "4px",
    opacity: 0.8,
    color: "#000",
    border: "0",
    display: "block",
  };

  if (event.type === "conditioning") {
    style.backgroundColor = "#C3EBFA";
  } else if (event.type === "sparring") {
    style.backgroundColor = "#FAE27C";
  } else if (event.type === "medical") {
    style.backgroundColor = "#F2F1FF";
  }

  return {
    style,
  };
};

const BigCalendar = ({ events }: BigCalendarProps) => {
  return (
    <div className="h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
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
        className="rbc-calendar dark:text-gray-200"
      />
    </div>
  );
};

export default BigCalendar;
