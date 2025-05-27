import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Bloodline characteristics for realistic data generation
const bloodlineCharacteristics = {
  Hatch: { baseElo: 1200, winRate: 0.65, aggression: 0.8, endurance: 0.7 },
  Kelso: { baseElo: 1250, winRate: 0.7, aggression: 0.7, endurance: 0.85 },
  Roundhead: {
    baseElo: 1180,
    winRate: 0.62,
    aggression: 0.85,
    endurance: 0.65,
  },
  Sweater: { baseElo: 1220, winRate: 0.68, aggression: 0.75, endurance: 0.8 },
  Albany: { baseElo: 1190, winRate: 0.64, aggression: 0.7, endurance: 0.75 },
  Lemon: { baseElo: 1170, winRate: 0.6, aggression: 0.65, endurance: 0.7 },
  Butcher: { baseElo: 1240, winRate: 0.69, aggression: 0.9, endurance: 0.6 },
  Grey: { baseElo: 1210, winRate: 0.66, aggression: 0.72, endurance: 0.78 },
  Radio: { baseElo: 1230, winRate: 0.67, aggression: 0.78, endurance: 0.72 },
  McLean: { baseElo: 1200, winRate: 0.65, aggression: 0.73, endurance: 0.77 },
};

const bloodlines = Object.keys(bloodlineCharacteristics);

// Generate gamefowl names
const generateGamefowlName = (bloodline: string, index: number) => {
  const prefixes = [
    "Thunder",
    "Lightning",
    "Storm",
    "Fire",
    "Ice",
    "Shadow",
    "Phoenix",
    "Dragon",
    "Eagle",
    "Hawk",
  ];
  const suffixes = [
    "Strike",
    "Fury",
    "Power",
    "Glory",
    "Pride",
    "Force",
    "Spirit",
    "Heart",
    "Soul",
    "Wing",
  ];
  return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(
    suffixes
  )} ${index}`;
};

async function seedRecommendationData() {
  console.log("🌱 Seeding recommendation training data...");

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("Clearing existing data...");

    // Delete in reverse order of dependencies
    await prisma.recurringTaskCompletion.deleteMany();
    await prisma.recurrentSchedules.deleteMany();
    await prisma.oneTimeSched.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.eventResult.deleteMany();
    await prisma.eventGamefowl.deleteMany();
    await prisma.sparring.deleteMany();
    await prisma.conditioningActivitySchedule.deleteMany();
    await prisma.conditioningGamefowl.deleteMany();
    await prisma.conditioning.deleteMany();
    await prisma.vaccine.deleteMany();
    await prisma.deworming.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.incubation.deleteMany();
    await prisma.breeding.deleteMany();
    await prisma.event.deleteMany();
    await prisma.gamefowl.deleteMany();
    await prisma.conditioningActivity.deleteMany();
    await prisma.conditioningProgram.deleteMany();
    await prisma.handler.deleteMany();
    await prisma.breeder.deleteMany();
    await prisma.admin.deleteMany();

    // Create handlers
    console.log("Creating handlers...");
    const handlers = await Promise.all([
      prisma.handler.create({
        data: {
          username: "john_handler",
          password: "password123",
          first_name: "John",
          last_name: "Smith",
          email: "john@example.com",
          role: "handler",
          status: "ACTIVE",
        },
      }),
      prisma.handler.create({
        data: {
          username: "mike_handler",
          password: "password123",
          first_name: "Mike",
          last_name: "Johnson",
          email: "mike@example.com",
          role: "handler",
          status: "ACTIVE",
        },
      }),
    ]);

    // Create conditioning programs
    console.log("Creating conditioning programs...");
    const conditioningPrograms = await Promise.all([
      prisma.conditioningProgram.create({
        data: {
          programName: "21-Day Keep",
          description:
            "Standard 21-day conditioning program for derby preparation",
        },
      }),
      prisma.conditioningProgram.create({
        data: {
          programName: "14-Day Power Keep",
          description:
            "Intensive 14-day program focused on power and aggression",
        },
      }),
      prisma.conditioningProgram.create({
        data: {
          programName: "28-Day Endurance Keep",
          description: "Extended program for building stamina and endurance",
        },
      }),
    ]);

    // Create gamefowls with varied characteristics
    console.log("Creating gamefowls...");
    const gamefowls = [];
    let gamefowlIndex = 1;

    for (const bloodline of bloodlines) {
      const characteristics =
        bloodlineCharacteristics[
          bloodline as keyof typeof bloodlineCharacteristics
        ];

      // Create 20 gamefowls per bloodline (200 total)
      for (let i = 0; i < 20; i++) {
        const ageInMonths = faker.number.int({ min: 8, max: 36 });
        const isStag = ageInMonths < 12;
        const isBullstag = ageInMonths >= 12 && ageInMonths < 18;

        // Add variance to base Elo
        const eloVariance = faker.number.int({ min: -100, max: 100 });
        const currentElo = characteristics.baseElo + eloVariance;

        const gamefowl = await prisma.gamefowl.create({
          data: {
            name: generateGamefowlName(bloodline, gamefowlIndex++),
            bloodline: bloodline,
            date_hatched: faker.date.past({ years: ageInMonths / 12 }),
            status: faker.helpers.arrayElement([
              "IDLE",
              "COMPETING",
              "CONDITIONING",
            ]),
            age: isStag ? "STAG" : isBullstag ? "BULLSTAG" : "COCK",
            sex: "MALE",
            eloRating: currentElo,
          },
        });
        gamefowls.push(gamefowl);
      }
    }

    // Create past events with results (for training data)
    console.log("Creating past events with results...");
    const pastEvents = [];

    for (let i = 0; i < 30; i++) {
      const event = await prisma.event.create({
        data: {
          eventName: `${faker.location.city()} Derby ${i + 1}`,
          eventType: faker.helpers.arrayElement([
            "THREE_COCK_DERBY",
            "FOUR_COCK_DERBY",
            "FIVE_COCK_DERBY",
          ]),
          ageCategory: faker.helpers.arrayElement([
            "STAG",
            "BULLSTAG",
            "COCK",
            "ANY",
          ]),
          eventDate: faker.date.past({ years: 1 }),
          description: faker.lorem.sentence(),
          status: "FINISHED",
          handlerId: faker.helpers.arrayElement(handlers).id,
        },
      });
      pastEvents.push(event);
    }

    // Create sparring records
    console.log("Creating sparring records...");
    for (let i = 0; i < 500; i++) {
      const gamefowl1 = faker.helpers.arrayElement(gamefowls);
      const gamefowl2 = faker.helpers.arrayElement(
        gamefowls.filter((g) => g.id !== gamefowl1.id)
      );

      // Calculate win probability based on Elo difference
      const eloDiff = gamefowl1.eloRating - gamefowl2.eloRating;
      const expectedScore1 = 1 / (1 + Math.pow(10, -eloDiff / 400));

      // Determine winner with some randomness
      const random = Math.random();
      const gamefowl1Wins =
        random < expectedScore1 + (Math.random() * 0.2 - 0.1); // Add some upset potential

      const winner = gamefowl1Wins ? gamefowl1 : gamefowl2;
      const loser = gamefowl1Wins ? gamefowl2 : gamefowl1;

      // Calculate Elo changes
      const K = 32; // K-factor
      const winnerEloChange = Math.round(K * (1 - expectedScore1));
      const loserEloChange = -winnerEloChange;

      await prisma.sparring.create({
        data: {
          gamefowl_1_Id: gamefowl1.id,
          gamefowl_2_Id: gamefowl2.id,
          winnerId: winner.id,
          loserId: loser.id,
          winner_elo_change: winnerEloChange,
          loser_elo_change: loserEloChange,
          sparringDate: faker.date.past({ years: 1 }),
          notes: faker.lorem.sentence(),
        },
      });

      // Update Elo ratings
      await prisma.gamefowl.update({
        where: { id: winner.id },
        data: { eloRating: { increment: winnerEloChange } },
      });

      await prisma.gamefowl.update({
        where: { id: loser.id },
        data: { eloRating: { increment: loserEloChange } },
      });
    }

    // Create event participations and results
    console.log("Creating event participations and results...");
    for (const event of pastEvents) {
      const eventType = event.eventType;
      const numGamefowls =
        eventType === "THREE_COCK_DERBY"
          ? 3
          : eventType === "FOUR_COCK_DERBY"
          ? 4
          : 5;

      // Select appropriate gamefowls for the event
      const eligibleGamefowls = gamefowls.filter((g) => {
        if (event.ageCategory === "ANY") return true;
        return g.age === event.ageCategory;
      });

      // For derby events, one participant enters the required number of gamefowls
      if (eligibleGamefowls.length < numGamefowls) {
        console.log(
          `Not enough eligible gamefowls for event ${event.eventName}. Skipping...`
        );
        continue;
      }

      // Select the exact number of gamefowls needed for this event
      const selectedGamefowls = faker.helpers.arrayElements(
        eligibleGamefowls,
        numGamefowls
      );

      // Assign gamefowls to event
      for (const gamefowl of selectedGamefowls) {
        await prisma.eventGamefowl.create({
          data: {
            eventId: event.id,
            gamefowlId: gamefowl.id,
          },
        });

        // Create results based on bloodline characteristics
        const characteristics =
          bloodlineCharacteristics[
            gamefowl.bloodline as keyof typeof bloodlineCharacteristics
          ];
        const winProbability =
          characteristics.winRate + (Math.random() * 0.2 - 0.1);

        const result =
          Math.random() < winProbability
            ? "WIN"
            : Math.random() < 0.1
            ? "DRAW"
            : "LOSS";

        await prisma.eventResult.create({
          data: {
            eventId: event.id,
            gamefowlId: gamefowl.id,
            result: result as any,
            notes: faker.lorem.sentence(),
          },
        });
      }
    }

    // Create breeding records
    console.log("Creating breeding records...");
    const maleGamefowls = gamefowls.filter((g) => g.sex === "MALE");

    // Create some female gamefowls for breeding
    const femaleGamefowls = [];
    for (let i = 0; i < 50; i++) {
      const bloodline = faker.helpers.arrayElement(bloodlines);
      const female = await prisma.gamefowl.create({
        data: {
          name: `Hen ${i + 1}`,
          bloodline: bloodline,
          date_hatched: faker.date.past({ years: 2 }),
          status: "BREEDING",
          age: "HEN",
          sex: "FEMALE",
          eloRating: 1000, // Hens don't fight, so default Elo
        },
      });
      femaleGamefowls.push(female);
    }

    for (let i = 0; i < 100; i++) {
      const sire = faker.helpers.arrayElement(maleGamefowls);
      const dam = faker.helpers.arrayElement(femaleGamefowls);

      await prisma.breeding.create({
        data: {
          sireId: sire.id,
          damId: dam.id,
          startDate: faker.date.past({ years: 1 }),
          endDate: faker.date.recent({ days: 30 }),
          status: "FINISHED",
          notes: `${sire.bloodline} x ${dam.bloodline} cross`,
        },
      });
    }

    // Create conditioning records
    console.log("Creating conditioning records...");

    // Create events specifically for conditioning (35 total to match conditioning records)
    const conditioningEvents = [];
    for (let i = 0; i < 35; i++) {
      const eventDate = faker.date.between({
        from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days future
      });

      const event = await prisma.event.create({
        data: {
          eventName: `${faker.location.city()} Derby - Conditioning ${i + 1}`,
          eventType: faker.helpers.arrayElement([
            "THREE_COCK_DERBY",
            "FOUR_COCK_DERBY",
            "FIVE_COCK_DERBY",
          ]),
          ageCategory: faker.helpers.arrayElement([
            "STAG",
            "BULLSTAG",
            "COCK",
            "ANY",
          ]),
          eventDate: eventDate,
          description: faker.lorem.sentence(),
          status: "ASSIGNED",
          handlerId: faker.helpers.arrayElement(handlers).id,
        },
      });
      conditioningEvents.push(event);
    }

    // Create one conditioning record per event
    for (const event of conditioningEvents) {
      const program = faker.helpers.arrayElement(conditioningPrograms);
      const handler = faker.helpers.arrayElement(handlers);

      // Calculate start date based on event date
      const eventDate = new Date(event.eventDate);
      const duration = program.programName.includes("21")
        ? 21
        : program.programName.includes("14")
        ? 14
        : 28;

      // Start conditioning program before the event
      const daysBeforeEvent = duration + faker.number.int({ min: 3, max: 10 });
      const startDate = new Date(
        eventDate.getTime() - daysBeforeEvent * 24 * 60 * 60 * 1000
      );
      const endDate = new Date(
        startDate.getTime() + duration * 24 * 60 * 60 * 1000
      );

      // Determine if this conditioning is completed
      const isCompleted = endDate < new Date();

      const conditioning = await prisma.conditioning.create({
        data: {
          eventId: event.id, // Every conditioning is linked to an event
          conProgId: program.id,
          handlerId: handler.id,
          startDate: startDate,
          endDate: endDate,
          status: isCompleted ? "COMPLETED" : "ASSIGNED",
          notes: `Conditioning program for ${event.eventName}`,
        },
      });

      // Get eligible gamefowls for this event
      const eventType = event.eventType;
      const numGamefowls =
        eventType === "THREE_COCK_DERBY"
          ? 3
          : eventType === "FOUR_COCK_DERBY"
          ? 4
          : 5;

      const eligibleGamefowls = gamefowls.filter((g) => {
        if (g.status === "DECEASED") return false;
        if (event.ageCategory === "ANY") return true;
        return g.age === event.ageCategory;
      });

      // Select gamefowls for conditioning
      const conditioningGamefowls = faker.helpers.arrayElements(
        eligibleGamefowls,
        Math.min(numGamefowls, eligibleGamefowls.length)
      );

      for (const gamefowl of conditioningGamefowls) {
        await prisma.conditioningGamefowl.create({
          data: {
            conditioningId: conditioning.id,
            gamefowlId: gamefowl.id,
          },
        });

        // Update gamefowl status based on conditioning status
        if (isCompleted) {
          // Conditioning is completed and linked to event -> COMPETING
          await prisma.gamefowl.update({
            where: { id: gamefowl.id },
            data: { status: "COMPETING" },
          });
        } else {
          // Conditioning is ongoing -> CONDITIONING
          await prisma.gamefowl.update({
            where: { id: gamefowl.id },
            data: { status: "CONDITIONING" },
          });
        }
      }
    }

    // Create upcoming events for recommendations
    console.log("Creating upcoming events...");
    for (let i = 0; i < 10; i++) {
      await prisma.event.create({
        data: {
          eventName: `${faker.location.city()} Upcoming Derby ${i + 1}`,
          eventType: faker.helpers.arrayElement([
            "THREE_COCK_DERBY",
            "FOUR_COCK_DERBY",
            "FIVE_COCK_DERBY",
          ]),
          ageCategory: faker.helpers.arrayElement([
            "STAG",
            "BULLSTAG",
            "COCK",
            "ANY",
          ]),
          eventDate: faker.date.future({ years: 0.5 }),
          description: faker.lorem.sentence(),
          status: "ASSIGNED",
          handlerId: faker.helpers.arrayElement(handlers).id,
        },
      });
    }

    console.log("✅ Recommendation training data seeded successfully!");

    // Get counts for summary
    const totalConditioning = await prisma.conditioning.count();
    const totalEvents = await prisma.event.count();

    console.log(`Created:
      - ${gamefowls.length + femaleGamefowls.length} gamefowls
      - ${pastEvents.length} past events with results
      - 500 sparring records
      - 100 breeding records
      - ${totalConditioning} conditioning records (all linked to events, 1:1 relationship)
      - ${totalEvents} total events (${pastEvents.length} past, ${
      conditioningEvents.length
    } with conditioning, 10 upcoming)`);
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRecommendationData().catch((error) => {
  console.error(error);
  process.exit(1);
});
