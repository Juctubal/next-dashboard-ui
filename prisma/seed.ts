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

    // Now let's recreate the exact same data

    // Create Admins
    for (const admin of currentData.admins) {
      await prisma.admin.upsert({
        where: { username: admin.username },
        update: {},
        create: {
          id: admin.id,
          username: admin.username,
        },
      });
    }

    // Create Handlers
    for (const handler of currentData.handlers) {
      await prisma.handler.upsert({
        where: { username: handler.username },
        update: {},
        create: {
          id: handler.id,
          username: handler.username,
          password: handler.password,
          first_name: handler.first_name,
          middle_name: handler.middle_name,
          last_name: handler.last_name,
          email: handler.email,
          img: handler.img,
          phone: handler.phone,
          role: handler.role,
          status: handler.status,
          createdAt: handler.createdAt,
          isArchived: handler.isArchived,
        },
      });
    }

    // Create Breeders
    for (const breeder of currentData.breeders) {
      await prisma.breeder.upsert({
        where: { username: breeder.username },
        update: {},
        create: {
          id: breeder.id,
          username: breeder.username,
          password: breeder.password,
          first_name: breeder.first_name,
          middle_name: breeder.middle_name,
          last_name: breeder.last_name,
          email: breeder.email,
          img: breeder.img,
          phone: breeder.phone,
          role: breeder.role,
          status: breeder.status,
          createdAt: breeder.createdAt,
          isArchived: breeder.isArchived,
        },
      });
    }

    // Create Gamefowls
    for (const gamefowl of currentData.gamefowls) {
      await prisma.gamefowl.create({
        data: {
          id: gamefowl.id,
          name: gamefowl.name,
          bloodline: gamefowl.bloodline,
          sex: gamefowl.sex,
          date_hatched: gamefowl.date_hatched,
          date_sold: gamefowl.date_sold,
          sireId: gamefowl.sireId,
          damId: gamefowl.damId,
          batchId: gamefowl.batchId,
          createdAt: gamefowl.createdAt,
          img: gamefowl.img,
          age: gamefowl.age,
          isArchived: gamefowl.isArchived,
          eloRating: gamefowl.eloRating,
        },
      });
    }

    // Create Vaccines
    for (const vaccine of currentData.vaccines) {
      await prisma.vaccine.create({
        data: {
          id: vaccine.id,
          gamefowlId: vaccine.gamefowlId,
          vaccinationDate: vaccine.vaccinationDate,
          notes: vaccine.notes,
          name: vaccine.name,
          isArchived: vaccine.isArchived,
        },
      });
    }

    // Create Dewormings
    for (const deworming of currentData.dewormings) {
      await prisma.deworming.create({
        data: {
          id: deworming.id,
          gamefowlId: deworming.gamefowlId,
          dewormDate: deworming.dewormDate,
          notes: deworming.notes,
          name: deworming.name,
          isArchived: deworming.isArchived,
        },
      });
    }

    // Create Breedings
    for (const breeding of currentData.breedings) {
      await prisma.breeding.create({
        data: {
          id: breeding.id,
          sireId: breeding.sireId,
          damId: breeding.damId,
          notes: breeding.notes,
          status: breeding.status,
          endDate: breeding.endDate,
          startDate: breeding.startDate,
          isArchived: breeding.isArchived,
        },
      });
    }

    // Create Sparrings
    for (const sparring of currentData.sparrings) {
      await prisma.sparring.create({
        data: {
          id: sparring.id,
          gamefowl_1_Id: sparring.gamefowl_1_Id,
          gamefowl_2_Id: sparring.gamefowl_2_Id,
          winnerId: sparring.winnerId,
          loserId: sparring.loserId,
          winner_elo_change: sparring.winner_elo_change,
          loser_elo_change: sparring.loser_elo_change,
          sparringDate: sparring.sparringDate,
          notes: sparring.notes,
        },
      });
    }

    // Create Incubations
    for (const incubation of currentData.incubations) {
      await prisma.incubation.create({
        data: {
          id: incubation.id,
          incStart: incubation.incStart,
          incEnd: incubation.incEnd,
          status: incubation.status,
          eggCount: incubation.eggCount,
          breedingId: incubation.breedingId,
          isArchived: incubation.isArchived,
        },
      });
    }

    // Create Batches
    for (const batch of currentData.batches) {
      await prisma.batch.create({
        data: {
          id: batch.id,
          hatchRate: batch.hatchRate,
          dateHatched: batch.dateHatched,
          incubate_id: batch.incubate_id,
        },
      });
    }

    // Create ConditioningPrograms
    for (const program of currentData.conditioningPrograms) {
      await prisma.conditioningProgram.create({
        data: {
          id: program.id,
          programName: program.programName,
          description: program.description,
          createdAt: program.createdAt,
          updatedAt: program.updatedAt,
        },
      });
    }

    // Create ConditioningActivities
    for (const activity of currentData.conditioningActivities) {
      await prisma.conditioningActivity.create({
        data: {
          id: activity.id,
          name: activity.name,
          description: activity.description,
          programId: activity.programId,
          createdAt: activity.createdAt,
          updatedAt: activity.updatedAt,
        },
      });
    }

    // Create Events
    for (const event of currentData.events) {
      await prisma.event.create({
        data: {
          id: event.id,
          eventName: event.eventName,
          eventType: event.eventType,
          ageCategory: event.ageCategory,
          eventDate: event.eventDate,
          description: event.description,
          status: event.status,
          handlerId: event.handlerId,
        },
      });
    }

    // Create Conditionings
    for (const conditioning of currentData.conditionings) {
      await prisma.conditioning.create({
        data: {
          id: conditioning.id,
          eventId: conditioning.eventId,
          conProgId: conditioning.conProgId,
          handlerId: conditioning.handlerId,
          startDate: conditioning.startDate,
          endDate: conditioning.endDate,
          status: conditioning.status,
          notes: conditioning.notes,
        },
      });
    }

    // Create ConditioningGamefowls
    for (const cg of currentData.conditioningGamefowls) {
      await prisma.conditioningGamefowl.create({
        data: {
          id: cg.id,
          conditioningId: cg.conditioningId,
          gamefowlId: cg.gamefowlId,
        },
      });
    }

    // Create Schedules
    for (const schedule of currentData.schedules) {
      await prisma.schedule.create({
        data: {
          id: schedule.id,
          taskName: schedule.taskName,
          taskType: schedule.taskType,
          taskCategory: schedule.taskCategory,
          descript: schedule.descript,
          staffId: schedule.staffId,
          staffType: schedule.staffType,
          status: schedule.status,
        },
      });
    }

    // Create OneTimeScheds
    for (const ots of currentData.oneTimeScheds) {
      await prisma.oneTimeSched.create({
        data: {
          id: ots.id,
          schedId: ots.schedId,
          taskName: ots.taskName,
          taskDate: ots.taskDate,
          time_of_day: ots.time_of_day,
        },
      });
    }

    // Create RecurrentSchedules
    for (const rs of currentData.recurrentSchedules) {
      await prisma.recurrentSchedules.create({
        data: {
          id: rs.id,
          schedId: rs.schedId,
          reccurencePattern: rs.reccurencePattern,
          time_of_day: rs.time_of_day,
          startDate: rs.startDate,
          endDate: rs.endDate,
          weekDays: rs.weekDays,
        },
      });
    }

    // Create ConditioningActivitySchedules
    for (const cas of currentData.conditioningActivitySchedules) {
      await prisma.conditioningActivitySchedule.create({
        data: {
          id: cas.id,
          conditioningId: cas.conditioningId,
          activityId: cas.activityId,
          date: cas.date,
          createdAt: cas.createdAt,
          notes: cas.notes,
          status: cas.status,
          timeOfDay: cas.timeOfDay,
          updatedAt: cas.updatedAt,
        },
      });
    }

    // Create EventGamefowls
    for (const eg of currentData.eventGamefowls) {
      await prisma.eventGamefowl.create({
        data: {
          id: eg.id,
          eventId: eg.eventId,
          gamefowlId: eg.gamefowlId,
        },
      });
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
