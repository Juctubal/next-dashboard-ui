import { PrismaClient } from "@prisma/client";
import { BayesianAnalyzer } from "../src/lib/recommendation/bayesian-analyzer";
import { BayesianUpdater } from "../src/lib/recommendation/bayesian-updater";

const prisma = new PrismaClient();

async function updateBayesianPriorsStandalone() {
  console.log(
    "🧠 Updating ALL Bayesian priors from training data (standalone mode)..."
  );
  console.log(
    "This includes: performance, breeding, conditioning, and health data\n"
  );

  try {
    const analyzer = new BayesianAnalyzer();
    const updater = new BayesianUpdater(prisma, analyzer);

    console.log("📊 Analyzing data and updating priors...");

    // Update all priors
    await updater.updateAllPriors();

    // Get summary
    const summary = analyzer.getPriorsSummary();

    console.log("\n✅ Bayesian priors updated successfully!");

    // Display comprehensive summary
    console.log("\n📊 Performance Insights:");
    console.log("\nTop 5 Performing Bloodlines:");
    summary.topBloodlines.slice(0, 5).forEach((item, i) => {
      console.log(
        `${i + 1}. ${item.bloodline}: ${(item.winRate * 100).toFixed(
          1
        )}% win rate`
      );
    });

    console.log("\nTop 5 Breeding Combinations:");
    summary.bestCombinations.slice(0, 5).forEach((item, i) => {
      console.log(
        `${i + 1}. ${item.combination}: ${(item.successRate * 100).toFixed(
          1
        )}% success`
      );
    });

    if (summary.effectivePrograms && summary.effectivePrograms.length > 0) {
      console.log("\nTop Conditioning Programs:");
      summary.effectivePrograms.slice(0, 3).forEach((item, i) => {
        console.log(
          `${i + 1}. Program ${item.program}: ${(
            item.avgEffectiveness * 100
          ).toFixed(1)}% effectiveness`
        );
      });
    }

    // Display health insights
    if (summary.healthInsights) {
      console.log("\n🏥 Health Insights:");

      if (summary.healthInsights.vaccineResponsiveness.length > 0) {
        console.log("\nTop 5 Vaccine-Responsive Bloodlines:");
        summary.healthInsights.vaccineResponsiveness
          .slice(0, 5)
          .forEach((item, i) => {
            console.log(
              `${i + 1}. ${item.bloodline}: ${(item.avgResponse * 100).toFixed(
                1
              )}% response rate`
            );
          });
      }

      if (summary.healthInsights.dewormingResponsiveness.length > 0) {
        console.log("\nTop 5 Deworming-Responsive Bloodlines:");
        summary.healthInsights.dewormingResponsiveness
          .slice(0, 5)
          .forEach((item, i) => {
            console.log(
              `${i + 1}. ${item.bloodline}: ${(
                item.effectiveness * 100
              ).toFixed(1)}% effectiveness`
            );
          });
      }

      if (summary.healthInsights.healthPerformanceCorrelation.length > 0) {
        console.log("\nTop 5 Health-Performance Correlations:");
        summary.healthInsights.healthPerformanceCorrelation
          .slice(0, 5)
          .forEach((item, i) => {
            console.log(
              `${i + 1}. ${item.bloodline}: ${(item.correlation * 100).toFixed(
                1
              )}% correlation`
            );
          });
      }
    }

    // Display training data statistics
    const stats = await prisma.$transaction([
      prisma.gamefowl.count(),
      prisma.event.count({ where: { status: "FINISHED" } }),
      prisma.sparring.count(),
      prisma.breeding.count(),
      prisma.eventResult.count(),
      prisma.vaccine.count(),
      prisma.deworming.count(),
      prisma.conditioning.count({ where: { status: "COMPLETED" } }),
    ]);

    console.log(`
📈 Training Data Statistics:
- Total Gamefowls: ${stats[0]}
- Finished Events: ${stats[1]}
- Sparring Records: ${stats[2]}
- Breeding Records: ${stats[3]}
- Event Results: ${stats[4]}
- Vaccine Records: ${stats[5]}
- Deworming Records: ${stats[6]}
- Completed Conditioning Programs: ${stats[7]}
    `);

    console.log(
      "\n🎯 All priors (performance, breeding, conditioning, and health) have been updated!"
    );

    // Export the priors (optional - you could save to a file or database)
    const exportedPriors = analyzer.exportPriors();
    console.log(
      "\n💾 Priors have been calculated. In production, these would be saved to persistent storage."
    );
  } catch (error) {
    console.error("\n❌ Error updating priors:", error);
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
