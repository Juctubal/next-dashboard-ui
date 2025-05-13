"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import {
  EventType,
  AgeCategory,
  EventStatus,
  GamefowlStatus,
} from "@prisma/client";

// Event actions
export async function createEvent(formData: FormData) {
  const eventName = formData.get("eventName") as string;
  const eventType = formData.get("eventType") as EventType;
  const ageCategory = formData.get("ageCategory") as AgeCategory;
  const eventDate = formData.get("eventDate") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as EventStatus;
  const gamefowlIdsJson = formData.get("gamefowlIds") as string;

  let gamefowlIds: number[] = [];
  if (gamefowlIdsJson) {
    try {
      gamefowlIds = JSON.parse(gamefowlIdsJson);
    } catch (error) {
      console.error("Error parsing gamefowlIds:", error);
      return { success: false, error: "Invalid gamefowl selection" };
    }
  }

  try {
    // Create the event and update gamefowl statuses in a transaction
    const event = await prisma.$transaction(async (tx) => {
      // Create the event
      const event = await tx.event.create({
        data: {
          eventName,
          eventType,
          ageCategory,
          eventDate: new Date(eventDate),
          description,
          status,
        },
      });

      // Create event gamefowls and update their status
      if (gamefowlIds.length > 0) {
        // Create event-gamefowl associations
        await tx.eventGamefowl.createMany({
          data: gamefowlIds.map((gamefowlId) => ({
            eventId: event.id,
            gamefowlId,
          })),
        });

        // Update gamefowl statuses to COMPETING
        await tx.gamefowl.updateMany({
          where: {
            id: {
              in: gamefowlIds,
            },
          },
          data: {
            status: GamefowlStatus.COMPETING,
          },
        });
      }

      return event;
    });

    revalidatePath("/list/events");
    return { success: true };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(id: number, formData: FormData) {
  const eventName = formData.get("eventName") as string;
  const eventType = formData.get("eventType") as EventType;
  const ageCategory = formData.get("ageCategory") as AgeCategory;
  const eventDate = formData.get("eventDate") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as EventStatus;
  const gamefowlIdsJson = formData.get("gamefowlIds") as string;

  let gamefowlIds: number[] = [];
  if (gamefowlIdsJson) {
    try {
      gamefowlIds = JSON.parse(gamefowlIdsJson);
    } catch (error) {
      console.error("Error parsing gamefowlIds:", error);
      return { success: false, error: "Invalid gamefowl selection" };
    }
  }

  try {
    // Get the event with its current gamefowls and conditioning records
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        gamefowl: {
          include: {
            gamefowl: true,
          },
        },
        conditioning: {
          include: {
            gamefowls: {
              include: {
                gamefowl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Check if any conditioning records are completed
    const hasCompletedConditioning = event.conditioning.some(
      (cond) => cond.status === "COMPLETED"
    );

    if (hasCompletedConditioning) {
      return {
        success: false,
        error:
          "Cannot change gamefowls when conditioning records are completed",
      };
    }

    // Update the event and its associated records in a transaction
    await prisma.$transaction(async (tx) => {
      // Get the IDs of previously selected gamefowls
      const previousGamefowlIds = event.gamefowl.map((g) => g.gamefowl.id);

      // Find gamefowls that are being removed
      const removedGamefowlIds = previousGamefowlIds.filter(
        (id) => !gamefowlIds.includes(id)
      );

      // Reset status of removed gamefowls to IDLE
      if (removedGamefowlIds.length > 0) {
        await Promise.all(
          removedGamefowlIds.map((gamefowlId) =>
            tx.gamefowl.update({
              where: { id: gamefowlId },
              data: {
                status: GamefowlStatus.IDLE,
              },
            })
          )
        );
      }

      // Update the event
      await tx.event.update({
        where: { id },
        data: {
          eventName,
          eventType,
          ageCategory,
          eventDate: new Date(eventDate),
          description,
          status,
        },
      });

      // Delete existing event-gamefowl associations
      await tx.eventGamefowl.deleteMany({
        where: { eventId: id },
      });

      // Create new event-gamefowl associations
      if (gamefowlIds.length > 0) {
        await tx.eventGamefowl.createMany({
          data: gamefowlIds.map((gamefowlId) => ({
            eventId: id,
            gamefowlId,
          })),
        });

        // Update gamefowl status to COMPETING
        await tx.gamefowl.updateMany({
          where: {
            id: {
              in: gamefowlIds,
            },
          },
          data: {
            status: GamefowlStatus.COMPETING,
          },
        });
      }

      // Update conditioning records to match new gamefowls
      for (const conditioning of event.conditioning) {
        // Delete existing conditioning-gamefowl associations
        await tx.conditioningGamefowl.deleteMany({
          where: {
            conditioningId: conditioning.id,
          },
        });

        // Create new conditioning-gamefowl associations
        if (gamefowlIds.length > 0) {
          await tx.conditioningGamefowl.createMany({
            data: gamefowlIds.map((gamefowlId) => ({
              conditioningId: conditioning.id,
              gamefowlId,
            })),
          });
        }
      }
    });

    revalidatePath("/list/events");
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: number) {
  try {
    await prisma.event.delete({
      where: { id },
    });

    revalidatePath("/list/events");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
