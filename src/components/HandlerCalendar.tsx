"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

interface CalendarItem {
  id: string | number;
  eventName: string;
  eventDate: string;
  description: string;
  type?: "event" | "schedule" | "breeding";
}

interface HandlerCalendarProps {
  events?: CalendarItem[];
}

const HandlerCalendar = ({
  events: initialEvents = [],
}: HandlerCalendarProps) => {
  const [value, setValue] = useState<Value>(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "year" | "decade" | "century">(
    "month"
  );
  const [calendarItems, setCalendarItems] =
    useState<CalendarItem[]>(initialEvents);
  const [initialized, setInitialized] = useState(false);
  const dataFetchedRef = useRef(false);

  // Fetch events, schedules, and breeding records from the API if not provided as props
  useEffect(() => {
    const fetchCalendarItems = async () => {
      // Skip fetching if we've already fetched the data
      if (dataFetchedRef.current) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch events
        const eventsResponse = await fetch("/api/events");
        let eventsData: CalendarItem[] = [];
        if (eventsResponse.ok) {
          eventsData = await eventsResponse.json();
          // Add type property to events
          eventsData = eventsData.map((event) => ({
            ...event,
            type: "event",
          }));
        }

        // Fetch schedules
        const schedulesResponse = await fetch("/api/schedules");
        let schedulesData: CalendarItem[] = [];
        if (schedulesResponse.ok) {
          schedulesData = await schedulesResponse.json();
        }

        // Combine events, schedules, and breeding records
        const allItems = [...eventsData, ...schedulesData];
        setCalendarItems(allItems);

        // Mark that we've fetched the data
        dataFetchedRef.current = true;
      } catch (error) {
        console.error("Error fetching calendar items:", error);
      } finally {
        setLoading(false);
      }
    };

    if (initialEvents.length === 0) {
      fetchCalendarItems();
    } else {
      setLoading(false);
    }
  }, [initialEvents]);

  // Filter items for the selected date
  const filteredItems = calendarItems.filter((item) => {
    const itemDate = new Date(item.eventDate);
    const selectedDateObj = new Date(selectedDate);

    return (
      itemDate.getDate() === selectedDateObj.getDate() &&
      itemDate.getMonth() === selectedDateObj.getMonth() &&
      itemDate.getFullYear() === selectedDateObj.getFullYear()
    );
  });

  // Handle date selection
  const handleDateChange = (date: Value) => {
    if (date instanceof Date) {
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

    // Check if the date has any items
    const hasItems = calendarItems.some((item) => {
      const itemDate = new Date(item.eventDate);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });

    return hasItems ? "has-events" : "";
  };

  // Initialize the calendar with the current date
  useEffect(() => {
    if (!initialized) {
      const currentDate = new Date();
      setSelectedDate(currentDate);
      setValue(currentDate);
      setActiveStartDate(currentDate);
      setInitialized(true);
    }
    setLoading(false);
  }, [initialized]);

  // Get border color class based on item type
  const getBorderColorClass = (type?: string) => {
    switch (type) {
      case "schedule":
        return "border-t-ggGreen";
      case "breeding":
        return "border-t-ggOrange";
      default:
        return "odd:border-t-ggSky even:border-t-ggPurple";
    }
  };

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
        minDetail="month"
        maxDetail="month"
        showNeighboringMonth={true}
        showFixedNumberOfWeeks={true}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4 dark:text-gray-200">
          {view === "month"
            ? `Calendar Items for ${selectedDate.toLocaleDateString()}`
            : "Select a month to view calendar items"}
        </h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {view === "month" && (
        <div className="flex flex-col gap-4">
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading calendar items...
            </p>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                className={`p-5 rounded-md border-2 border-gray-100 dark:border-gray-700 border-t-4 ${getBorderColorClass(
                  item.type
                )}`}
                key={item.id}
              >
                <div className="flex items-center justify-between">
                  <h1 className="font-semibold text-gray-600 dark:text-gray-200">
                    {item.eventName}
                    {item.type && (
                      <span
                        className={`ml-2 text-xs text-white px-2 py-1 rounded-full ${
                          item.type === "schedule"
                            ? "bg-ggGreen"
                            : item.type === "breeding"
                            ? "bg-ggOrange"
                            : "bg-ggSky"
                        }`}
                      >
                        {item.type === "schedule"
                          ? "Schedule"
                          : item.type === "breeding"
                          ? "Breeding"
                          : "Event"}
                      </span>
                    )}
                  </h1>
                  <span className="text-gray-300 dark:text-gray-400 text-xs">
                    {new Date(item.eventDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-2 text-gray-400 dark:text-gray-500 text-sm">
                  {item.description}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No calendar items found for this date
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HandlerCalendar;
