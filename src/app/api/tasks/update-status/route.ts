import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PUT(request: NextRequest) {
  try {
    const { taskId, status } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Check if this is a one-time task or a recurring task
    if (taskId.startsWith("oneTime-")) {
      // Handle one-time task
      const [_, scheduleId, oneTimeId] = taskId.split("-");

      // Update the schedule status
      const updatedSchedule = await prisma.schedule.update({
        where: { id: parseInt(scheduleId) },
        data: {
          status: status as EventStatus,
        },
      });

      return NextResponse.json({
        success: true,
        task: {
          id: taskId,
          status: updatedSchedule.status,
        },
      });
    } else {
      // Handle recurring task - taskId should be the completion ID
      const completion = await prisma.recurringTaskCompletion.findUnique({
        where: { id: parseInt(taskId) },
        include: {
          recurrentSchedule: {
            include: {
              schedule: true,
            },
          },
        },
      });

      if (!completion) {
        return NextResponse.json(
          { error: "Completion record not found" },
          { status: 404 }
        );
      }

      // Update the completion record
      const updatedCompletion = await prisma.recurringTaskCompletion.update({
        where: { id: completion.id },
        data: {
          completed: status === EventStatus.FINISHED,
        },
      });

      // Check if all completions for this schedule are done
      const allCompletions = await prisma.recurringTaskCompletion.findMany({
        where: {
          recurrentId: completion.recurrentId,
        },
      });

      const allCompleted = allCompletions.every((c) => c.completed);

      // Update the schedule status based on all completions
      const updatedSchedule = await prisma.schedule.update({
        where: { id: completion.recurrentSchedule.schedule.id },
        data: {
          status: allCompleted ? EventStatus.FINISHED : EventStatus.ASSIGNED,
        },
      });

      return NextResponse.json({
        success: true,
        task: {
          id: taskId,
          status: updatedSchedule.status,
          completed: updatedCompletion.completed,
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
