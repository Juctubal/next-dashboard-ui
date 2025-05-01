import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recurrentId = searchParams.get("recurrentId");
    const date = searchParams.get("date");

    if (!recurrentId) {
      return NextResponse.json(
        { error: "Missing recurrentId parameter" },
        { status: 400 }
      );
    }

    // Build the where clause
    const where: any = {
      recurrentId: parseInt(recurrentId),
    };

    // If date is provided, add it to the where clause
    if (date) {
      const taskDate = new Date(date);
      taskDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(taskDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: taskDate,
        lt: nextDay,
      };
    }

    const completionRecords = await prisma.recurringTaskCompletion.findMany({
      where,
      include: {
        recurrentSchedule: {
          include: {
            schedule: true,
          },
        },
      },
    });

    return NextResponse.json(completionRecords);
  } catch (error) {
    console.error("Error fetching completion records:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch completion records",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    // Action to clean up completion records outside schedule date ranges
    if (action === "cleanup") {
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
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Find completion records outside the date range
        const invalidCompletions =
          await prisma.recurringTaskCompletion.findMany({
            where: {
              recurrentId: schedule.id,
              OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }],
            },
          });

        if (invalidCompletions.length > 0) {
          // Delete the invalid completions
          const deleted = await prisma.recurringTaskCompletion.deleteMany({
            where: {
              recurrentId: schedule.id,
              OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }],
            },
          });

          deletedCount += deleted.count;

          results.push({
            recurrentId: schedule.id,
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
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
    }

    return NextResponse.json(
      { error: "Invalid action specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error performing action on completion records:", error);
    return NextResponse.json(
      { error: "Failed to perform action on completion records" },
      { status: 500 }
    );
  }
}
