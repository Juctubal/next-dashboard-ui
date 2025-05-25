import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateBayesianPriors() {
  console.log("🧠 Updating Bayesian priors from training data...");

  try {
    // Call the API endpoint to update priors
    const response = await fetch(
      "http://localhost:3000/api/recommendations/update-priors",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update priors: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Bayesian priors updated successfully!");
    console.log("Updated priors:", result.data);

    // Display some statistics
    const stats = await prisma.$transaction([
      prisma.gamefowl.count(),
      prisma.event.count({ where: { status: "FINISHED" } }),
      prisma.sparring.count(),
      prisma.breeding.count(),
      prisma.eventResult.count(),
    ]);

    console.log(`
📊 Training Data Statistics:
- Total Gamefowls: ${stats[0]}
- Finished Events: ${stats[1]}
- Sparring Records: ${stats[2]}
- Breeding Records: ${stats[3]}
- Event Results: ${stats[4]}
    `);
  } catch (error) {
    console.error("Error updating priors:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateBayesianPriors().catch((error) => {
  console.error(error);
  process.exit(1);
});
