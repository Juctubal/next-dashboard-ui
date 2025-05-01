import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { completed, status } = await request.json();

    // Extract the task ID parts
    // Format for individual tasks: recurrent-{recurrentId}-{date}
    // Format for grouped tasks: recurrent-{recurrentId}
    const [type, recurrentId, date] = params.id.split("-");

    if (type !== "recurrent") {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

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

    if (date) {
      // Handle individual task update
      const completionDate = new Date(date);
      completionDate.setHours(0, 0, 0, 0);

      // Find or create the completion record
      let task = await prisma.recurringTaskCompletion.findFirst({
        where: {
          recurrentId: parseInt(recurrentId),
          date: completionDate,
        },
        include: {
          recurrentSchedule: {
            include: {
              schedule: true,
            },
          },
        },
      });

      // If no completion record exists, create one
      if (!task) {
        task = await prisma.recurringTaskCompletion.create({
          data: {
            recurrentId: parseInt(recurrentId),
            date: completionDate,
            completed: false,
          },
          include: {
            recurrentSchedule: {
              include: {
                schedule: true,
              },
            },
          },
        });
      }

      // Update the completion record
      const updatedCompletion = await prisma.recurringTaskCompletion.update({
        where: { id: task.id },
        data: {
          completed,
        },
        include: {
          recurrentSchedule: {
            include: {
              schedule: true,
            },
          },
        },
      });

      // Update the schedule status based on completion status
      const updatedSchedule = await prisma.schedule.update({
        where: { id: recurrentSchedule.schedule.id },
        data: {
          status: completed ? EventStatus.FINISHED : EventStatus.ASSIGNED,
        },
      });

      // Return the updated task data
      return NextResponse.json({
        success: true,
        task: {
          ...updatedCompletion,
          recurrentSchedule: {
            ...updatedCompletion.recurrentSchedule,
            schedule: updatedSchedule,
          },
        },
      });
    } else {
      // Handle grouped task update
      // Update all completion records for this recurrentId
      const updatedCompletions =
        await prisma.recurringTaskCompletion.updateMany({
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
    }
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
