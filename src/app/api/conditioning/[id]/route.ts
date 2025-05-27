import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { GamefowlStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid conditioning ID" },
        { status: 400 }
      );
    }

    // Fetch the conditioning program with related data
    const conditioning = await prisma.conditioning.findUnique({
      where: { id },
      include: {
        conProg: true,
        event: true,
        handler: true,
      },
    });

    if (!conditioning) {
      return NextResponse.json(
        { error: "Conditioning program not found" },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      id: conditioning.id,
      title: `Conditioning: ${
        conditioning.conProg?.programName || "Unknown Program"
      }`,
      programName: conditioning.conProg?.programName || "Unknown Program",
      startDate: conditioning.startDate,
      endDate: conditioning.endDate,
      handler: conditioning.handler
        ? `${conditioning.handler.first_name} ${conditioning.handler.last_name}`
        : "Unknown",
      event: conditioning.event?.eventName || "No event",
      notes: conditioning.notes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching conditioning program:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditioning program" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { status } = await request.json();

    // First get the conditioning record to check if it has an event
    const conditioning = await prisma.conditioning.findUnique({
      where: { id },
      include: {
        gamefowls: {
          include: {
            gamefowl: true,
          },
        },
        event: true,
      },
    });

    if (!conditioning) {
      return NextResponse.json(
        { error: "Conditioning record not found" },
        { status: 404 }
      );
    }

    // Update the conditioning status and gamefowl statuses in a transaction
    const updatedConditioning = await prisma.$transaction(async (tx) => {
      // Update the conditioning status
      const updatedConditioning = await tx.conditioning.update({
        where: { id },
        data: { status },
      });

      // Get all gamefowl IDs associated with this conditioning
      const gamefowlIds = conditioning.gamefowls.map(
        ({ gamefowl }) => gamefowl.id
      );

      if (status === "COMPLETED") {
        // For each gamefowl, check if it has any other active conditioning records
        for (const gamefowlId of gamefowlIds) {
          const otherActiveConditionings = await tx.conditioning.findMany({
            where: {
              gamefowls: {
                some: {
                  gamefowlId: gamefowlId,
                },
              },
              status: "ASSIGNED",
              id: {
                not: id, // Exclude current conditioning record
              },
            },
          });

          // Only update gamefowl status if there are no other active conditionings
          if (otherActiveConditionings.length === 0) {
            await tx.gamefowl.update({
              where: { id: gamefowlId },
              data: {
                status: GamefowlStatus.IDLE,
              },
            });
          }
        }
      } else if (status === "ASSIGNED") {
        // If the conditioning is assigned, update gamefowl status to CONDITIONING
        await Promise.all(
          conditioning.gamefowls.map(({ gamefowl }) =>
            tx.gamefowl.update({
              where: { id: gamefowl.id },
              data: {
                status: GamefowlStatus.CONDITIONING,
              },
            })
          )
        );
      }

      return updatedConditioning;
    });

    return NextResponse.json(updatedConditioning);
  } catch (error) {
    console.error("Error updating conditioning status:", error);
    return NextResponse.json(
      { error: "Failed to update conditioning status" },
      { status: 500 }
    );
  }
}
