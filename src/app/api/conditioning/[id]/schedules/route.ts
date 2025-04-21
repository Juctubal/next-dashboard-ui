import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid conditioning ID" },
        { status: 400 }
      );
    }

    const schedules = await prisma.conditioningActivitySchedule.findMany({
      where: {
        conditioningId: id,
      },
      include: {
        activity: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(schedules);
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
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid conditioning ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { activityId, date } = body;

    if (!activityId || !date) {
      return NextResponse.json(
        { error: "Activity ID and date are required" },
        { status: 400 }
      );
    }

    const schedule = await prisma.conditioningActivitySchedule.create({
      data: {
        conditioningId: id,
        activityId: parseInt(activityId),
        date: new Date(date),
      },
      include: {
        activity: true,
      },
    });

    return NextResponse.json(schedule);
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
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid conditioning ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");
    const date = searchParams.get("date");

    if (!activityId || !date) {
      return NextResponse.json(
        { error: "Activity ID and date are required" },
        { status: 400 }
      );
    }

    await prisma.conditioningActivitySchedule.deleteMany({
      where: {
        conditioningId: id,
        activityId: parseInt(activityId),
        date: new Date(date),
      },
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete activity schedule" },
      { status: 500 }
    );
  }
}
