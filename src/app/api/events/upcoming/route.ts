import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function GET() {
  try {
    // Get current date
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Fetch events that are:
    // 1. Not finished (status !== FINISHED)
    // 2. Event date is today or in the future
    const events = await prisma.event.findMany({
      where: {
        AND: [
          {
            status: {
              not: EventStatus.FINISHED,
            },
          },
          {
            eventDate: {
              gte: now,
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            gamefowl: true,
          },
        },
      },
      orderBy: {
        eventDate: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming events" },
      { status: 500 }
    );
  }
}
