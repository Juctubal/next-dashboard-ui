import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log("Clearing all data...");

    // Delete in order to respect foreign key constraints
    await prisma.eventGamefowl.deleteMany();
    await prisma.conditioningGamefowl.deleteMany();
    await prisma.conditioning.deleteMany();
    await prisma.conditioningActivity.deleteMany();
    await prisma.conditioningProgram.deleteMany();
    await prisma.event.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.incubation.deleteMany();
    await prisma.breeding.deleteMany();
    await prisma.vaccine.deleteMany();
    await prisma.deworming.deleteMany();
    await prisma.sparring.deleteMany();
    await prisma.gamefowl.deleteMany();
    await prisma.recurrentSchedules.deleteMany();
    await prisma.oneTimeSched.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.handler.deleteMany();
    await prisma.breeder.deleteMany();
    await prisma.admin.deleteMany();

    console.log("All data cleared successfully!");
  } catch (error) {
    console.error("Error clearing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
