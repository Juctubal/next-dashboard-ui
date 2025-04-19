import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ConditioningStatus, TaskCategory } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      gamefowlIds,
      eventId,
      conProgId,
      handlerId,
      startDate,
      endDate,
      status,
    } = body;

    console.log("Creating conditioning record with data:", {
      gamefowlIds,
      eventId,
      conProgId,
      handlerId,
      startDate,
      endDate,
      status,
    });

    // Create the conditioning record and its associated gamefowl records in a transaction
    const conditioning = await prisma.$transaction(async (tx) => {
      // Create the main conditioning record
      const conditioningRecord = await tx.conditioning.create({
        data: {
          eventId: parseInt(eventId),
          conProgId: parseInt(conProgId),
          handlerId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: (status || "PLANNED") as ConditioningStatus,
        },
        include: {
          conProg: {
            include: {
              activities: true,
            },
          },
          event: true,
          gamefowls: {
            include: {
              gamefowl: true,
            },
          },
          handler: true,
        },
      });

      // Create the conditioning-gamefowl associations
      await Promise.all(
        gamefowlIds.map((gamefowlId: number) =>
          tx.conditioningGamefowl.create({
            data: {
              conditioningId: conditioningRecord.id,
              gamefowlId,
            },
          })
        )
      );

      // Fetch the complete record with all associations
      const completeRecord = await tx.conditioning.findUnique({
        where: { id: conditioningRecord.id },
        include: {
          conProg: {
            include: {
              activities: true,
            },
          },
          event: true,
          gamefowls: {
            include: {
              gamefowl: true,
            },
          },
          handler: true,
        },
      });

      if (!completeRecord) {
        throw new Error("Failed to create conditioning record");
      }

      return completeRecord;
    });

    console.log("Created conditioning record:", conditioning);
    console.log(
      "Number of activities:",
      conditioning.conProg.activities.length
    );

    // Create a schedule entry for each conditioning activity
    for (const activity of conditioning.conProg.activities) {
      console.log("Creating schedule for activity:", activity);

      // Create the main schedule
      const schedule = await prisma.schedule.create({
        data: {
          taskName: `${activity.name} - ${conditioning.gamefowls
            .map((g) => g.gamefowl.name)
            .join(", ")}`,
          taskType: "RECURRING",
          taskCategory: "OTHER" as any,
          descript: `${activity.description} - Part of ${conditioning.conProg.programName} for ${conditioning.event.eventName}`,
          staffId: handlerId,
          staffType: "HANDLER",
          status: "PLANNED",
        },
      });

      console.log("Created schedule:", schedule);

      // Create the recurrent schedule
      const recurrentSchedule = await prisma.recurrentSchedules.create({
        data: {
          schedId: schedule.id,
          reccurencePattern: "OTHER",
          startDate: conditioning.startDate,
          endDate: conditioning.endDate,
          time_of_day: "09:00", // Default time, can be adjusted as needed
        },
      });

      console.log("Created recurrent schedule:", recurrentSchedule);
    }

    return NextResponse.json(conditioning);
  } catch (error) {
    console.error("Error creating conditioning record:", error);
    return NextResponse.json(
      { error: "Failed to create conditioning record" },
      { status: 500 }
    );
  }
}
