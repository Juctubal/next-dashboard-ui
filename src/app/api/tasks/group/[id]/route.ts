import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { completed } = await request.json();
    const recurrentId = params.id;

    // First, get the recurrent schedule
    const recurrentSchedule = await prisma.recurrentSchedules.findUnique({
      where: { id: parseInt(recurrentId) },
      include: {
        schedule: true,
      },
    });

    if (!recurrentSchedule) {
      return NextResponse.json(
        { error: "Recurrent schedule not found" },
        { status: 400 }
      );
    }

    // Update all completion records for this recurrentId
    const updatedCompletions = await prisma.recurringTaskCompletion.updateMany({
      where: {
        recurrentId: parseInt(recurrentId),
      },
      data: {
        completed,
      },
    });

    // Update the schedule status based on completion status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: recurrentSchedule.schedule.id },
      data: {
        status: completed ? EventStatus.FINISHED : EventStatus.ASSIGNED,
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCompletions.count} completion records`,
      task: {
        recurrentId: parseInt(recurrentId),
        completed,
        schedule: updatedSchedule,
      },
    });
  } catch (error) {
    console.error("Error updating group task status:", error);
    return NextResponse.json(
      { error: "Failed to update group task status" },
      { status: 500 }
    );
  }
}
