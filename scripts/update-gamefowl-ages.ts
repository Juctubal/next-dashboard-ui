import { PrismaClient } from "@prisma/client";
import { calculateGamefowlAge } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting gamefowl age update...");

  // Get all gamefowls with a date_hatched
  const gamefowls = await prisma.gamefowl.findMany({
    where: {
      date_hatched: {
        not: null,
      },
    },
  });

  console.log(`Found ${gamefowls.length} gamefowls to update`);

  // Update each gamefowl's age based on date_hatched and sex
  for (const gamefowl of gamefowls) {
    const calculatedAge = calculateGamefowlAge(
      gamefowl.date_hatched,
      gamefowl.sex
    );

    if (calculatedAge !== gamefowl.age) {
      await prisma.gamefowl.update({
        where: { id: gamefowl.id },
        data: { age: calculatedAge },
      });
      console.log(`Updated gamefowl ${gamefowl.id} with age: ${calculatedAge}`);
    }
  }

  console.log("Update completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
