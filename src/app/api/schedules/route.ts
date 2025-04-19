import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  TaskType,
  TaskCategory,
  UserRole,
  RecurrencePattern,
  EventStatus,
} from "@prisma/client";

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

// In-memory cache
let cache: {
  data: any[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

export async function GET() {
  try {
    // Check if we have cached data that's still valid
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_DURATION * 1000) {
      return NextResponse.json(cache.data, {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Fetch all schedules with their one-time and recurring schedules
    const schedules = await prisma.schedule.findMany({
      include: {
        oneTime: true,
        recurrent: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    // Transform the schedules to match the format expected by the EventCalendar component
    const formattedSchedules = schedules.flatMap((schedule) => {
      const result: Array<{
        id: string;
        eventName: string;
        eventDate: string;
        description: string;
        type: string;
        scheduleId: number;
        oneTimeId?: number;
        recurringId?: number;
        isRecurring?: boolean;
        endDate?: string | null;
        recurrencePattern?: string | null;
        weekDays?: string | null;
      }> = [];

      // Add one-time schedules
      if (schedule.oneTime && schedule.oneTime.length > 0) {
        schedule.oneTime.forEach((oneTime) => {
          result.push({
            id: `schedule-${schedule.id}-${oneTime.id}`,
            eventName: oneTime.taskName || schedule.taskName,
            eventDate: oneTime.taskDate.toISOString(),
            description: `${schedule.taskType} - ${schedule.taskCategory} - ${schedule.descript}`,
            type: "schedule",
            scheduleId: schedule.id,
            oneTimeId: oneTime.id,
          });
        });
      }

      // Add recurring schedules
      if (schedule.recurrent && schedule.recurrent.length > 0) {
        schedule.recurrent.forEach((recurring) => {
          // For recurring schedules, we'll add the start date
          result.push({
            id: `schedule-${schedule.id}-${recurring.id}`,
            eventName: schedule.taskName,
            eventDate: recurring.startDate.toISOString(),
            description: `${schedule.taskType} - ${schedule.taskCategory} - ${schedule.descript} (Recurring: ${recurring.reccurencePattern})`,
            type: "schedule",
            scheduleId: schedule.id,
            recurringId: recurring.id,
            isRecurring: true,
            endDate: recurring.endDate.toISOString(),
            recurrencePattern: recurring.reccurencePattern,
            weekDays: recurring.weekDays,
          });
        });
      }

      return result;
    });

    // Update cache
    cache = {
      data: formattedSchedules,
      timestamp: now,
    };

    return NextResponse.json(formattedSchedules, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error fetching schedules from database:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    console.log("Received form data:", Object.fromEntries(formData.entries()));

    // Extract and validate required fields
    const taskName = formData.get("taskName") as string;
    const taskType = formData.get("taskType") as TaskType;
    const taskCategory = formData.get("taskCategory") as TaskCategory;
    const descript = formData.get("taskDesc") as string;
    const staffId = formData.get("staffId") as string;
    let staffType = formData.get("staffType") as UserRole;

    console.log("Processed form data:", {
      taskName,
      taskType,
      taskCategory,
      descript,
      staffId,
      staffType,
    });

    // Validate taskType
    if (!Object.values(TaskType).includes(taskType)) {
      console.error("Invalid taskType:", taskType);
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

    // Validate taskCategory
    if (!Object.values(TaskCategory).includes(taskCategory)) {
      console.error("Invalid taskCategory:", taskCategory);
      return NextResponse.json(
        { error: "Invalid task category" },
        { status: 400 }
      );
    }

    // Validate staffType if provided
    if (staffType) {
      // Convert to lowercase for case-insensitive comparison
      const normalizedStaffType = staffType.toLowerCase();
      if (!Object.values(UserRole).includes(normalizedStaffType as UserRole)) {
        console.error(
          "Invalid staffType:",
          staffType,
          "Normalized:",
          normalizedStaffType
        );
        console.error("Available UserRole values:", Object.values(UserRole));
        return NextResponse.json(
          {
            error: `Invalid staff type: ${staffType}. Must be one of: ${Object.values(
              UserRole
            ).join(", ")}`,
          },
          { status: 400 }
        );
      }
      // Use the normalized value for the database
      staffType = normalizedStaffType as UserRole;
    }

    console.log("Staff information:", {
      staffId,
      staffType,
      hasStaffId: !!staffId,
      hasStaffType: !!staffType,
    });

    // Create the schedule
    const schedule = await prisma.schedule.create({
      data: {
        taskName,
        taskType,
        taskCategory,
        descript,
        status: "PLANNED",
        staffId: staffId || null,
        staffType: staffType || null,
      },
    });

    console.log("Created schedule:", schedule);

    // Handle one-time schedule
    if (taskType === "ONETIME") {
      const taskDate = formData.get("taskDate") as string;
      const time_of_day = formData.get("time_of_day") as string;

      if (!taskDate || !time_of_day) {
        console.error("Missing required fields for one-time schedule");
        return NextResponse.json(
          { error: "Missing required fields for one-time schedule" },
          { status: 400 }
        );
      }

      const oneTimeSchedule = await prisma.oneTimeSched.create({
        data: {
          schedId: schedule.id,
          taskDate: new Date(taskDate),
          time_of_day,
          taskName: schedule.taskName,
        },
      });

      console.log("Created one-time schedule:", oneTimeSchedule);
    }

    // Handle recurring schedule
    if (taskType === "RECURRING") {
      const startDate = formData.get("startDate") as string;
      const endDate = formData.get("endDate") as string;
      const reccurencePattern = formData.get(
        "reccurencePattern"
      ) as RecurrencePattern;
      const time_of_day = formData.get("time_of_day") as string;

      if (!startDate || !endDate || !reccurencePattern || !time_of_day) {
        console.error("Missing required fields for recurring schedule");
        return NextResponse.json(
          { error: "Missing required fields for recurring schedule" },
          { status: 400 }
        );
      }

      const weekDays = formData.getAll("weekDays");
      const weekDaysString = weekDays.length > 0 ? weekDays.join(",") : null;

      const recurringSchedule = await prisma.recurrentSchedules.create({
        data: {
          schedId: schedule.id,
          reccurencePattern: reccurencePattern as RecurrencePattern,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          time_of_day,
          weekDays: weekDaysString,
        },
      });

      console.log("Created recurring schedule:", recurringSchedule);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const taskName = formData.get("taskName") as string;
    const taskType = formData.get("taskType") as string;
    const taskCategory = formData.get("taskCategory") as string;
    const taskDesc = formData.get("taskDesc") as string;
    const staffId = formData.get("staffId") as string;
    let staffType = formData.get("staffType") as string;

    // One-time schedule fields
    const taskDate = formData.get("taskDate") as string;
    const time_of_day = formData.get("time_of_day") as string;

    // Recurring schedule fields
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reccurencePattern = formData.get("reccurencePattern") as string;
    const weekDays = formData.get("weekDays") as string;
    const monthDay = formData.get("monthDay") as string;

    // Validate and convert taskType
    if (!Object.values(TaskType).includes(taskType as TaskType)) {
      return NextResponse.json(
        {
          error: `Invalid taskType. Must be one of: ${Object.values(
            TaskType
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate and convert taskCategory
    if (!Object.values(TaskCategory).includes(taskCategory as TaskCategory)) {
      console.log(
        "Available TaskCategory values:",
        Object.values(TaskCategory)
      );
      console.log("Provided taskCategory:", taskCategory);
      return NextResponse.json(
        {
          error: `Invalid taskCategory. Must be one of: ${Object.values(
            TaskCategory
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate staffType if provided
    if (staffType) {
      // Convert to lowercase for case-insensitive comparison
      const normalizedStaffType = staffType.toLowerCase();
      if (!Object.values(UserRole).includes(normalizedStaffType as UserRole)) {
        console.error(
          "Invalid staffType:",
          staffType,
          "Normalized:",
          normalizedStaffType
        );
        console.error("Available UserRole values:", Object.values(UserRole));
        return NextResponse.json(
          {
            error: `Invalid staff type: ${staffType}. Must be one of: ${Object.values(
              UserRole
            ).join(", ")}`,
          },
          { status: 400 }
        );
      }
      // Use the normalized value for the database
      staffType = normalizedStaffType as UserRole;
    }

    // Update the schedule
    const schedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: {
        taskName,
        taskType: taskType as TaskType,
        taskCategory: taskCategory as TaskCategory,
        descript: taskDesc,
        staffId: staffId || null,
        staffType: (staffType as UserRole) || null,
      },
    });

    // Delete existing one-time and recurring schedules
    await prisma.oneTimeSched.deleteMany({
      where: { schedId: parseInt(id) },
    });

    await prisma.recurrentSchedules.deleteMany({
      where: { schedId: parseInt(id) },
    });

    // Create one-time schedule if applicable
    if (taskType === "ONETIME" && taskDate && time_of_day) {
      await prisma.oneTimeSched.create({
        data: {
          schedId: schedule.id,
          taskName: taskName,
          taskDate: new Date(taskDate),
          time_of_day: time_of_day,
        },
      });
    }

    // Create recurring schedule if applicable
    if (
      taskType === "RECURRING" &&
      startDate &&
      endDate &&
      reccurencePattern &&
      time_of_day
    ) {
      // Validate recurrence pattern
      if (
        !Object.values(RecurrencePattern).includes(
          reccurencePattern as RecurrencePattern
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid reccurencePattern. Must be one of: ${Object.values(
              RecurrencePattern
            ).join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Create the recurring schedule
      await prisma.recurrentSchedules.create({
        data: {
          schedId: schedule.id,
          reccurencePattern: reccurencePattern as RecurrencePattern,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          time_of_day,
          weekDays: weekDays || null,
        },
      });

      // If weekly, create entries for each selected day
      if (reccurencePattern === "WEEKLY" && weekDays) {
        const selectedDays = JSON.parse(weekDays);
        // Additional processing for weekly schedules could be added here
        // For example, creating individual entries for each selected day
      }

      // If monthly, store the day of the month
      if (reccurencePattern === "MONTHLY" && monthDay) {
        // Additional processing for monthly schedules could be added here
        // For example, storing the day of the month in a separate field
      }
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to update schedule",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
