import { NextResponse } from "next/server";
import { Result } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);

    const results = await prisma.eventResult.findMany({
      where: { eventId },
      select: {
        gamefowlId: true,
        result: true,
        notes: true,
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching event results:", error);
    return NextResponse.json(
      { error: "Failed to fetch event results" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { results } = await request.json();
    const eventId = parseInt(params.id);

    // Create or update event results
    const createdResults = await prisma.$transaction(
      results.map(
        (result: { gamefowlId: number; result: string; notes?: string }) =>
          prisma.eventResult.upsert({
            where: {
              eventId_gamefowlId: {
                eventId,
                gamefowlId: result.gamefowlId,
              },
            },
            create: {
              eventId,
              gamefowlId: result.gamefowlId,
              result: result.result as Result,
              notes: result.notes,
            },
            update: {
              result: result.result as Result,
              notes: result.notes,
            },
          })
      )
    );

    return NextResponse.json(createdResults);
  } catch (error) {
    console.error("Error creating/updating event results:", error);
    return NextResponse.json(
      { error: "Failed to create/update event results" },
      { status: 500 }
    );
  }
}
