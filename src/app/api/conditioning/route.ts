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

      // Create schedules for each activity with their specific dates
      if (activitySchedules && activitySchedules.length > 0) {
        console.log("Processing activity schedules:", activitySchedules);

        for (const schedule of activitySchedules) {
          const activity = conditioningRecord.conProg.activities.find(
            (a) => a.id === schedule.activityId
          );

          if (activity) {
            console.log(
              `Creating schedules for activity: ${activity.name} with dates:`,
              schedule.dates
            );

            // Create a schedule entry for each date
            for (const date of schedule.dates) {
              try {
                // Create the main schedule record
                const scheduleRecord = await tx.schedule.create({
                  data: {
                    taskName: `${activity.name} - ${conditioningRecord.gamefowls
                      .map((g) => g.gamefowl.name)
                      .join(", ")}`,
                    taskType: "ONETIME",
                    taskCategory: "OTHER",
                    descript: `${activity.description} - Part of ${conditioningRecord.conProg.programName} for ${conditioningRecord.event.eventName}`,
                    staffId: handlerId,
                    staffType: "handler",
                    status: "PLANNED",
                  },
                });

                console.log("Created schedule record:", scheduleRecord);

                // Create the one-time schedule
                const oneTimeSchedule = await tx.oneTimeSched.create({
                  data: {
                    schedId: scheduleRecord.id,
                    taskName: scheduleRecord.taskName,
                    taskDate: new Date(date),
                    time_of_day: "09:00", // Default time, can be adjusted as needed
                  },
                });

                console.log("Created one-time schedule:", oneTimeSchedule);
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
      const conditioningRecord = await tx.conditioning.update({
        where: { id: parseInt(id) },
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

      // Delete existing schedules for this conditioning record
      // First, find all schedules related to this conditioning record
      const existingSchedules = await tx.schedule.findMany({
        where: {
          taskName: {
            contains: conditioningRecord.conProg.programName,
          },
          staffId: handlerId,
        },
      });

      // Delete the one-time schedules first
      for (const schedule of existingSchedules) {
        await tx.oneTimeSched.deleteMany({
          where: {
            schedId: schedule.id,
          },
        });
      }

      // Then delete the schedules
      await tx.schedule.deleteMany({
        where: {
          id: {
            in: existingSchedules.map((s) => s.id),
          },
        },
      });

      // Create new schedules for each activity with their specific dates
      if (activitySchedules && activitySchedules.length > 0) {
        console.log(
          "Processing activity schedules for update:",
          activitySchedules
        );

        for (const schedule of activitySchedules) {
          const activity = conditioningRecord.conProg.activities.find(
            (a) => a.id === schedule.activityId
          );

          if (activity) {
            console.log(
              `Creating schedules for activity: ${activity.name} with dates:`,
              schedule.dates
            );

            // Create a schedule entry for each date
            for (const date of schedule.dates) {
              try {
                // Create the main schedule record
                const scheduleRecord = await tx.schedule.create({
                  data: {
                    taskName: `${activity.name} - ${conditioningRecord.gamefowls
                      .map((g) => g.gamefowl.name)
                      .join(", ")}`,
                    taskType: "ONETIME",
                    taskCategory: "OTHER",
                    descript: `${activity.description} - Part of ${conditioningRecord.conProg.programName} for ${conditioningRecord.event.eventName}`,
                    staffId: handlerId,
                    staffType: "handler",
                    status: "PLANNED",
                  },
                });

                console.log("Created schedule record:", scheduleRecord);

                // Create the one-time schedule
                const oneTimeSchedule = await tx.oneTimeSched.create({
                  data: {
                    schedId: scheduleRecord.id,
                    taskName: scheduleRecord.taskName,
                    taskDate: new Date(date),
                    time_of_day: "09:00", // Default time, can be adjusted as needed
                  },
                });

                console.log("Created one-time schedule:", oneTimeSchedule);
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
