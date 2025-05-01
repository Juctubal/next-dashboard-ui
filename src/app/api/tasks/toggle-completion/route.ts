import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { completionId } = await request.json();

    if (!completionId) {
      return NextResponse.json(
        { error: "Completion ID is required" },
        { status: 400 }
      );
    }

    // Find the current completion record
    const currentCompletion = await prisma.recurringTaskCompletion.findUnique({
      where: { id: parseInt(completionId) },
    });

    if (!currentCompletion) {
      return NextResponse.json(
        { error: "Completion record not found" },
        { status: 404 }
      );
    }

    // Toggle the completed status
    const updatedCompletion = await prisma.recurringTaskCompletion.update({
      where: { id: parseInt(completionId) },
      data: {
        completed: !currentCompletion.completed,
      },
    });

    return NextResponse.json(updatedCompletion);
  } catch (error) {
    console.error("Error toggling completion status:", error);
    return NextResponse.json(
      { error: "Failed to toggle completion status" },
      { status: 500 }
    );
  }
}
