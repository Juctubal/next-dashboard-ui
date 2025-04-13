"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

type Event = {
  id: number;
  title: string;
  time: string;
  date: string;
  description: string;
};

const EventCalendar = () => {
  const [value, setValue] = useState<Value>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "year" | "decade" | "century">(
    "month"
  );

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        console.log("Fetching events from database...");
        // Fetch all events
        const response = await fetch("/api/events");

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        console.log("Events data received:", data);

        // Transform the data to match our Event type
        const formattedEvents = data.map((event: any) => ({
          id: event.id,
          title: event.eventName,
          time: new Date(event.eventDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: new Date(event.eventDate).toISOString().split("T")[0],
          description: event.description,
        }));

        console.log("Formatted events:", formattedEvents);
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events for the selected date
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    const selectedDateObj = new Date(selectedDate);

    console.log("Comparing dates:", {
      eventDate: eventDate.toISOString(),
      selectedDate: selectedDateObj.toISOString(),
      match:
        eventDate.getDate() === selectedDateObj.getDate() &&
        eventDate.getMonth() === selectedDateObj.getMonth() &&
        eventDate.getFullYear() === selectedDateObj.getFullYear(),
    });

    return (
      eventDate.getDate() === selectedDateObj.getDate() &&
      eventDate.getMonth() === selectedDateObj.getMonth() &&
      eventDate.getFullYear() === selectedDateObj.getFullYear()
    );
  });

  console.log("Selected date:", selectedDate);
  console.log("Filtered events for selected date:", filteredEvents);

  // Handle date selection
  const handleDateChange = (date: Value) => {
    if (date instanceof Date) {
      console.log("Date selected:", date);
      setSelectedDate(date);
      setValue(date);
    }
  };

  // Handle active start date change (when navigating months)
  const handleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      console.log("Active start date changed:", activeStartDate);
      setActiveStartDate(activeStartDate);
    }
  };

  // Handle view change
  const handleViewChange = ({
    view,
  }: {
    view: "month" | "year" | "decade" | "century";
  }) => {
    console.log("View changed:", view);
    setView(view);
  };

  // Custom tile class function that only applies highlighting in month view
  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    // Only apply the has-events class when in month view
    if (view !== "month") return "";

    // Check if the date has any events
    const hasEvents = events.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });

    if (hasEvents) {
      console.log("Date has events:", date.toISOString());
    }

    return hasEvents ? "has-events" : "";
  };

  // Force a re-render when the component mounts to ensure events are displayed
  useEffect(() => {
    if (events.length > 0) {
      // Find the first event date
      const firstEventDate = new Date(events[0].date);
      console.log("Setting initial date to first event date:", firstEventDate);
      setSelectedDate(firstEventDate);
      setValue(firstEventDate);
      setActiveStartDate(firstEventDate);
    }
  }, [events]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
      <Calendar
        onChange={handleDateChange}
        value={value}
        onViewChange={handleViewChange}
        onActiveStartDateChange={handleActiveStartDateChange}
        view={view}
        tileClassName={getTileClassName}
        activeStartDate={activeStartDate}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4 dark:text-gray-200">
          {view === "month"
            ? `Events for ${selectedDate.toLocaleDateString()}`
            : "Select a month to view events"}
        </h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {view === "month" && (
        <div className="flex flex-col gap-4">
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading events...
            </p>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                className="p-5 rounded-md border-2 border-gray-100 dark:border-gray-700 border-t-4 odd:border-t-ggSky even:border-t-ggPurple"
                key={event.id}
              >
                <div className="flex items-center justify-between">
                  <h1 className="font-semibold text-gray-600 dark:text-gray-200">
                    {event.title}
                  </h1>
                  <span className="text-gray-300 dark:text-gray-400 text-xs">
                    {event.time}
                  </span>
                </div>
                <p className="mt-2 text-gray-400 dark:text-gray-500 text-sm">
                  {event.description}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No events found for this date
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
