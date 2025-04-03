import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Conditioning Data...");

  // Fetch related data
  const events = await prisma.event.findMany();
  const programs = await prisma.conditioningProgram.findMany();
  const gamefowls = await prisma.gamefowl.findMany();
  const handlers = await prisma.handler.findMany();

  if (
    !events.length ||
    !programs.length ||
    !gamefowls.length ||
    !handlers.length
  ) {
    console.log(
      "Please ensure Event, ConditioningProgram, Gamefowl, and Handler tables have data before running this seed."
    );
    return;
  }

  // Create Conditioning records
  const conditioningData = Array.from({ length: 10 }).map(() => ({
    eventId: faker.helpers.arrayElement(events).id,
    conProgId: faker.helpers.arrayElement(programs).id,
    gamefowlId: faker.helpers.arrayElement(gamefowls).id,
    handlerId: faker.helpers.arrayElement(handlers).id,
    startDate: faker.date.past(),
    endDate: faker.date.future(),
    status: faker.helpers.arrayElement(["PLANNED", "ONGOING", "COMPLETED"]),
  }));

  await prisma.conditioning.createMany({ data: conditioningData });
  console.log("Conditioning Data Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
