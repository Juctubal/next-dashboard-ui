import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { recurrentId, startDate, endDate } = await request.json();

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

    // Parse the dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Generate all dates between start and end
    const dates = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create completion records for each date
    const completionRecords = await Promise.all(
      dates.map(async (date) => {
        // Check if a completion record already exists
        const existingRecord = await prisma.recurringTaskCompletion.findFirst({
          where: {
            recurrentId: parseInt(recurrentId),
            date: date,
          },
        });

        if (!existingRecord) {
          return prisma.recurringTaskCompletion.create({
            data: {
              recurrentId: parseInt(recurrentId),
              date: date,
              completed: false,
            },
          });
        }
        return existingRecord;
      })
    );

    // Update the schedule status
    const updatedSchedule = await prisma.schedule.update({
      where: { id: recurrentSchedule.schedule.id },
      data: {
        status: EventStatus.ASSIGNED,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Created ${completionRecords.length} completion records`,
      task: {
        recurrentId: parseInt(recurrentId),
        schedule: updatedSchedule,
        completions: completionRecords,
      },
    });
  } catch (error) {
    console.error("Error creating daily task completions:", error);
    return NextResponse.json(
      { error: "Failed to create daily task completions" },
      { status: 500 }
    );
  }
}
