import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Count conditioning programs
    const programCount = await prisma.conditioningProgram.count();

    // Count activities
    const activityCount = await prisma.conditioningActivity.count();

    // Get a sample program with its activities
    const sampleProgram = await prisma.conditioningProgram.findFirst({
      include: {
        activities: true,
      },
    });

    return NextResponse.json({
      programCount,
      activityCount,
      sampleProgram,
    });
  } catch (error) {
    console.error("Error checking conditioning programs:", error);
    return NextResponse.json(
      { error: "Failed to check conditioning programs" },
      { status: 500 }
    );
  }
}
