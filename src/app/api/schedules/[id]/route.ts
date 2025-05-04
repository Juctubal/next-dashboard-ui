import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  TaskType,
  TaskCategory,
  UserRole,
  RecurrencePattern,
  EventStatus,
} from "@prisma/client";

// Helper function to check for schedule conflicts
async function checkScheduleConflicts(
  staffId: string,
  staffType: UserRole,
  taskDate: Date,
  timeOfDay: string,
  excludeScheduleId?: number
) {
  // Check one-time schedules
  const oneTimeConflicts = await prisma.oneTimeSched.findMany({
    where: {
      taskDate: taskDate,
      time_of_day: timeOfDay,
      schedule: {
        staffId: staffId,
        staffType: staffType,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      },
    },
    include: {
      schedule: true,
    },
  });

  if (oneTimeConflicts.length > 0 && oneTimeConflicts[0].schedule) {
    return {
      hasConflict: true,
      conflictingSchedule: oneTimeConflicts[0].schedule,
      conflictType: "oneTime",
    };
  }

  // Check recurring schedules
  const recurringConflicts = await prisma.recurrentSchedules.findMany({
    where: {
      time_of_day: timeOfDay,
      startDate: { lte: taskDate },
      endDate: { gte: taskDate },
      schedule: {
        staffId: staffId,
        staffType: staffType,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      },
    },
    include: {
      schedule: true,
    },
  });

  // For weekly schedules, check if the day matches
  const taskDay = taskDate.getDay();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const taskDayName = dayNames[taskDay];

  for (const recurring of recurringConflicts) {
    if (!recurring.schedule) continue;

    if (recurring.reccurencePattern === "WEEKLY") {
      const weekDays = recurring.weekDays ? JSON.parse(recurring.weekDays) : [];
      if (weekDays.includes(taskDayName)) {
        return {
          hasConflict: true,
          conflictingSchedule: recurring.schedule,
          conflictType: "recurring",
        };
      }
    } else if (recurring.reccurencePattern === "DAILY") {
      return {
        hasConflict: true,
        conflictingSchedule: recurring.schedule,
        conflictType: "recurring",
      };
    } else if (recurring.reccurencePattern === "MONTHLY") {
      const taskDateDay = taskDate.getDate();
      // For monthly schedules, we'll check if the day of month matches
      // Since monthDay is not in the schema, we'll skip this check for now
      // This can be added later when the schema is updated
      continue;
    }
  }

  return { hasConflict: false };
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const taskName = formData.get("taskName") as string;
    const taskType = formData.get("taskType") as string;
    const taskCategory = formData.get("taskCategory") as string;
    const taskDesc = formData.get("taskDesc") as string;
    const staffId = formData.get("staffId") as string;
    let staffType = formData.get("staffType") as string;
    const status = formData.get("status") as string;

    // One-time schedule fields
    const taskDate = formData.get("taskDate") as string;

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

    // Create the schedule first
    const schedule = await prisma.schedule.update({
      where: { id: parseInt(params.id) },
      data: {
        taskName,
        taskType: taskType as TaskType,
        taskCategory: taskCategory as TaskCategory,
        descript: taskDesc,
        staffId: staffId || null,
        staffType: staffType ? (staffType as UserRole) : null,
        status: status as EventStatus,
      },
    });

    // Delete existing one-time and recurring schedules
    await prisma.oneTimeSched.deleteMany({
      where: { schedId: parseInt(params.id) },
    });

    await prisma.recurrentSchedules.deleteMany({
      where: { schedId: parseInt(params.id) },
    });

    // Check for schedule conflicts before creating the schedule
    if (staffId && staffType) {
      if (taskType === "ONETIME") {
        const timeSlots = formData.getAll("time_of_day") as string[];

        for (const timeOfDay of timeSlots) {
          const conflictCheck = await checkScheduleConflicts(
            staffId,
            staffType as UserRole,
            new Date(taskDate),
            timeOfDay,
            parseInt(params.id)
          );

          if (conflictCheck.hasConflict && conflictCheck.conflictingSchedule) {
            return NextResponse.json(
              {
                error: `Schedule conflict detected. ${
                  conflictCheck.conflictingSchedule.taskName
                } is already scheduled for ${timeOfDay} on ${new Date(
                  taskDate
                ).toLocaleDateString()}`,
              },
              { status: 400 }
            );
          }
        }
      } else if (taskType === "RECURRING") {
        const timeSlots = formData.getAll("time_of_day") as string[];
        const customDate = formData.get("customDate") as string;

        if (timeSlots.length === 0) {
          return NextResponse.json(
            { error: "At least one time slot is required" },
            { status: 400 }
          );
        }

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

        // Check each day in the date range for conflicts
        const start = new Date(startDate);
        const end = new Date(endDate);
        const currentDate = new Date(start);

        while (currentDate <= end) {
          for (const timeOfDay of timeSlots) {
            const conflictCheck = await checkScheduleConflicts(
              staffId,
              staffType as UserRole,
              new Date(currentDate),
              timeOfDay,
              parseInt(params.id)
            );

            if (
              conflictCheck.hasConflict &&
              conflictCheck.conflictingSchedule
            ) {
              return NextResponse.json(
                {
                  error: `Schedule conflict detected. ${
                    conflictCheck.conflictingSchedule.taskName
                  } is already scheduled for ${timeOfDay} on ${currentDate.toLocaleDateString()}`,
                },
                { status: 400 }
              );
            }
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // For "Custom" pattern, we need customDate
        if (reccurencePattern === "CUSTOM") {
          if (!customDate) {
            return NextResponse.json(
              { error: "Custom dates are required for 'Custom' pattern" },
              { status: 400 }
            );
          }

          try {
            const customDates = JSON.parse(customDate);
            if (!Array.isArray(customDates) || customDates.length === 0) {
              return NextResponse.json(
                { error: "At least one custom date is required" },
                { status: 400 }
              );
            }

            // Create a recurring schedule for each time slot
            for (const time_of_day of timeSlots) {
              await prisma.recurrentSchedules.create({
                data: {
                  schedId: schedule.id,
                  reccurencePattern: reccurencePattern as RecurrencePattern,
                  startDate: new Date(customDates[0]), // Use first date as start date
                  endDate: new Date(customDates[customDates.length - 1]), // Use last date as end date
                  time_of_day,
                  customDate: customDate, // Store the custom dates
                },
              });
            }
          } catch (error) {
            console.error("Error parsing custom dates:", error);
            return NextResponse.json(
              { error: "Invalid custom dates format" },
              { status: 400 }
            );
          }
        } else {
          // For other patterns (DAILY, WEEKLY), create a recurring schedule for each time slot
          for (const time_of_day of timeSlots) {
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
          }
        }
      }
    }

    // Create one-time schedule if applicable
    if (taskType === "ONETIME" && taskDate) {
      const timeSlots = formData.getAll("time_of_day") as string[];

      if (timeSlots.length === 0) {
        return NextResponse.json(
          { error: "At least one time slot is required" },
          { status: 400 }
        );
      }

      // Create a one-time schedule for each time slot
      for (const time_of_day of timeSlots) {
        await prisma.oneTimeSched.create({
          data: {
            schedId: schedule.id,
            taskName: taskName,
            taskDate: new Date(taskDate),
            time_of_day,
          },
        });
      }
    }

    // Create recurring schedule if applicable
    if (taskType === "RECURRING" && startDate && endDate && reccurencePattern) {
      const timeSlots = formData.getAll("time_of_day") as string[];
      const customDate = formData.get("customDate") as string;

      if (timeSlots.length === 0) {
        return NextResponse.json(
          { error: "At least one time slot is required" },
          { status: 400 }
        );
      }

      // For "Custom" pattern, we need customDate
      if (reccurencePattern === "CUSTOM") {
        if (!customDate) {
          return NextResponse.json(
            { error: "Custom dates are required for 'Custom' pattern" },
            { status: 400 }
          );
        }

        try {
          const customDates = JSON.parse(customDate);
          if (!Array.isArray(customDates) || customDates.length === 0) {
            return NextResponse.json(
              { error: "At least one custom date is required" },
              { status: 400 }
            );
          }

          // Create a recurring schedule for each time slot
          for (const time_of_day of timeSlots) {
            await prisma.recurrentSchedules.create({
              data: {
                schedId: schedule.id,
                reccurencePattern: reccurencePattern as RecurrencePattern,
                startDate: new Date(customDates[0]), // Use first date as start date
                endDate: new Date(customDates[customDates.length - 1]), // Use last date as end date
                time_of_day,
                customDate: customDate, // Store the custom dates
              },
            });
          }
        } catch (error) {
          console.error("Error parsing custom dates:", error);
          return NextResponse.json(
            { error: "Invalid custom dates format" },
            { status: 400 }
          );
        }
      } else {
        // For other patterns (DAILY, WEEKLY), create a recurring schedule for each time slot
        for (const time_of_day of timeSlots) {
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
        }
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
