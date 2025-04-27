import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

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
