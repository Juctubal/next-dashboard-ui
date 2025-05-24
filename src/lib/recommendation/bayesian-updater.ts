// Bayesian Prior Updater Service

import { PrismaClient } from "@prisma/client";
import { BayesianAnalyzer } from "./bayesian-analyzer";

export class BayesianUpdater {
  private prisma: PrismaClient;
  private analyzer: BayesianAnalyzer;

  constructor(prisma: PrismaClient, analyzer: BayesianAnalyzer) {
    this.prisma = prisma;
    this.analyzer = analyzer;
  }

  /**
   * Update all Bayesian priors based on historical data
   */
  async updateAllPriors(): Promise<void> {
    await Promise.all([
      this.updateBloodlinePerformance(),
      this.updateBreedingCombinations(),
      this.updateConditioningEffectiveness(),
    ]);
  }

  /**
   * Update bloodline performance priors
   */
  async updateBloodlinePerformance(): Promise<void> {
    // Get all sparring results grouped by bloodline
    const gamefowls = await this.prisma.gamefowl.findMany({
      include: {
        sparring_winner: true,
        sparring_loser: true,
      },
    });

    const bloodlineStats: Record<string, { wins: number; losses: number }> = {};

    for (const gamefowl of gamefowls) {
      if (!bloodlineStats[gamefowl.bloodline]) {
        bloodlineStats[gamefowl.bloodline] = { wins: 0, losses: 0 };
      }

      bloodlineStats[gamefowl.bloodline].wins +=
        gamefowl.sparring_winner.length;
      bloodlineStats[gamefowl.bloodline].losses +=
        gamefowl.sparring_loser.length;
    }

    // Update Bayesian priors for each bloodline
    for (const [bloodline, stats] of Object.entries(bloodlineStats)) {
      this.analyzer.updateBloodlinePerformance(
        bloodline,
        stats.wins,
        stats.losses
      );
    }
  }

  /**
   * Update breeding combination priors
   */
  async updateBreedingCombinations(): Promise<void> {
    // Get offspring with known parents and fight records
    const offspring = await this.prisma.gamefowl.findMany({
      where: {
        sireId: { not: null },
        damId: { not: null },
      },
      include: {
        sire: true,
        dam: true,
        sparring_winner: true,
        sparring_loser: true,
      },
    });

    for (const child of offspring) {
      if (!child.sire || !child.dam) continue;

      const wins = child.sparring_winner.length;
      const losses = child.sparring_loser.length;
      const total = wins + losses;

      if (total > 0) {
        const performance = wins / total;
        this.analyzer.updateBloodlineCombination(
          child.sire.bloodline,
          child.dam.bloodline,
          performance
        );
      }
    }
  }

  /**
   * Update conditioning program effectiveness
   */
  async updateConditioningEffectiveness(): Promise<void> {
    // Get conditioning results with associated gamefowl performance
    const conditionings = await this.prisma.conditioning.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        conProg: true,
        gamefowls: {
          include: {
            gamefowl: {
              include: {
                sparring_winner: {
                  where: {
                    sparringDate: {
                      gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                    },
                  },
                },
                sparring_loser: {
                  where: {
                    sparringDate: {
                      gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const programEffectiveness: Record<string, Record<string, number[]>> = {};

    for (const conditioning of conditionings) {
      const programId = conditioning.conProgId.toString();

      if (!programEffectiveness[programId]) {
        programEffectiveness[programId] = {};
      }

      for (const { gamefowl } of conditioning.gamefowls) {
        const wins = gamefowl.sparring_winner.length;
        const losses = gamefowl.sparring_loser.length;
        const total = wins + losses;

        if (total > 0) {
          const effectiveness = wins / total;

          if (!programEffectiveness[programId][gamefowl.bloodline]) {
            programEffectiveness[programId][gamefowl.bloodline] = [];
          }

          programEffectiveness[programId][gamefowl.bloodline].push(
            effectiveness
          );
        }
      }
    }

    // Update Bayesian priors with average effectiveness
    for (const [programId, bloodlineData] of Object.entries(
      programEffectiveness
    )) {
      for (const [bloodline, effectivenessValues] of Object.entries(
        bloodlineData
      )) {
        const avgEffectiveness =
          effectivenessValues.reduce((sum, val) => sum + val, 0) /
          effectivenessValues.length;

        this.analyzer.updateConditioningEffectiveness(
          programId,
          bloodline,
          avgEffectiveness
        );
      }
    }
  }

  /**
   * Update priors after a new sparring match
   */
  async updateAfterSparring(sparringId: number): Promise<void> {
    const sparring = await this.prisma.sparring.findUnique({
      where: { id: sparringId },
      include: {
        winner: true,
        loser: true,
      },
    });

    if (!sparring) return;

    // Update bloodline performance for winner
    const winnerStats = await this.getGamefowlStats(sparring.winnerId);
    this.analyzer.updateBloodlinePerformance(
      sparring.winner.bloodline,
      winnerStats.wins,
      winnerStats.losses
    );

    // Update bloodline performance for loser
    const loserStats = await this.getGamefowlStats(sparring.loserId);
    this.analyzer.updateBloodlinePerformance(
      sparring.loser.bloodline,
      loserStats.wins,
      loserStats.losses
    );
  }

  /**
   * Update priors after a new breeding
   */
  async updateAfterBreeding(breedingId: number): Promise<void> {
    // Wait for offspring to have fight records before updating
    // This would typically be called after offspring have matured and fought
    const breeding = await this.prisma.breeding.findUnique({
      where: { id: breedingId },
      include: {
        sire: true,
        dam: true,
      },
    });

    if (!breeding) return;

    // Find offspring from this breeding
    const offspring = await this.prisma.gamefowl.findMany({
      where: {
        sireId: breeding.sireId,
        damId: breeding.damId,
      },
      include: {
        sparring_winner: true,
        sparring_loser: true,
      },
    });

    for (const child of offspring) {
      const wins = child.sparring_winner.length;
      const losses = child.sparring_loser.length;
      const total = wins + losses;

      if (total > 0) {
        const performance = wins / total;
        this.analyzer.updateBloodlineCombination(
          breeding.sire.bloodline,
          breeding.dam.bloodline,
          performance
        );
      }
    }
  }

  /**
   * Helper method to get gamefowl fight statistics
   */
  private async getGamefowlStats(
    gamefowlId: number
  ): Promise<{ wins: number; losses: number }> {
    const gamefowl = await this.prisma.gamefowl.findUnique({
      where: { id: gamefowlId },
      include: {
        sparring_winner: true,
        sparring_loser: true,
      },
    });

    if (!gamefowl) return { wins: 0, losses: 0 };

    return {
      wins: gamefowl.sparring_winner.length,
      losses: gamefowl.sparring_loser.length,
    };
  }
}
