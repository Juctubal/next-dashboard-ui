"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { EventType, AgeCategory, EventStatus } from "@prisma/client";

// Event actions
export async function createEvent(formData: FormData) {
  const eventName = formData.get("eventName") as string;
  const eventType = formData.get("eventType") as EventType;
  const ageCategory = formData.get("ageCategory") as AgeCategory;
  const eventDate = formData.get("eventDate") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as EventStatus;

  try {
    await prisma.event.create({
      data: {
        eventName,
        eventType,
        ageCategory,
        eventDate: new Date(eventDate),
        description,
        status,
      },
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

  try {
    await prisma.event.update({
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
