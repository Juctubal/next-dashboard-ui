"use client";

import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import UserCard from "@/components/UserCard";
import GamefowlAgeChart from "@/components/AttendanceChart";
import CountChart from "@/components/CountChart";
import HandlerCalendar from "@/components/HandlerCalendar";
import { useState, useEffect } from "react";

// Define the type for API events
interface ApiEvent {
  id: number;
  eventName: string;
  eventDate: string;
  description: string;
}

// Define the type for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type?: string;
}

const HandlerPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Fetch events from the API
        const response = await fetch("/api/events");

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();

        // Transform the data to match the format expected by the BigCalendar component
        const formattedEvents = data.map((event: ApiEvent) => ({
          id: event.id.toString(), // Convert number to string
          title: event.eventName,
          start: new Date(event.eventDate),
          end: new Date(
            new Date(event.eventDate).getTime() + 24 * 60 * 60 * 1000
          ), // Add 24 hours to end date
          type: "event",
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS  */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="gamefowl" />
          <UserCard type="events" />
        </div>

        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <CountChart />
          </div>
          {/* GAMEFOWL AGE CHART */}
          <div className="w-full lg:w-2/3 h-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <GamefowlAgeChart />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <HandlerCalendar
            events={events.map((event) => ({
              id: event.id,
              eventName: event.title,
              eventDate: event.start.toISOString(),
              description: event.title,
              type: "event" as const,
            }))}
          />
        </div>
      </div>
    </div>
  );
};

export default HandlerPage;
