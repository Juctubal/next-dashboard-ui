import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateBayesianPriors() {
  console.log("🧠 Updating ALL Bayesian priors from training data...");
  console.log(
    "This includes: performance, breeding, conditioning, and health data\n"
  );

  try {
    // Call the API endpoint to update priors
    console.log("📡 Calling API endpoint...");
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
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          `API returned HTML instead of JSON. Make sure:\n` +
            `1. Your Next.js dev server is running (npm run dev)\n` +
            `2. The server is running on port 3000\n` +
            `3. The API route exists at /api/recommendations/update-priors`
        );
      }
      throw new Error(`Failed to update priors: ${response.statusText}`);
    }

    const text = await response.text();
    let result;

    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("Response body:", text);
      throw new Error(
        "Failed to parse API response. The server might have returned an error page."
      );
    }

    console.log("✅ Bayesian priors updated successfully!");

    // Display comprehensive summary
    const summary = result.data.summary;

    console.log("\n📊 Performance Insights:");
    console.log("\nTop 5 Performing Bloodlines:");
    summary.topBloodlines.slice(0, 5).forEach((item: any, i: number) => {
      console.log(
        `${i + 1}. ${item.bloodline}: ${(item.winRate * 100).toFixed(
          1
        )}% win rate`
      );
    });

    console.log("\nTop 5 Breeding Combinations:");
    summary.bestCombinations.slice(0, 5).forEach((item: any, i: number) => {
      console.log(
        `${i + 1}. ${item.combination}: ${(item.successRate * 100).toFixed(
          1
        )}% success`
      );
    });

    if (summary.effectivePrograms && summary.effectivePrograms.length > 0) {
      console.log("\nTop Conditioning Programs:");
      summary.effectivePrograms.slice(0, 3).forEach((item: any, i: number) => {
        console.log(
          `${i + 1}. Program ${item.program}: ${(
            item.avgEffectiveness * 100
          ).toFixed(1)}% effectiveness`
        );
      });
    }

    // Display health insights if available
    if (summary.healthInsights) {
      console.log("\n🏥 Health Insights:");

      if (summary.healthInsights.vaccineResponsiveness.length > 0) {
        console.log("\nTop 5 Vaccine-Responsive Bloodlines:");
        summary.healthInsights.vaccineResponsiveness
          .slice(0, 5)
          .forEach((item: any, i: number) => {
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
          .forEach((item: any, i: number) => {
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
          .forEach((item: any, i: number) => {
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
      "🎯 All priors (performance, breeding, conditioning, and health) have been updated!"
    );
  } catch (error: any) {
    console.error("\n❌ Error updating priors:");
    console.error(error.message || error);

    if (error.message?.includes("fetch failed")) {
      console.error(
        "\n💡 Tip: Make sure your Next.js development server is running:\n" +
          "   npm run dev"
      );
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateBayesianPriors().catch((error) => {
  process.exit(1);
});
