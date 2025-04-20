import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.conditioningProgram.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      programName: faker.lorem.words(2),
      description: faker.lorem.sentence(),
    })),
  });

  await prisma.event.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      eventName: faker.company.name(),
      eventType: faker.helpers.arrayElement([
        "TWO_COCK_DERBY",
        "THREE_COCK_DERBY",
        "FOUR_COCK_DERBY",
        "SOLO",
      ]),
      ageCategory: faker.helpers.arrayElement(["STAG", "BULLSTAG", "COCK"]),
      eventDate: faker.date.future(),
      description: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(["PLANNED", "ONGOING", "FINISHED"]),
    })),
  });

  let gamefowls = await prisma.gamefowl.findMany();
  if (gamefowls.length === 0) {
    await prisma.gamefowl.createMany({
      data: Array.from({ length: 5 }).map(() => ({
        name: faker.animal.bird(),
        bloodline: faker.animal.bird(),
        weight: faker.number.float({ min: 1.5, max: 3.5 }),
      })),
    });

    gamefowls = await prisma.gamefowl.findMany();
  }

  await prisma.elo.createMany({
    data: gamefowls.map((gf) => ({
      gamefowlId: gf.id,
    })),
  });

  await prisma.schedule.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      taskName: faker.lorem.word(),
      taskType: faker.helpers.arrayElement(["RECURRING", "ONETIME"]),
      taskCategory: faker.helpers.arrayElement([
        "FEEDING",
        "VACCINATION",
        "DEWORMING",
      ]),
      descript: faker.lorem.sentence(),
    })),
  });

  const createdSchedules = await prisma.schedule.findMany();

  await prisma.oneTimeSched.createMany({
    data: createdSchedules.map((sched) => ({
      schedId: sched.id,
      taskName: faker.lorem.word(),
      taskDate: faker.date.future(),
      time_of_day: faker.date.future(),
    })),
  });

  await prisma.recurrentSchedules.createMany({
    data: createdSchedules.map((sched) => ({
      schedId: sched.id,
      reccurencePattern: faker.helpers.arrayElement([
        "DAILY",
        "WEEKLY",
        "MONTHLY",
      ]),
      taskDate: faker.date.future(),
      time_of_day: faker.date.future(),
    })),
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
