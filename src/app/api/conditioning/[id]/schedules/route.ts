import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conditioningId = parseInt(params.id);
    if (isNaN(conditioningId)) {
      return NextResponse.json(
        { error: "Invalid conditioning ID" },
        { status: 400 }
      );
    }

    // Get the conditioning record to verify it exists
    const conditioning = await prisma.conditioning.findUnique({
      where: { id: conditioningId },
      include: {
        conProg: {
          include: {
            activities: true,
          },
        },
      },
    });

    if (!conditioning) {
      return NextResponse.json(
        { error: "Conditioning record not found" },
        { status: 404 }
      );
    }

    // Get all activity schedules for this conditioning record
    const schedules = await prisma.conditioningActivitySchedule.findMany({
      where: {
        conditioningId: conditioningId,
      },
      include: {
        activity: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Map the schedules to the expected format
    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      activityId: schedule.activityId,
      activityName: schedule.activity.name,
      date: schedule.date,
      timeOfDay: schedule.timeOfDay,
      status: schedule.status,
      notes: schedule.notes,
    }));

    return NextResponse.json(formattedSchedules);
  } catch (error) {
    console.error("Error fetching activity schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity schedules" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conditioningId = parseInt(params.id);
    if (isNaN(conditioningId)) {
      return NextResponse.json(
        { error: "Invalid conditioning ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { activityId, date, timeOfDay, notes } = body;

    // Validate required fields
    if (!activityId || !date) {
      return NextResponse.json(
        { error: "Activity ID and date are required" },
        { status: 400 }
      );
    }

    // Create the activity schedule
    const schedule = await prisma.conditioningActivitySchedule.create({
      data: {
        conditioningId,
        activityId,
        date: new Date(date),
        timeOfDay: timeOfDay || "MORNING",
        notes: notes || null,
      },
      include: {
        activity: true,
      },
    });

    return NextResponse.json({
      id: schedule.id,
      activityId: schedule.activityId,
      activityName: schedule.activity.name,
      date: schedule.date,
      timeOfDay: schedule.timeOfDay,
      status: schedule.status,
      notes: schedule.notes,
    });
  } catch (error) {
    console.error("Error creating activity schedule:", error);
    return NextResponse.json(
      { error: "Failed to create activity schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conditioningId = parseInt(params.id);
    if (isNaN(conditioningId)) {
      return NextResponse.json(
        { error: "Invalid conditioning ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Delete the activity schedule
    await prisma.conditioningActivitySchedule.delete({
      where: {
        id: parseInt(scheduleId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete activity schedule" },
      { status: 500 }
    );
  }
}
