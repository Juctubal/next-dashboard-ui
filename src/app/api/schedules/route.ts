import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  TaskType,
  TaskCategory,
  UserRole,
  RecurrencePattern,
} from "@prisma/client";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const taskName = formData.get("taskName") as string;
    const taskType = formData.get("taskType") as string;
    const taskCategory = formData.get("taskCategory") as string;
    const taskDesc = formData.get("taskDesc") as string;
    const staffId = formData.get("staffId") as string;
    const staffType = formData.get("staffType") as string;

    // One-time schedule fields
    const taskDate = formData.get("taskDate") as string;
    const time_of_day = formData.get("time_of_day") as string;

    // Recurring schedule fields
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reccurencePattern = formData.get("reccurencePattern") as string;
    const weekDays = formData.get("weekDays") as string;
    const monthDay = formData.get("monthDay") as string;

    console.log("Received form data:", {
      taskName,
      taskType,
      taskCategory,
      taskDesc,
      staffId,
      staffType,
      taskDate,
      time_of_day,
      startDate,
      endDate,
      reccurencePattern,
      weekDays,
      monthDay,
    });

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
    if (staffType && !Object.values(UserRole).includes(staffType as UserRole)) {
      return NextResponse.json(
        {
          error: `Invalid staffType. Must be one of: ${Object.values(
            UserRole
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create the schedule
    const schedule = await prisma.schedule.create({
      data: {
        taskName,
        taskType: taskType as TaskType,
        taskCategory: taskCategory as TaskCategory,
        descript: taskDesc,
        staffId: staffId || null,
        staffType: (staffType as UserRole) || null,
      },
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
          time_of_day: time_of_day,
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
    console.error("Error creating schedule:", error);
    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to create schedule",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
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
    const staffType = formData.get("staffType") as string;

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
    if (staffType && !Object.values(UserRole).includes(staffType as UserRole)) {
      return NextResponse.json(
        {
          error: `Invalid staffType. Must be one of: ${Object.values(
            UserRole
          ).join(", ")}`,
        },
        { status: 400 }
      );
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
          time_of_day: time_of_day,
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
