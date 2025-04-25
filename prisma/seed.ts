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
  console.log("Seeding database...");

  // Seed Admin
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin" },
  });

  // Seed Handlers
  const handlers = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const username = faker.internet.userName();
      return prisma.handler.upsert({
        where: { username },
        update: {},
        create: {
          username,
          password: faker.internet.password(),
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          email: faker.internet.email(),
          img: faker.image.avatar(),
          phone: faker.phone.number(),
          role: UserRole.handler,
          status: "ACTIVE",
          createdAt: new Date(),
        },
      });
    })
  );

  // Seed Breeders
  const breeders = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const username = faker.internet.userName();
      return prisma.breeder.upsert({
        where: { username },
        update: {},
        create: {
          username,
          password: faker.internet.password(),
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          email: faker.internet.email(),
          img: faker.image.avatar(),
          phone: faker.phone.number(),
          role: UserRole.breeder,
          status: "ACTIVE",
          createdAt: new Date(),
        },
      });
    })
  );

  // Seed Gamefowls
  const gamefowls = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      return prisma.gamefowl.create({
        data: {
          name: faker.animal.bird(),
          bloodline: faker.lorem.word(),
          sex: faker.helpers.arrayElement(["MALE", "FEMALE"]),
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
      status: "ONGOING",
      eggCount: faker.number.int({ min: 10, max: 50 }),
    },
  });

  // Seed Batch
  await prisma.batch.create({
    data: {
      incubate_id: incubation.id,
      hatchRate: faker.number.float({ min: 50, max: 80 }),
      dateHatched: faker.date.recent(),
    },
  });

  // Seed ConditioningPrograms
  const conditioningPrograms = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      return prisma.conditioningProgram.create({
        data: {
          programName: faker.helpers.arrayElement([
            "Pre-Derby Conditioning",
            "Post-Derby Recovery",
            "Weight Management",
            "Strength Building",
            "Endurance Training",
            "Speed Enhancement",
            "Combat Readiness",
            "Peak Performance",
          ]),
          description: faker.lorem.paragraph(),
        },
      });
    })
  );

  // Seed Events
  const events = await Promise.all(
    Array.from({ length: 3 }).map(async () => {
      return prisma.event.create({
        data: {
          eventName: faker.helpers.arrayElement([
            "Summer Derby 2023",
            "Winter Championship 2023",
            "Spring Invitational 2024",
            "Fall Classic 2023",
            "Regional Championship 2024",
          ]),
          eventType: faker.helpers.arrayElement([
            "TWO_COCK_DERBY",
            "THREE_COCK_DERBY",
            "FOUR_COCK_DERBY",
            "FIVE_COCK_DERBY",
            "SOLO",
            "OTHER",
          ]),
          ageCategory: faker.helpers.arrayElement([
            "STAG",
            "BULLSTAG",
            "COCK",
            "ANY",
          ]),
          eventDate: faker.date.future(),
          description: faker.lorem.paragraph(),
          status: faker.helpers.arrayElement([
            "PLANNED",
            "ONGOING",
            "FINISHED",
          ]),
        },
      });
    })
  );

  // Seed Conditioning
  if (gamefowls.length >= 2 && handlers.length > 0 && events.length > 0) {
    await Promise.all(
      Array.from({ length: 5 }).map(async () => {
        const randomGamefowl =
          gamefowls[Math.floor(Math.random() * gamefowls.length)];
        const randomHandler =
          handlers[Math.floor(Math.random() * handlers.length)];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const randomProgram =
          conditioningPrograms[
            Math.floor(Math.random() * conditioningPrograms.length)
          ];

        const startDate = faker.date.past();
        const endDate = new Date(startDate);
        endDate.setDate(
          endDate.getDate() + faker.number.int({ min: 7, max: 30 })
        );

        return prisma.conditioning.create({
          data: {
            eventId: randomEvent.id,
            conProgId: randomProgram.id,
            handlerId: randomHandler.id,
            startDate: startDate,
            endDate: endDate,
            status: faker.helpers.arrayElement([
              "PLANNED",
              "ONGOING",
              "COMPLETED",
            ]),
            notes: faker.lorem.sentence(),
            gamefowls: {
              create: {
                gamefowlId: randomGamefowl.id,
              },
            },
          },
        });
      })
    );
  }

  // Seed Schedules
  for (const staff of [...handlers, ...breeders]) {
    // Create 2-3 schedules for each staff member
    const numSchedules = faker.number.int({ min: 2, max: 3 });

    for (let i = 0; i < numSchedules; i++) {
      const schedule = await prisma.schedule.create({
        data: {
          taskName: faker.helpers.arrayElement([
            "Feeding",
            "Vaccination",
            "Health Check",
            "Training",
          ]),
          taskType: faker.helpers.arrayElement(["RECURRING", "ONETIME"]),
          taskCategory: faker.helpers.arrayElement([
            "FEEDING",
            "VACCINATION",
            "DEWORMING",
          ]),
          descript: faker.lorem.sentence(),
          staffId: staff.id,
          staffType: staff.role,
        },
      });

      // Add 2-3 one-time schedules
      const numOneTime = faker.number.int({ min: 2, max: 3 });
      for (let j = 0; j < numOneTime; j++) {
        await prisma.oneTimeSched.create({
          data: {
            schedId: schedule.id,
            taskName: faker.lorem.words(2),
            taskDate: faker.date.future(),
            time_of_day: faker.date.future().toISOString(),
          },
        });
      }

      // Add 1-2 recurrent schedules
      const numRecurrent = faker.number.int({ min: 1, max: 2 });
      for (let j = 0; j < numRecurrent; j++) {
        await prisma.recurrentSchedules.create({
          data: {
            schedId: schedule.id,
            reccurencePattern: faker.helpers.arrayElement([
              "DAILY",
              "WEEKLY",
              "MONTHLY",
              "OTHER",
            ]),
            time_of_day: faker.helpers.arrayElement([
              "MORNING",
              "AFTERNOON",
              "EVENING",
            ]),
            startDate: faker.date.future(),
            endDate: faker.date.future(),
            weekDays: faker.helpers.arrayElement([
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
              "SUNDAY",
            ]),
          },
        });
      }
    }
  }

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
