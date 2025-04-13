import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get current date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Get gamefowl count (excluding archived)
    const gamefowlCount = await prisma.gamefowl.count({
      where: {
        isArchived: false,
      },
    });

    // Get handler count (excluding archived)
    const handlerCount = await prisma.handler.count({
      where: {
        isArchived: false,
      },
    });

    // Get breeder count (excluding archived)
    const breederCount = await prisma.breeder.count({
      where: {
        isArchived: false,
      },
    });

    // Get upcoming events for the current month
    const upcomingEvents = await prisma.event.count({
      where: {
        eventDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          not: "FINISHED",
        },
      },
    });

    return NextResponse.json({
      gamefowlCount,
      handlerCount,
      breederCount,
      upcomingEvents,
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch counts" },
      { status: 500 }
    );
  }
}
