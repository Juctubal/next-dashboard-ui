import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Get all recurrent schedules with their date ranges
    const recurrentSchedules = await prisma.recurrentSchedules.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });

    // For each schedule, find and delete any completions outside the date range
    let deletedCount = 0;
    const results = [];

    for (const schedule of recurrentSchedules) {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);

      // Reset time components to compare dates only
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Use the normalized date approach for more consistent comparison
      const normalizedStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );

      const normalizedEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999
      );

      // Find completion records outside the date range
      const invalidCompletions = await prisma.recurringTaskCompletion.findMany({
        where: {
          recurrentId: schedule.id,
          OR: [
            {
              date: {
                lt: normalizedStartDate,
              },
            },
            {
              date: {
                gt: normalizedEndDate,
              },
            },
          ],
        },
      });

      if (invalidCompletions.length > 0) {
        // Delete the invalid completions
        const deleted = await prisma.recurringTaskCompletion.deleteMany({
          where: {
            recurrentId: schedule.id,
            OR: [
              {
                date: {
                  lt: normalizedStartDate,
                },
              },
              {
                date: {
                  gt: normalizedEndDate,
                },
              },
            ],
          },
        });

        deletedCount += deleted.count;

        results.push({
          recurrentId: schedule.id,
          dateRange: {
            start: normalizedStartDate.toISOString(),
            end: normalizedEndDate.toISOString(),
          },
          invalidCompletionsCount: invalidCompletions.length,
          deletedCount: deleted.count,
          invalidCompletions: invalidCompletions.map((c) => ({
            id: c.id,
            date: c.date.toISOString(),
          })),
        });
      }
    }

    return NextResponse.json({
      action: "cleanup",
      totalDeletedCount: deletedCount,
      results,
    });
  } catch (error) {
    console.error("Error cleaning up invalid completion records:", error);
    return NextResponse.json(
      { error: "Failed to clean up invalid completion records" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if cleanup is needed
export async function GET(request: Request) {
  try {
    // Get all recurrent schedules with their date ranges
    const recurrentSchedules = await prisma.recurrentSchedules.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });

    // For each schedule, find any completions outside the date range
    let totalInvalidCount = 0;
    const results = [];

    for (const schedule of recurrentSchedules) {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);

      // Reset time components to compare dates only
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Use the normalized date approach for more consistent comparison
      const normalizedStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );

      const normalizedEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999
      );

      // Find completion records outside the date range
      const invalidCompletions = await prisma.recurringTaskCompletion.findMany({
        where: {
          recurrentId: schedule.id,
          OR: [
            {
              date: {
                lt: normalizedStartDate,
              },
            },
            {
              date: {
                gt: normalizedEndDate,
              },
            },
          ],
        },
      });

      if (invalidCompletions.length > 0) {
        totalInvalidCount += invalidCompletions.length;

        results.push({
          recurrentId: schedule.id,
          dateRange: {
            start: normalizedStartDate.toISOString(),
            end: normalizedEndDate.toISOString(),
          },
          invalidCompletionsCount: invalidCompletions.length,
          invalidCompletions: invalidCompletions.map((c) => ({
            id: c.id,
            date: c.date.toISOString(),
          })),
        });
      }
    }

    return NextResponse.json({
      totalInvalidCount,
      results,
    });
  } catch (error) {
    console.error("Error checking for invalid completion records:", error);
    return NextResponse.json(
      { error: "Failed to check for invalid completion records" },
      { status: 500 }
    );
  }
}
