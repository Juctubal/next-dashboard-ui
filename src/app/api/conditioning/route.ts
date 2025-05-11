import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  ConditioningStatus,
  TaskCategory,
  Prisma,
  GamefowlStatus,
} from "@prisma/client";

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
      activitySchedules,
    } = body;

    console.log("Creating conditioning record with data:", {
      gamefowlIds,
      eventId,
      conProgId,
      handlerId,
      startDate,
      endDate,
      status,
      activitySchedules,
    });

    // Create the conditioning record and its associated gamefowl records in a transaction
    const conditioning = await prisma.$transaction(async (tx) => {
      // Create the main conditioning record
      const data = {
        eventId: eventId ? parseInt(eventId) : undefined,
        conProgId: parseInt(conProgId),
        handlerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: (status || "ASSIGNED") as ConditioningStatus,
      } as Prisma.ConditioningUncheckedCreateInput;

      const conditioningRecord = await tx.conditioning.create({
        data,
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

      // Update gamefowl status to CONDITIONING
      await Promise.all(
        gamefowlIds.map((gamefowlId: number) =>
          tx.gamefowl.update({
            where: { id: gamefowlId },
            data: {
              status: GamefowlStatus.CONDITIONING,
            },
          })
        )
      );

      // Create activity schedules
      if (activitySchedules && activitySchedules.length > 0) {
        console.log("Processing activity schedules:", activitySchedules);

        for (const schedule of activitySchedules) {
          const activity = conditioningRecord.conProg.activities.find(
            (a: { id: number }) => a.id === schedule.activityId
          );

          if (activity) {
            console.log(
              `Creating schedules for activity: ${activity.name} with dates:`,
              schedule.dates
            );

            // Create a schedule entry for each date
            for (const date of schedule.dates) {
              try {
                await tx.conditioningActivitySchedule.create({
                  data: {
                    conditioningId: conditioningRecord.id,
                    activityId: schedule.activityId,
                    date: new Date(date),
                    timeOfDay: "MORNING", // Default time
                    status: "PLANNED", // Default status
                  },
                });
              } catch (scheduleError) {
                console.error(
                  `Error creating schedule for activity ${activity.name} on date ${date}:`,
                  scheduleError
                );
                // Continue with other dates even if one fails
              }
            }
          } else {
            console.warn(
              `Activity with ID ${schedule.activityId} not found in program`
            );
          }
        }
      } else {
        console.warn("No activity schedules provided");
      }

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
          activitySchedules: {
            include: {
              activity: true,
            },
          },
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

    return NextResponse.json(conditioning);
  } catch (error) {
    console.error("Error creating conditioning record:", error);
    return NextResponse.json(
      { error: "Failed to create conditioning record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      gamefowlIds,
      eventId,
      conProgId,
      handlerId,
      startDate,
      endDate,
      status,
      activitySchedules,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Conditioning ID is required for updates" },
        { status: 400 }
      );
    }

    console.log("Updating conditioning record with data:", {
      id,
      gamefowlIds,
      eventId,
      conProgId,
      handlerId,
      startDate,
      endDate,
      status,
      activitySchedules,
    });

    // Update the conditioning record and its associated gamefowl records in a transaction
    const conditioning = await prisma.$transaction(async (tx) => {
      // Update the main conditioning record
      const data: Prisma.ConditioningUncheckedUpdateInput = {
        eventId: eventId ? parseInt(eventId) : undefined,
        conProgId: parseInt(conProgId),
        handlerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: (status || "ASSIGNED") as ConditioningStatus,
      };

      const conditioningRecord = await tx.conditioning.update({
        where: { id: parseInt(id) },
        data,
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

      // Delete existing conditioning-gamefowl associations
      await tx.conditioningGamefowl.deleteMany({
        where: {
          conditioningId: parseInt(id),
        },
      });

      // Create new conditioning-gamefowl associations
      await Promise.all(
        gamefowlIds.map((gamefowlId: number) =>
          tx.conditioningGamefowl.create({
            data: {
              conditioningId: parseInt(id),
              gamefowlId,
            },
          })
        )
      );

      // Update gamefowl status to CONDITIONING
      await Promise.all(
        gamefowlIds.map((gamefowlId: number) =>
          tx.gamefowl.update({
            where: { id: gamefowlId },
            data: {
              status: GamefowlStatus.CONDITIONING,
            },
          })
        )
      );

      // Delete existing activity schedules
      await tx.conditioningActivitySchedule.deleteMany({
        where: {
          conditioningId: parseInt(id),
        },
      });

      // Create new activity schedules
      if (activitySchedules && activitySchedules.length > 0) {
        console.log(
          "Processing activity schedules for update:",
          activitySchedules
        );

        for (const schedule of activitySchedules) {
          const activity = conditioningRecord.conProg.activities.find(
            (a: { id: number }) => a.id === schedule.activityId
          );

          if (activity) {
            console.log(
              `Creating schedules for activity: ${activity.name} with dates:`,
              schedule.dates
            );

            // Create a schedule entry for each date
            for (const date of schedule.dates) {
              try {
                await tx.conditioningActivitySchedule.create({
                  data: {
                    conditioningId: parseInt(id),
                    activityId: schedule.activityId,
                    date: new Date(date),
                    timeOfDay: "MORNING", // Default time
                    status: "PLANNED", // Default status
                  },
                });
              } catch (scheduleError) {
                console.error(
                  `Error creating schedule for activity ${activity.name} on date ${date}:`,
                  scheduleError
                );
                // Continue with other dates even if one fails
              }
            }
          } else {
            console.warn(
              `Activity with ID ${schedule.activityId} not found in program`
            );
          }
        }
      } else {
        console.warn("No activity schedules provided for update");
      }

      // Fetch the complete record with all associations
      const completeRecord = await tx.conditioning.findUnique({
        where: { id: parseInt(id) },
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
          activitySchedules: {
            include: {
              activity: true,
            },
          },
        },
      });

      if (!completeRecord) {
        throw new Error("Failed to update conditioning record");
      }

      return completeRecord;
    });

    console.log("Updated conditioning record:", conditioning);

    return NextResponse.json(conditioning);
  } catch (error) {
    console.error("Error updating conditioning record:", error);
    return NextResponse.json(
      { error: "Failed to update conditioning record" },
      { status: 500 }
    );
  }
}
