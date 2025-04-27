import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PUT(request: NextRequest) {
  try {
    console.log("Received request to update task status");
    const body = await request.json();
    console.log("Request body:", body);

    const { taskId, status, date } = body;

    if (!taskId || !status || !date) {
      console.error("Missing required fields:", { taskId, status, date });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Map the status to the EventStatus enum
    const eventStatus =
      status === "FINISHED" ? EventStatus.FINISHED : EventStatus.ASSIGNED;

    console.log("Mapped status:", { original: status, mapped: eventStatus });

    // Parse the taskId - it could be in formats like:
    // "recurrent-123" (for grouped tasks)
    // "recurrent-123-2023-05-01" (for individual recurring tasks with date)
    // "oneTime-456" (for one-time tasks)
    const parts = taskId.split("-");
    console.log("Parsed taskId parts:", parts);

    if (parts.length < 2) {
      console.error("Invalid task ID format:", taskId);
      return NextResponse.json(
        { error: "Invalid task ID format" },
        { status: 400 }
      );
    }

    const prefix = parts[0];
    const id = parts[1];

    // Check if this is a special "all" format for recurring tasks
    const isAllFormat = parts.length === 3 && parts[2] === "all";
    console.log("Is 'all' format:", isAllFormat);

    if (prefix === "recurrent") {
      // This is a recurring task
      console.log("Processing recurring task:", id);

      try {
        // First, verify the recurring task exists
        const recurringTask = await prisma.recurrentSchedules.findUnique({
          where: { id: parseInt(id) },
          include: { schedule: true },
        });

        if (!recurringTask) {
          console.error("Recurring task not found:", id);
          return NextResponse.json(
            { error: "Recurring task not found" },
            { status: 404 }
          );
        }

        console.log("Found recurring task:", recurringTask);

        // For recurring tasks, we need to update the specific instance
        // Create or update a completion record for this specific date
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);

        console.log("Looking for completion record for date:", taskDate);

        // If this is the "all" format, we need to update all occurrences
        if (isAllFormat) {
          console.log("Updating all occurrences of this recurring task");

          // Find all completion records for this recurring task
          const allCompletions = await prisma.recurringTaskCompletion.findMany({
            where: {
              recurrentId: parseInt(id),
            },
          });

          // Update all completion records
          for (const completion of allCompletions) {
            await prisma.recurringTaskCompletion.update({
              where: { id: completion.id },
              data: { completed: eventStatus === EventStatus.FINISHED },
            });
          }

          console.log(`Updated ${allCompletions.length} completion records`);

          // Also update the parent schedule status
          await prisma.schedule.update({
            where: { id: recurringTask.schedId },
            data: { status: eventStatus },
          });

          console.log("Updated parent schedule status");
        } else {
          // Check if a completion record already exists for this specific date
          const existingCompletion =
            await prisma.recurringTaskCompletion.findFirst({
              where: {
                recurrentId: parseInt(id),
                date: taskDate,
              },
            });

          if (existingCompletion) {
            // Update existing completion record
            console.log(
              "Updating existing completion record:",
              existingCompletion.id
            );
            try {
              await prisma.recurringTaskCompletion.update({
                where: { id: existingCompletion.id },
                data: { completed: eventStatus === EventStatus.FINISHED },
              });
              console.log("Successfully updated completion record");
            } catch (updateError) {
              console.error("Error updating completion record:", updateError);
              throw updateError;
            }
          } else {
            // Create new completion record
            console.log("Creating new completion record");
            try {
              await prisma.recurringTaskCompletion.create({
                data: {
                  recurrentId: parseInt(id),
                  date: taskDate,
                  completed: eventStatus === EventStatus.FINISHED,
                },
              });
              console.log("Successfully created completion record");
            } catch (createError) {
              console.error("Error creating completion record:", createError);
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error("Error processing recurring task:", error);
        return NextResponse.json(
          {
            error: "Error processing recurring task",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    } else if (prefix === "oneTime") {
      // This is a one-time task
      console.log("Processing one-time task:", id);

      try {
        // Find the one-time schedule
        const oneTimeSchedule = await prisma.oneTimeSched.findUnique({
          where: { id: parseInt(id) },
          include: { schedule: true },
        });

        if (!oneTimeSchedule) {
          console.error("One-time task not found:", id);
          return NextResponse.json(
            { error: "One-time task not found" },
            { status: 404 }
          );
        }

        console.log("Found one-time schedule:", oneTimeSchedule);

        // Update the parent schedule status
        try {
          await prisma.schedule.update({
            where: { id: oneTimeSchedule.schedId },
            data: { status: eventStatus },
          });
          console.log("Successfully updated schedule status");
        } catch (updateError) {
          console.error("Error updating schedule:", updateError);
          throw updateError;
        }
      } catch (error) {
        console.error("Error updating one-time task:", error);
        return NextResponse.json(
          {
            error: "Error updating one-time task",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    } else {
      console.error("Unknown task prefix:", prefix);
      return NextResponse.json({ error: "Unknown task type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      {
        error: "Failed to update task status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
