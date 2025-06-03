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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, programName, description, activities } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Program ID is required for updates" },
        { status: 400 }
      );
    }
    
    // Convert id to number for Prisma
    const programId = parseInt(id, 10);

    // First, delete existing activities
    await prisma.conditioningActivity.deleteMany({
      where: {
        programId,
      },
    });

    // Update the conditioning program and create new activities
    const conditioningProgram = await prisma.conditioningProgram.update({
      where: {
        id: programId,
      },
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
    console.error("Error updating conditioning program:", error);
    return NextResponse.json(
      { error: "Failed to update conditioning program" },
      { status: 500 }
    );
  }
}
