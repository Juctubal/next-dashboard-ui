import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  EventStatus,
  ConditioningStatus,
  GamefowlStatus,
} from "@prisma/client";

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
    const { status, gamefowlIds } = body;

    // Get the event with its current gamefowls and conditioning records
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        gamefowl: {
          include: {
            gamefowl: true,
          },
        },
        conditioning: {
          include: {
            gamefowls: {
              include: {
                gamefowl: true,
              },
            },
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

    // If gamefowlIds are provided, update the gamefowls
    if (gamefowlIds) {
      // Check if any conditioning records are completed
      const hasCompletedConditioning = event.conditioning.some(
        (cond) => cond.status === ConditioningStatus.COMPLETED
      );

      if (hasCompletedConditioning) {
        return NextResponse.json(
          {
            error:
              "Cannot change gamefowls when conditioning records are completed",
          },
          { status: 400 }
        );
      }

      // Update event and its associated records in a transaction
      const updatedEvent = await prisma.$transaction(async (tx) => {
        // Get the IDs of previously selected gamefowls
        const previousGamefowlIds = event.gamefowl.map((g) => g.gamefowl.id);

        // Find gamefowls that are being removed
        const removedGamefowlIds = previousGamefowlIds.filter(
          (id) => !gamefowlIds.includes(id)
        );

        // Reset status of removed gamefowls to IDLE
        if (removedGamefowlIds.length > 0) {
          await Promise.all(
            removedGamefowlIds.map((gamefowlId) =>
              tx.gamefowl.update({
                where: { id: gamefowlId },
                data: {
                  status: GamefowlStatus.IDLE,
                },
              })
            )
          );
        }

        // Delete existing event-gamefowl associations
        await tx.eventGamefowl.deleteMany({
          where: {
            eventId: parseInt(id),
          },
        });

        // Create new event-gamefowl associations
        await Promise.all(
          gamefowlIds.map((gamefowlId: number) =>
            tx.eventGamefowl.create({
              data: {
                eventId: parseInt(id),
                gamefowlId,
              },
            })
          )
        );

        // Update gamefowl status to COMPETING
        await Promise.all(
          gamefowlIds.map((gamefowlId: number) =>
            tx.gamefowl.update({
              where: { id: gamefowlId },
              data: {
                status: GamefowlStatus.COMPETING,
              },
            })
          )
        );

        // Update conditioning records to match new gamefowls
        for (const conditioning of event.conditioning) {
          // Delete existing conditioning-gamefowl associations
          await tx.conditioningGamefowl.deleteMany({
            where: {
              conditioningId: conditioning.id,
            },
          });

          // Create new conditioning-gamefowl associations
          await Promise.all(
            gamefowlIds.map((gamefowlId: number) =>
              tx.conditioningGamefowl.create({
                data: {
                  conditioningId: conditioning.id,
                  gamefowlId,
                },
              })
            )
          );
        }

        // Update the event status
        return tx.event.update({
          where: { id: parseInt(id) },
          data: { status },
          include: {
            gamefowl: {
              include: {
                gamefowl: true,
              },
            },
            conditioning: {
              include: {
                gamefowls: {
                  include: {
                    gamefowl: true,
                  },
                },
              },
            },
          },
        });
      });

      return NextResponse.json(updatedEvent);
    } else {
      // If no gamefowlIds provided, just update the status
      const updatedEvent = await prisma.event.update({
        where: { id: parseInt(id) },
        data: { status },
        include: {
          gamefowl: {
            include: {
              gamefowl: true,
            },
          },
        },
      });

      return NextResponse.json(updatedEvent);
    }
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
