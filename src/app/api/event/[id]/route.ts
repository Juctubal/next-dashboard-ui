import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { EventStatus, ConditioningStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
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

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { status } = body;

    // If trying to set status to FINISHED, validate conditioning records
    if (status === EventStatus.FINISHED) {
      // Get the event with its conditioning records
      const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
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
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
