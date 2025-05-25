import { PrismaClient } from "@prisma/client";
import { BayesianAnalyzer } from "../src/lib/recommendation/bayesian-analyzer";
import { BayesianUpdater } from "../src/lib/recommendation/bayesian-updater";

const prisma = new PrismaClient();

async function updateBayesianPriorsStandalone() {
  console.log("🧠 Updating Bayesian priors from training data...");

  try {
    const analyzer = new BayesianAnalyzer();
    const updater = new BayesianUpdater(prisma, analyzer);

    // Update all priors based on historical data
    console.log("Analyzing historical data...");
    await updater.updateAllPriors();

    // Get summary of updated priors
    const summary = analyzer.getPriorsSummary();

    console.log("✅ Bayesian priors updated successfully!");
    console.log("\n📊 Prior Summary:");
    console.log(JSON.stringify(summary, null, 2));

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
updateBayesianPriorsStandalone().catch((error) => {
  console.error(error);
  process.exit(1);
});
