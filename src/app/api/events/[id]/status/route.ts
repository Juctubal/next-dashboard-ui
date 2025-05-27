import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EventStatus,
  ConditioningStatus,
  GamefowlStatus,
} from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const eventId = parseInt(params.id);

    // Validate status
    if (!Object.values(EventStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get the event with its conditioning records and gamefowls
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        conditioning: {
          include: {
            gamefowls: {
              include: {
                gamefowl: true,
              },
            },
          },
        },
        gamefowl: {
          include: {
            gamefowl: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // If trying to set status to FINISHED, validate conditioning records
    if (status === EventStatus.FINISHED) {
      // Check if there are any conditioning records
      if (!event.conditioning || event.conditioning.length === 0) {
        return NextResponse.json(
          {
            error:
              "Cannot mark event as finished because it has no conditioning records",
          },
          { status: 400 }
        );
      }

      // Check if any conditioning records are not completed
      const incompleteConditioning = event.conditioning.find(
        (cond) => cond.status !== ConditioningStatus.COMPLETED
      );

      if (incompleteConditioning) {
        return NextResponse.json(
          { error: "Please mark all conditioning records as completed first" },
          { status: 400 }
        );
      }
    }

    // Update the event status and gamefowl statuses in a transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Update the event status
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: { status },
      });

      // Update gamefowl statuses based on the new event status
      if (status === EventStatus.FINISHED) {
        // When event is finished, update all gamefowls to IDLE
        await tx.gamefowl.updateMany({
          where: {
            id: {
              in: event.gamefowl.map((eg) => eg.gamefowl.id),
            },
          },
          data: {
            status: GamefowlStatus.IDLE,
          },
        });
      } else if (status === EventStatus.ASSIGNED) {
        // When event is assigned, update all gamefowls to COMPETING
        await tx.gamefowl.updateMany({
          where: {
            id: {
              in: event.gamefowl.map((eg) => eg.gamefowl.id),
            },
          },
          data: {
            status: GamefowlStatus.COMPETING,
          },
        });
      }

      return updatedEvent;
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event status:", error);
    return NextResponse.json(
      { error: "Failed to update event status" },
      { status: 500 }
    );
  }
}
