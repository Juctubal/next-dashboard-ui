import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

interface EventData {
  id: number;
  eventName: string;
  eventDate: string;
  description: string;
}

// In-memory cache
let cache: {
  data: EventData[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

export async function GET() {
  try {
    // Check if we have cached data that's still valid
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_DURATION * 1000) {
      return NextResponse.json(cache.data, {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Fetch events from the database
    const events = await prisma.event.findMany({
      orderBy: {
        eventDate: "asc",
      },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        eventType: true,
        ageCategory: true,
        description: true,
      },
    });

    // Transform the events to match the format expected by the EventCalendar component
    const formattedEvents = events.map((event) => ({
      id: event.id,
      eventName: event.eventName,
      eventDate: event.eventDate.toISOString(),
      description: `${event.eventType} - ${event.ageCategory} - ${event.description}`,
    }));

    // Update cache
    cache = {
      data: formattedEvents,
      timestamp: now,
    };

    return NextResponse.json(formattedEvents, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error fetching events from database:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
