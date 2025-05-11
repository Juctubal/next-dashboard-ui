import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { completed } = await request.json();
    const completionId = parseInt(params.id);

    if (isNaN(completionId)) {
      return NextResponse.json(
        { error: "Invalid completion ID" },
        { status: 400 }
      );
    }

    // Find the current completion record
    const currentCompletion = await prisma.recurringTaskCompletion.findUnique({
      where: { id: completionId },
      include: {
        recurrentSchedule: {
          include: {
            schedule: true,
          },
        },
      },
    });

    if (!currentCompletion) {
      return NextResponse.json(
        { error: "Completion record not found" },
        { status: 404 }
      );
    }

    // Update the completion record
    const updatedCompletion = await prisma.recurringTaskCompletion.update({
      where: { id: completionId },
      data: {
        completed: completed,
      },
      include: {
        recurrentSchedule: {
          include: {
            schedule: true,
          },
        },
      },
    });

    // Get all completion records for this recurrent schedule
    const allCompletions = await prisma.recurringTaskCompletion.findMany({
      where: {
        recurrentId: currentCompletion.recurrentId,
      },
    });

    // Check if all tasks are completed
    const allTasksCompleted =
      allCompletions.length > 0 &&
      allCompletions.every((record) => record.completed);

    // Update the schedule status based on completion status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: currentCompletion.recurrentSchedule.schedule.id },
      data: {
        status: allTasksCompleted ? "FINISHED" : "ASSIGNED",
      },
    });

    return NextResponse.json({
      completion: updatedCompletion,
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating completion status:", error);
    return NextResponse.json(
      { error: "Failed to update completion status" },
      { status: 500 }
    );
  }
}
