import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programName, description, activities } = body;

    // Create the conditioning program with its activities
    const conditioningProgram = await prisma.conditioningProgram.create({
      data: {
        programName,
        description,
        activities: {
          create: activities.map(
            (activity: { name: string; description: string }) => ({
              name: activity.name,
              description: activity.description,
            })
          ),
        },
      },
      include: {
        activities: true,
      },
    });

    return NextResponse.json(conditioningProgram);
  } catch (error) {
    console.error("Error creating conditioning program:", error);
    return NextResponse.json(
      { error: "Failed to create conditioning program" },
      { status: 500 }
    );
  }
}
