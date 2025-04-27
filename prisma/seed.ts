import {
  PrismaClient,
  UserRole,
  ConditioningStatus,
  EventType,
  AgeCategory,
  EventStatus,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  try {
    // First, let's get all the current data
    const currentData = {
      admins: await prisma.admin.findMany(),
      handlers: await prisma.handler.findMany(),
      breeders: await prisma.breeder.findMany(),
      gamefowls: await prisma.gamefowl.findMany(),
      vaccines: await prisma.vaccine.findMany(),
      dewormings: await prisma.deworming.findMany(),
      breedings: await prisma.breeding.findMany(),
      sparrings: await prisma.sparring.findMany(),
      incubations: await prisma.incubation.findMany(),
      batches: await prisma.batch.findMany(),
      conditioningPrograms: await prisma.conditioningProgram.findMany(),
      conditioningActivities: await prisma.conditioningActivity.findMany(),
      events: await prisma.event.findMany(),
      conditionings: await prisma.conditioning.findMany(),
      conditioningGamefowls: await prisma.conditioningGamefowl.findMany(),
      schedules: await prisma.schedule.findMany(),
      oneTimeScheds: await prisma.oneTimeSched.findMany(),
      recurrentSchedules: await prisma.recurrentSchedules.findMany(),
      conditioningActivitySchedules:
        await prisma.conditioningActivitySchedule.findMany(),
      eventGamefowls: await prisma.eventGamefowl.findMany(),
    };

    console.log("Current data retrieved. Creating seed data...");

    // Create initial data if none exists
    if (currentData.handlers.length === 0) {
      console.log("Creating initial handler...");
      const handler = await prisma.handler.create({
        data: {
          username: "admin",
          password: "admin123", // In production, this should be hashed
          first_name: "Admin",
          last_name: "User",
          email: "admin@example.com",
          role: UserRole.admin,
          status: "ACTIVE",
        },
      });
      currentData.handlers = [handler];
    }

    if (currentData.conditioningPrograms.length === 0) {
      console.log("Creating initial conditioning program...");
      const program = await prisma.conditioningProgram.create({
        data: {
          programName: "Standard Conditioning",
          description: "Standard conditioning program for gamefowls",
        },
      });
      currentData.conditioningPrograms = [program];
    }

    // Create events
    if (currentData.events.length === 0) {
      console.log("Creating initial events...");
      const events = await Promise.all([
        prisma.event.create({
          data: {
            eventName: "Three Cock Derby",
            eventType: EventType.THREE_COCK_DERBY,
            ageCategory: AgeCategory.COCK,
            eventDate: new Date("2024-05-15"),
            description: "Annual three cock derby event",
            status: EventStatus.ASSIGNED,
            handlerId: currentData.handlers[0].id,
          },
        }),
        prisma.event.create({
          data: {
            eventName: "Solo Event",
            eventType: EventType.SOLO,
            ageCategory: AgeCategory.STAG,
            eventDate: new Date("2024-06-20"),
            description: "Solo event for stags",
            status: EventStatus.ASSIGNED,
            handlerId: currentData.handlers[0].id,
          },
        }),
      ]);
      currentData.events = events;
    }

    // Create conditioning records
    if (currentData.conditionings.length === 0) {
      console.log("Creating initial conditioning records...");
      const conditioningRecords = await Promise.all([
        prisma.conditioning.create({
          data: {
            eventId: currentData.events[0].id,
            conProgId: currentData.conditioningPrograms[0].id,
            handlerId: currentData.handlers[0].id,
            startDate: new Date("2024-04-15"),
            endDate: new Date("2024-05-14"),
            status: ConditioningStatus.ASSIGNED,
            notes: "Pre-derby conditioning",
          },
        }),
        prisma.conditioning.create({
          data: {
            eventId: currentData.events[1].id,
            conProgId: currentData.conditioningPrograms[0].id,
            handlerId: currentData.handlers[0].id,
            startDate: new Date("2024-05-20"),
            endDate: new Date("2024-06-19"),
            status: ConditioningStatus.ASSIGNED,
            notes: "Pre-solo event conditioning",
          },
        }),
      ]);
      currentData.conditionings = conditioningRecords;
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
