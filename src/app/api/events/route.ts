import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch events from the database
    const events = await prisma.event.findMany({
      orderBy: {
        eventDate: "asc",
      },
    });

    console.log("Fetched events from database:", events);

    // Transform the events to match the format expected by the EventCalendar component
    const formattedEvents = events.map((event) => ({
      id: event.id,
      eventName: event.eventName,
      eventDate: event.eventDate.toISOString(),
      description: `${event.eventType} - ${event.ageCategory} - ${event.description}`,
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events from database:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
