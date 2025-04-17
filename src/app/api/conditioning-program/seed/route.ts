import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Check if there are already programs
    const existingPrograms = await prisma.conditioningProgram.count();

    if (existingPrograms > 0) {
      return NextResponse.json({
        message: "Database already has conditioning programs. Skipping seed.",
        existingPrograms,
      });
    }

    // Create a sample conditioning program
    const program = await prisma.conditioningProgram.create({
      data: {
        programName: "Sample Conditioning Program",
        description: "A sample program for testing",
        activities: {
          create: [
            {
              name: "Warm-up Exercise",
              description: "Light warm-up exercises for 15 minutes",
            },
            {
              name: "Cardio Training",
              description: "30 minutes of cardio exercises",
            },
            {
              name: "Strength Training",
              description: "Weight training focusing on legs and wings",
            },
            {
              name: "Cool-down Exercise",
              description: "Light stretching and cool-down for 10 minutes",
            },
          ],
        },
      },
      include: {
        activities: true,
      },
    });

    return NextResponse.json({
      message: "Successfully seeded conditioning program data",
      program,
    });
  } catch (error) {
    console.error("Error seeding conditioning program data:", error);
    return NextResponse.json(
      { error: "Failed to seed conditioning program data" },
      { status: 500 }
    );
  }
}
