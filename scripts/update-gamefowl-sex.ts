import { PrismaClient, GamefowlSex } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get all gamefowl records
  const gamefowls = await prisma.gamefowl.findMany({
    where: {
      sex: null,
    },
  });

  console.log(`Found ${gamefowls.length} gamefowls to update`);

  // Update each gamefowl
  for (const gamefowl of gamefowls) {
    // Determine sex based on age
    let sex: GamefowlSex;
    if (
      gamefowl.age === "COCK" ||
      gamefowl.age === "STAG" ||
      gamefowl.age === "BULLSTAG"
    ) {
      sex = GamefowlSex.MALE;
    } else {
      sex = GamefowlSex.FEMALE;
    }

    // Update the gamefowl record
    await prisma.gamefowl.update({
      where: { id: gamefowl.id },
      data: { sex },
    });

    console.log(`Updated gamefowl ${gamefowl.id} with sex: ${sex}`);
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
