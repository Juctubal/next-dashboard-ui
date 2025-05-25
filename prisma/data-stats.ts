import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function displayDataStatistics() {
  console.log("📊 Analyzing Training Data Statistics...\n");

  try {
    // Gamefowl statistics by bloodline
    const bloodlineStats = await prisma.gamefowl.groupBy({
      by: ["bloodline"],
      _count: true,
      _avg: {
        eloRating: true,
      },
    });

    console.log("🐓 Gamefowl Distribution by Bloodline:");
    console.log("=====================================");
    bloodlineStats.forEach((stat) => {
      console.log(
        `${stat.bloodline.padEnd(12)} | Count: ${stat._count
          .toString()
          .padStart(3)} | Avg Elo: ${Math.round(stat._avg.eloRating || 0)}`
      );
    });

    // Win rate by bloodline
    const results = await prisma.eventResult.findMany({
      include: {
        gamefowl: true,
      },
    });

    const bloodlineWinRates: {
      [key: string]: { wins: number; total: number };
    } = {};

    results.forEach((result) => {
      const bloodline = result.gamefowl.bloodline;
      if (!bloodlineWinRates[bloodline]) {
        bloodlineWinRates[bloodline] = { wins: 0, total: 0 };
      }
      bloodlineWinRates[bloodline].total++;
      if (result.result === "WIN") {
        bloodlineWinRates[bloodline].wins++;
      }
    });

    console.log("\n🏆 Win Rates by Bloodline:");
    console.log("==========================");
    Object.entries(bloodlineWinRates).forEach(([bloodline, stats]) => {
      const winRate = ((stats.wins / stats.total) * 100).toFixed(1);
      console.log(
        `${bloodline.padEnd(12)} | Win Rate: ${winRate.padStart(
          5
        )}% | Fights: ${stats.total}`
      );
    });

    // Event statistics
    const eventStats = await prisma.event.groupBy({
      by: ["status"],
      _count: true,
    });

    console.log("\n📅 Event Statistics:");
    console.log("===================");
    eventStats.forEach((stat) => {
      console.log(`${stat.status.padEnd(10)} | Count: ${stat._count}`);
    });

    // Sparring statistics
    const sparringCount = await prisma.sparring.count();
    const avgEloChange = await prisma.sparring.aggregate({
      _avg: {
        winner_elo_change: true,
      },
    });

    console.log("\n⚔️ Sparring Statistics:");
    console.log("======================");
    console.log(`Total Matches: ${sparringCount}`);
    console.log(
      `Avg Elo Change: ±${Math.round(avgEloChange._avg.winner_elo_change || 0)}`
    );

    // Breeding statistics
    const breedingStats = await prisma.breeding.groupBy({
      by: ["status"],
      _count: true,
    });

    console.log("\n🥚 Breeding Statistics:");
    console.log("======================");
    breedingStats.forEach((stat) => {
      console.log(`${stat.status.padEnd(10)} | Count: ${stat._count}`);
    });

    // Conditioning statistics
    const conditioningStats = await prisma.conditioning.groupBy({
      by: ["status"],
      _count: true,
    });

    console.log("\n💪 Conditioning Statistics:");
    console.log("==========================");
    conditioningStats.forEach((stat) => {
      console.log(`${stat.status.padEnd(10)} | Count: ${stat._count}`);
    });

    // Top performers
    const topGamefowls = await prisma.gamefowl.findMany({
      take: 10,
      orderBy: {
        eloRating: "desc",
      },
      where: {
        sex: "MALE",
      },
    });

    console.log("\n🌟 Top 10 Gamefowls by Elo Rating:");
    console.log("===================================");
    topGamefowls.forEach((gf, index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}. ${gf.name.padEnd(
          20
        )} | ${gf.bloodline.padEnd(10)} | Elo: ${gf.eloRating}`
      );
    });
  } catch (error) {
    console.error("Error analyzing data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the statistics display
displayDataStatistics().catch((error) => {
  console.error(error);
  process.exit(1);
});
