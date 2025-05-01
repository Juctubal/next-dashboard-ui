import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PUT(request: NextRequest) {
  try {
    const { taskId, isGrouped } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    if (isGrouped) {
      // For grouped tasks, update the Schedule status and all related completions
      const schedule = await prisma.schedule.findFirst({
        where: {
          recurrent: {
            some: {
              id: parseInt(taskId),
            },
          },
        },
        include: {
          recurrent: true,
        },
      });

      if (!schedule) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        );
      }

      // Update the schedule status
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: EventStatus.FINISHED },
      });

      // Update all related completion records
      await prisma.recurringTaskCompletion.updateMany({
        where: {
          recurrentId: parseInt(taskId),
        },
        data: {
          completed: true,
        },
      });

      return NextResponse.json({ success: true });
    } else {
      // For individual tasks, update just the completion record
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
      await prisma.recurringTaskCompletion.update({
        where: { id: completion.id },
        data: { completed: true },
      });

      // Check if all completions for this schedule are done
      const allCompletions = await prisma.recurringTaskCompletion.findMany({
        where: {
          recurrentId: completion.recurrentId,
        },
      });

      const allCompleted = allCompletions.every((c) => c.completed);

      // If all completions are done, update the schedule status
      if (allCompleted) {
        await prisma.schedule.update({
          where: { id: completion.recurrentSchedule.schedule.id },
          data: { status: EventStatus.FINISHED },
        });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
