import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Mark this route as not requiring authentication
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if we're looking for a specific record or getting all archive statuses
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "event";

    // If ID is provided, get specific record details
    if (id) {
      console.log(`[DEBUG API] Checking ${type} with ID:`, id);

      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      let result;

      // Check different types of records
      if (type === "event") {
        result = await prisma.event.findUnique({
          where: { id: numericId },
          select: {
            id: true,
            eventName: true,
            isArchived: true,
          },
        });
      } else if (type === "conditioning") {
        result = await prisma.conditioning.findUnique({
          where: { id: numericId },
          select: {
            id: true,
            isArchived: true,
          },
        });
      } else if (type === "program") {
        result = await prisma.conditioningProgram.findUnique({
          where: { id: numericId },
          select: {
            id: true,
            programName: true,
            isArchived: true,
          },
        });
      }

      if (!result) {
        return NextResponse.json(
          { error: `${type} not found with ID ${id}` },
          { status: 404 }
        );
      }

      console.log(`[DEBUG API] Found ${type}:`, result);

      return NextResponse.json({
        message: `Current state of ${type} with ID ${id}`,
        data: result,
      });
    }
    // If no ID provided, get all archive statuses for all records
    else {
      console.log("[DEBUG API] Getting all archive statuses");

      // Get all events and their archive status
      const events = await prisma.event.findMany({
        select: {
          id: true,
          eventName: true,
          isArchived: true,
        },
      });

      // Get all conditioning programs and their archive status
      const programs = await prisma.conditioningProgram.findMany({
        select: {
          id: true,
          programName: true,
          isArchived: true,
        },
      });

      // Get all conditioning records and their archive status
      const conditioning = await prisma.conditioning.findMany({
        select: {
          id: true,
          isArchived: true,
        },
      });

      return NextResponse.json({
        message: "Archive status for all records",
        events,
        programs,
        conditioning,
      });
    }
  } catch (error) {
    console.error("[DEBUG API] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
