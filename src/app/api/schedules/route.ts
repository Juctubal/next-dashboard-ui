import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TaskType, TaskCategory, UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const taskName = formData.get("taskName") as string;
    const taskType = formData.get("taskType") as string;
    const taskCategory = formData.get("taskCategory") as string;
    const taskDesc = formData.get("taskDesc") as string;
    const staffId = formData.get("staffId") as string;
    const staffType = formData.get("staffType") as string;

    console.log("Received form data:", {
      taskName,
      taskType,
      taskCategory,
      taskDesc,
      staffId,
      staffType,
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
