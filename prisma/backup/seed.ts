import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Admin
  const admin = await prisma.admin.create({
    data: { username: "admin" },
  });

  // Seed Handlers
  const handlers = await prisma.handler.createMany({
    data: Array.from({ length: 5 }, () => ({
      id: faker.string.uuid(),
      username: faker.internet.userName(),
      password: faker.internet.password(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      img: faker.image.avatar(),
      phone: faker.phone.number(),
      role: "HANDLER",
      status: "ACTIVE",
      createdAt: new Date(),
    })),
  });

  // Seed Breeders
  const breeders = await prisma.breeder.createMany({
    data: Array.from({ length: 5 }, () => ({
      id: faker.string.uuid(),
      username: faker.internet.userName(),
      password: faker.internet.password(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      img: faker.image.avatar(),
      phone: faker.phone.number(),
      role: "BREEDER",
      status: "ACTIVE",
      createdAt: new Date(),
    })),
  });

  // Seed Gamefowls
  const gamefowls = await Promise.all(
    Array.from({ length: 10 }, async () => {
      return prisma.gamefowl.create({
        data: {
          name: faker.animal.bird(),
          bloodline: faker.lorem.word(),
          date_hatched: faker.date.past(),
          date_sold: faker.datatype.boolean() ? faker.date.recent() : null,
          createdAt: new Date(),
        },
      });
    })
  );

  // Seed Vaccines
  await prisma.vaccine.createMany({
    data: gamefowls.map((g) => ({
      gamefowlId: g.id,
      vaccinationDate: faker.date.recent(),
      notes: faker.lorem.sentence(),
    })),
  });

  // Seed Deworming
  await prisma.deworming.createMany({
    data: gamefowls.map((g) => ({
      gamefowlId: g.id,
      dewormDate: faker.date.recent(),
      notes: faker.lorem.sentence(),
    })),
  });

  // Seed Breeding
  if (gamefowls.length >= 2) {
    await prisma.breeding.create({
      data: {
        sireId: gamefowls[0].id,
        damId: gamefowls[1].id,
        notes: faker.lorem.sentence(),
        status: "ONGOING",
      },
    });
  }

  // Seed Sparring
  if (gamefowls.length >= 2) {
    await prisma.sparring.create({
      data: {
        gamefowl_1_Id: gamefowls[0].id,
        gamefowl_2_Id: gamefowls[1].id,
        winnerId: gamefowls[0].id,
        loserId: gamefowls[1].id,
        winner_elo_change: 10,
        loser_elo_change: -10,
        sparringDate: faker.date.recent(),
        notes: faker.lorem.sentence(),
      },
    });
  }

  // Seed Incubation
  const incubation = await prisma.incubation.create({
    data: {
      incStart: faker.date.past(),
      incEnd: faker.date.recent(),
      turningSched: faker.date.future(),
      status: "ONGOING",
    },
  });

  // Seed Batch
  await prisma.batch.create({
    data: {
      incubate_sched_id: incubation.id,
      eggCount: faker.number.int({ min: 10, max: 50 }),
      fertilityRate: faker.number.float({ min: 60, max: 90 }),
      hatchRate: faker.number.float({ min: 50, max: 80 }),
      dateHatched: faker.date.recent(),
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
