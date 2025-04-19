"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Define the type for API events
interface ApiEvent {
  id: number;
  eventName: string;
  eventDate: string;
  description: string;
  type?: string;
}

// Define the type for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  description: string;
  type?: string;
}

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

interface HandlerCalendarProps {
  events?: CalendarEvent[];
}

const HandlerCalendar = ({ events: propEvents = [] }: HandlerCalendarProps) => {
  const [value, setValue] = useState<Value>(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "year" | "decade" | "century">(
    "month"
  );
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Combine the event fetching and initial setup into a single useEffect
  useEffect(() => {
    const initializeEvents = async () => {
      try {
        setLoading(true);

        // If events are provided as props, use them directly
        if (propEvents.length > 0) {
          setEvents(propEvents);
          if (propEvents[0]) {
            const firstEventDate = new Date(propEvents[0].date);
            setSelectedDate(firstEventDate);
            setValue(firstEventDate);
            setActiveStartDate(firstEventDate);
          }
        } else {
          // Otherwise fetch events from the API
          const response = await fetch("/api/events");
          if (!response.ok) {
            throw new Error("Failed to fetch events");
          }
          const data = await response.json();

          // Transform the data to match the format expected by the calendar
          const formattedEvents = data.map((event: ApiEvent) => ({
            id: event.id.toString(),
            title: event.eventName,
            time: new Date(event.eventDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date(event.eventDate).toISOString().split("T")[0],
            description: event.description || "No description available",
            type: event.type || "event",
          }));

          setEvents(formattedEvents);

          // Set initial date to first event if available
          if (formattedEvents.length > 0) {
            const firstEventDate = new Date(formattedEvents[0].date);
            setSelectedDate(firstEventDate);
            setValue(firstEventDate);
            setActiveStartDate(firstEventDate);
          }
        }
      } catch (error) {
        console.error("Error initializing events:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeEvents();
  }, [propEvents]); // Only depend on propEvents

  // Memoize filtered events to prevent unnecessary recalculations
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const selectedDateObj = new Date(selectedDate);

      return (
        eventDate.getDate() === selectedDateObj.getDate() &&
        eventDate.getMonth() === selectedDateObj.getMonth() &&
        eventDate.getFullYear() === selectedDateObj.getFullYear()
      );
    });
  }, [events, selectedDate]);

  // Handle date selection
  const handleDateChange = (date: Value) => {
    if (date instanceof Date) {
      setSelectedDate(date);
      setValue(date);

      // Check if the selected date has any events
      const hasEvents = events.some((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });

      // If there are events, show the modal
      if (hasEvents) {
        setShowEventsModal(true);
      }
    }
  };

  // Handle active start date change (when navigating months)
  const handleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      setActiveStartDate(activeStartDate);
    }
  };

  // Handle view change
  const handleViewChange = ({
    view,
  }: {
    view: "month" | "year" | "decade" | "century";
  }) => {
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

    return hasEvents ? "has-events" : "";
  };

  // Custom tile content function to show event indicators
  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

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
      return (
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-ggSky"></div>
      );
    }

    return null;
  };

  // Get event color based on type
  const getEventColor = (type: string) => {
    switch (type) {
      case "conditioning":
        return "border-t-ggSky";
      case "sparring":
        return "border-t-ggYellow";
      case "medical":
        return "border-t-ggPurple";
      default:
        return "border-t-ggSky";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md handler-calendar">
      <Calendar
        onChange={handleDateChange}
        value={value}
        onViewChange={handleViewChange}
        onActiveStartDateChange={handleActiveStartDateChange}
        view={view}
        tileClassName={getTileClassName}
        tileContent={getTileContent}
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
                className={`p-5 rounded-md border-2 border-gray-100 dark:border-gray-700 border-t-4 ${getEventColor(
                  event.type || "event"
                )} cursor-pointer hover:shadow-md transition-shadow`}
                key={event.id}
                onClick={() => setShowEventsModal(true)}
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

      {/* Events Modal */}
      {showEventsModal && filteredEvents.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-gray-200">
                Events for {selectedDate.toLocaleDateString()}
              </h2>
              <button
                onClick={() => setShowEventsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-5 rounded-md border-2 border-gray-100 dark:border-gray-700 border-t-4 ${getEventColor(
                    event.type || "event"
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-600 dark:text-gray-200">
                      {event.title}
                    </h3>
                    <span className="text-gray-300 dark:text-gray-400 text-xs">
                      {event.time}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {event.description}
                    </p>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Type
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 capitalize">
                      {event.type || "Event"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandlerCalendar;
