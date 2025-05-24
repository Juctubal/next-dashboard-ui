import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { completed, status } = await request.json();
    console.log("Received request:", { params, completed, status });

    // Parse the task ID to get the recurrent ID and date
    const parts = params.id.split("-");
    const type = parts[0];
    const recurrentId = parts[1];
    // Join the remaining parts to form the date string (YYYY-MM-DD)
    const dateStr = parts.slice(2).join("-");

    console.log("Parsed task ID:", { type, recurrentId, dateStr });

    if (type !== "recurrent") {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

    // Create a date object at noon UTC to avoid timezone issues
    const [year, month, day] = dateStr.split("-").map(Number);
    // Create a date string in ISO format with noon UTC
    const isoDateStr = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}T12:00:00.000Z`;
    const completionDate = new Date(isoDateStr);

    console.log("Processing individual task update:", {
      recurrentId,
      dateStr,
      isoDateStr,
      completionDate: completionDate.toISOString(),
      completed,
    });

    // Find the recurrent schedule
    const recurrentSchedule = await prisma.recurrentSchedules.findUnique({
      where: { id: parseInt(recurrentId) },
    });

    if (!recurrentSchedule) {
      console.log("Recurrent schedule not found");
      return NextResponse.json(
        { error: "Recurrent schedule not found" },
        { status: 404 }
      );
    }

    // Find or create the completion record
    let completionRecord = await prisma.recurringTaskCompletion.findFirst({
      where: {
        recurrentId: parseInt(recurrentId),
        date: completionDate,
      },
    });

    if (!completionRecord) {
      console.log("Creating new completion record");
      completionRecord = await prisma.recurringTaskCompletion.create({
        data: {
          recurrentId: parseInt(recurrentId),
          date: completionDate,
          completed: completed,
        },
      });
    } else {
      console.log("Updating existing completion record");
      completionRecord = await prisma.recurringTaskCompletion.update({
        where: { id: completionRecord.id },
        data: { completed: completed },
      });
    }

    // If this is an indefinitely repeating task and it's being marked as completed,
    // create the next day's completion record
    if (completed && recurrentSchedule.repeatIndefinitely) {
      const nextDate = new Date(completionDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Check if a completion record already exists for the next day
      const nextDayRecord = await prisma.recurringTaskCompletion.findFirst({
        where: {
          recurrentId: parseInt(recurrentId),
          date: nextDate,
        },
      });

      if (!nextDayRecord) {
        await prisma.recurringTaskCompletion.create({
          data: {
            recurrentId: parseInt(recurrentId),
            date: nextDate,
            completed: false,
          },
        });
      }
    }

    // Get all completion records for this recurrent schedule
    const allCompletions = await prisma.recurringTaskCompletion.findMany({
      where: {
        recurrentId: parseInt(recurrentId),
      },
    });

    // For indefinitely repeating tasks, only consider the current day's completion status
    let scheduleStatus;
    if (recurrentSchedule.repeatIndefinitely) {
      scheduleStatus = completed ? EventStatus.FINISHED : EventStatus.ASSIGNED;
    } else {
      // For non-indefinite tasks, check if all tasks are completed
      const allTasksCompleted =
        allCompletions.length > 0 &&
        allCompletions.every((record) => record.completed);
      scheduleStatus = allTasksCompleted
        ? EventStatus.FINISHED
        : EventStatus.ASSIGNED;
    }

    // Update the schedule status based on completion status
    const schedule = await prisma.schedule.update({
      where: { id: recurrentSchedule.schedId },
      data: {
        status: scheduleStatus,
      },
    });

    console.log("Schedule status update:", {
      isIndefinite: recurrentSchedule.repeatIndefinitely,
      currentDayCompleted: completed,
      totalTasks: allCompletions.length,
      completedTasks: allCompletions.filter((r) => r.completed).length,
      newStatus: schedule.status,
    });

    // Return the updated task data
    return NextResponse.json({
      task: {
        id: completionRecord.id,
        completed: completionRecord.completed,
        status: schedule.status,
      },
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
