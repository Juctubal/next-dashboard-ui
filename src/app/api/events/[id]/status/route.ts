import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus, ConditioningStatus } from "@prisma/client";

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

    // If trying to set status to FINISHED, validate conditioning records
    if (status === EventStatus.FINISHED) {
      // Get the event with its conditioning records
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          conditioning: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

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

    // If validation passes, update the event status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status },
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
