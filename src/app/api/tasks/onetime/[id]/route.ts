import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { completed } = await request.json();

    // Extract the task ID parts
    // Format: oneTime-{scheduleId}-{oneTimeId}
    const [type, scheduleId, oneTimeId] = params.id.split("-");

    if (type !== "oneTime") {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

    // First, get the schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(scheduleId) },
      include: {
        oneTime: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 400 }
      );
    }

    // Update the schedule status based on completion status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: parseInt(scheduleId) },
      data: {
        status: completed ? EventStatus.FINISHED : EventStatus.ASSIGNED,
      },
      include: {
        oneTime: true,
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      task: {
        id: `oneTime-${scheduleId}-${oneTimeId}`,
        status: updatedSchedule.status,
        schedule: updatedSchedule,
      },
    });
  } catch (error) {
    console.error("Error updating one-time task status:", error);
    return NextResponse.json(
      { error: "Failed to update one-time task status" },
      { status: 500 }
    );
  }
}
