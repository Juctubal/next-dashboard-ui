import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GamefowlStatus, EventStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    const body = await request.json();
    const { gamefowlIds } = body;

    if (!Array.isArray(gamefowlIds) || gamefowlIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid gamefowl IDs provided" },
        { status: 400 }
      );
    }

    // Verify event exists and is not completed
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        gamefowl: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === EventStatus.FINISHED) {
      return NextResponse.json(
        { error: "Cannot assign gamefowls to finished event" },
        { status: 400 }
      );
    }

    // Check if gamefowls are available
    const gamefowls = await prisma.gamefowl.findMany({
      where: {
        id: { in: gamefowlIds },
        isArchived: false,
      },
      include: {
        eventGamefowls: true,
      },
    });

    if (gamefowls.length !== gamefowlIds.length) {
      return NextResponse.json(
        { error: "Some gamefowls not found or are archived" },
        { status: 400 }
      );
    }

    // Check if any gamefowls are already assigned to other events
    const alreadyAssigned = gamefowls.filter((g) =>
      g.eventGamefowls.some((eg) => eg.eventId !== eventId)
    );

    if (alreadyAssigned.length > 0) {
      return NextResponse.json(
        {
          error: `Some gamefowls are already assigned to other events: ${alreadyAssigned
            .map((g) => g.name)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if gamefowls have appropriate status
    const invalidStatus = gamefowls.filter(
      (g) =>
        g.status !== GamefowlStatus.IDLE &&
        g.status !== GamefowlStatus.CONDITIONING
    );

    if (invalidStatus.length > 0) {
      return NextResponse.json(
        {
          error: `Some gamefowls have invalid status for event assignment: ${invalidStatus
            .map((g) => `${g.name} (${g.status})`)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Remove any existing gamefowls from this event first
    await prisma.eventGamefowl.deleteMany({
      where: { eventId: eventId },
    });

    // Create EventGamefowl entries to assign gamefowls to the event
    await prisma.eventGamefowl.createMany({
      data: gamefowlIds.map((gamefowlId) => ({
        eventId: eventId,
        gamefowlId: gamefowlId,
      })),
    });

    // Update gamefowl status to COMPETING
    await prisma.gamefowl.updateMany({
      where: {
        id: { in: gamefowlIds },
      },
      data: {
        status: GamefowlStatus.COMPETING,
      },
    });

    // Get updated event with gamefowls
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        gamefowl: {
          include: {
            gamefowl: {
              select: {
                id: true,
                name: true,
                bloodline: true,
                eloRating: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${gamefowlIds.length} gamefowls to event`,
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error assigning gamefowls to event:", error);
    return NextResponse.json(
      { error: "Failed to assign gamefowls to event" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve gamefowls assigned to an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        gamefowl: {
          include: {
            gamefowl: {
              include: {
                vaccine: {
                  orderBy: { vaccinationDate: "desc" },
                  take: 1,
                },
                deworming: {
                  orderBy: { dewormDate: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Extract gamefowls from the EventGamefowl relation
    const gamefowls = event.gamefowl.map((eg) => eg.gamefowl);

    return NextResponse.json({
      success: true,
      gamefowls: gamefowls,
      count: gamefowls.length,
    });
  } catch (error) {
    console.error("Error fetching event gamefowls:", error);
    return NextResponse.json(
      { error: "Failed to fetch event gamefowls" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove gamefowls from an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    const body = await request.json();
    const { gamefowlIds } = body;

    if (!Array.isArray(gamefowlIds) || gamefowlIds.length === 0) {
      // If no specific IDs provided, remove all gamefowls from event
      const eventGamefowls = await prisma.eventGamefowl.findMany({
        where: { eventId: eventId },
        select: { gamefowlId: true },
      });

      const affectedGamefowlIds = eventGamefowls.map((eg) => eg.gamefowlId);

      await prisma.eventGamefowl.deleteMany({
        where: { eventId: eventId },
      });

      // Update gamefowl status back to IDLE
      if (affectedGamefowlIds.length > 0) {
        await prisma.gamefowl.updateMany({
          where: { id: { in: affectedGamefowlIds } },
          data: { status: GamefowlStatus.IDLE },
        });
      }
    } else {
      // Remove specific gamefowls from event
      await prisma.eventGamefowl.deleteMany({
        where: {
          eventId: eventId,
          gamefowlId: { in: gamefowlIds },
        },
      });

      // Update gamefowl status back to IDLE
      await prisma.gamefowl.updateMany({
        where: { id: { in: gamefowlIds } },
        data: { status: GamefowlStatus.IDLE },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully removed gamefowls from event",
    });
  } catch (error) {
    console.error("Error removing gamefowls from event:", error);
    return NextResponse.json(
      { error: "Failed to remove gamefowls from event" },
      { status: 500 }
    );
  }
}
