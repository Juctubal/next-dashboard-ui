import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [gamefowls, events, conditioningPrograms, handlers] =
      await Promise.all([
        prisma.gamefowl.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        }),
        prisma.event.findMany({
          select: {
            id: true,
            eventName: true,
          },
          orderBy: {
            eventName: "asc",
          },
        }),
        prisma.conditioningProgram.findMany({
          select: {
            id: true,
            programName: true,
          },
          orderBy: {
            programName: "asc",
          },
        }),
        prisma.handler.findMany({
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
          orderBy: {
            first_name: "asc",
          },
        }),
      ]);

    return NextResponse.json({
      gamefowls,
      events,
      conditioningPrograms,
      handlers,
    });
  } catch (error) {
    console.error("Error fetching conditioning options:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditioning options" },
      { status: 500 }
    );
  }
}
