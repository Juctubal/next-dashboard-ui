import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("Exporting database data...");

  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // Export all data from each table
  const tables = [
    "admin",
    "handler",
    "breeder",
    "gamefowl",
    "vaccine",
    "deworming",
    "breeding",
    "sparring",
    "incubation",
    "batch",
    "conditioningProgram",
    "event",
    "conditioning",
    "conditioningGamefowl",
    "schedule",
    "oneTimeSched",
    "recurrentSchedules",
    "conditioningActivity",
    "conditioningActivitySchedule",
    "eventGamefowl",
  ];

  for (const table of tables) {
    try {
      // @ts-ignore - Dynamic access to prisma client
      const data = await prisma[table].findMany();
      fs.writeFileSync(
        path.join(dataDir, `${table}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`Exported ${table} data`);
    } catch (error) {
      console.error(`Error exporting ${table}:`, error);
    }
  }

  console.log("Export complete!");
}

exportData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
