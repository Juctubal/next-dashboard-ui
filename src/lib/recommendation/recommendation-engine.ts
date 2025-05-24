// Main Recommendation Engine

import { PrismaClient } from "@prisma/client";
import { EloCalculator } from "./elo-calculator";
import { BayesianAnalyzer } from "./bayesian-analyzer";
import {
  GamefowlPerformanceData,
  DerbyRecommendation,
  BreedingPairRecommendation,
  SparringMatchRecommendation,
  ConditioningRecommendation,
  RecommendationContext,
  RecommendationWeights,
  DEFAULT_WEIGHTS,
} from "./types";

export class RecommendationEngine {
  private prisma: PrismaClient;
  private bayesian: BayesianAnalyzer;
  private weights: RecommendationWeights;

  constructor(
    prisma: PrismaClient,
    bayesianAnalyzer?: BayesianAnalyzer,
    weights?: RecommendationWeights
  ) {
    this.prisma = prisma;
    this.bayesian = bayesianAnalyzer || new BayesianAnalyzer();
    this.weights = weights || DEFAULT_WEIGHTS;
  }

  /**
   * Get gamefowl performance data with calculated metrics
   */
  async getGamefowlPerformanceData(
    gamefowlId: number
  ): Promise<GamefowlPerformanceData | null> {
    const gamefowl = await this.prisma.gamefowl.findUnique({
      where: { id: gamefowlId },
      include: {
        sparring_winner: true,
        sparring_loser: true,
        vaccine: {
          where: { isArchived: false },
          orderBy: { vaccinationDate: "desc" },
          take: 5,
        },
        deworming: {
          where: { isArchived: false },
          orderBy: { dewormDate: "desc" },
          take: 5,
        },
        conditioning: {
          include: {
            conditioning: {
              include: {
                conProg: true,
              },
            },
          },
        },
        EventResult: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!gamefowl) return null;

    // Calculate fight statistics
    const wins = gamefowl.sparring_winner.length;
    const losses = gamefowl.sparring_loser.length;
    const totalFights = wins + losses;
    const winRate = totalFights > 0 ? wins / totalFights : 0;

    // Calculate recent form (last 5 fights)
    const recentFights = [
      ...gamefowl.sparring_winner.map((s) => ({
        date: s.sparringDate,
        won: true,
      })),
      ...gamefowl.sparring_loser.map((s) => ({
        date: s.sparringDate,
        won: false,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    const recentWins = recentFights.filter((f) => f.won).length;
    const recentFormScore =
      recentFights.length > 0 ? recentWins / recentFights.length : 0.5;

    // Calculate health score
    const healthScore = this.calculateHealthScore(gamefowl);

    // Calculate conditioning score
    const conditioningScore = this.calculateConditioningScore(gamefowl);

    // Get bloodline strength from Bayesian analysis
    const bloodlineStrength = this.bayesian.getBloodlinePosterior(
      gamefowl.bloodline,
      { wins, losses }
    );

    return {
      id: gamefowl.id,
      name: gamefowl.name,
      bloodline: gamefowl.bloodline,
      sex: gamefowl.sex,
      eloRating: gamefowl.eloRating,
      totalFights,
      wins,
      losses,
      draws: 0, // Assuming no draws in the current schema
      winRate,
      healthScore,
      conditioningScore,
      ageCategory: gamefowl.age || "UNKNOWN",
      recentFormScore,
      bloodlineStrength,
    };
  }

  /**
   * Recommend gamefowls for derby participation
   */
  async recommendForDerby(
    context: RecommendationContext,
    limit: number = 10
  ): Promise<DerbyRecommendation[]> {
    // Get eligible gamefowls
    const whereClause: any = {
      isArchived: false,
      status: {
        in: ["IDLE", "CONDITIONING"],
      },
      sex: "MALE",
    };

    // Only add age filter if it's not 'ANY' and maps to a valid gamefowlAge
    if (context.ageCategory && context.ageCategory !== "ANY") {
      // Map AgeCategory to gamefowlAge
      if (context.ageCategory === "STAG") {
        whereClause.age = "STAG";
      } else if (context.ageCategory === "BULLSTAG") {
        whereClause.age = "BULLSTAG";
      } else if (context.ageCategory === "COCK") {
        whereClause.age = "COCK";
      }
    }

    const gamefowls = await this.prisma.gamefowl.findMany({
      where: whereClause,
    });

    const recommendations: DerbyRecommendation[] = [];

    for (const gamefowl of gamefowls) {
      const performanceData = await this.getGamefowlPerformanceData(
        gamefowl.id
      );
      if (!performanceData) continue;

      // Calculate win probability against expected competition
      const opponentElo = context.opponentStrength || 1200;
      const winProbability =
        EloCalculator.getWinProbability(gamefowl.eloRating, opponentElo) / 100;

      // Calculate overall score
      const overallScore = this.calculateDerbyScore(
        performanceData,
        winProbability,
        context
      );

      // Generate reasons
      const reasons = this.generateDerbyReasons(
        performanceData,
        winProbability
      );
      const riskFactors = this.identifyRiskFactors(performanceData, context);

      recommendations.push({
        gamefowlId: gamefowl.id,
        gamefowlName: gamefowl.name,
        bloodline: gamefowl.bloodline,
        currentElo: gamefowl.eloRating,
        winProbability,
        conditionReadiness: performanceData.conditioningScore,
        healthReadiness: performanceData.healthScore,
        overallScore,
        reasons,
        riskFactors,
      });
    }

    // Sort by overall score and return top recommendations
    return recommendations
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }

  /**
   * Recommend breeding pairs
   */
  async recommendBreedingPairs(
    limit: number = 10
  ): Promise<BreedingPairRecommendation[]> {
    // Get potential sires and dams
    const sires = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "BREEDING"],
        },
      },
    });

    const dams = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "FEMALE",
        status: {
          in: ["IDLE", "BREEDING"],
        },
      },
    });

    const recommendations: BreedingPairRecommendation[] = [];

    for (const sire of sires) {
      const sireData = await this.getGamefowlPerformanceData(sire.id);
      if (!sireData) continue;

      for (const dam of dams) {
        const damData = await this.getGamefowlPerformanceData(dam.id);
        if (!damData) continue;

        // Calculate compatibility
        const compatibilityScore = this.bayesian.calculateBreedingCompatibility(
          sire.bloodline,
          dam.bloodline,
          sireData.winRate,
          damData.winRate
        );

        // Calculate expected offspring Elo
        const expectedOffspring = EloCalculator.calculateOffspringPotential(
          sire.eloRating,
          dam.eloRating
        );

        // Calculate genetic diversity
        const geneticDiversityScore = this.calculateGeneticDiversity(
          sire.bloodline,
          dam.bloodline
        );

        // Get historical success rate
        const bloodlineCombinationSuccess = this.bayesian.getBloodlinePosterior(
          `${sire.bloodline}:${dam.bloodline}`
        );

        const reasons = this.generateBreedingReasons(
          sireData,
          damData,
          compatibilityScore,
          geneticDiversityScore
        );

        recommendations.push({
          sireId: sire.id,
          damId: dam.id,
          sireName: sire.name,
          damName: dam.name,
          compatibilityScore,
          expectedOffspringElo: expectedOffspring.expected,
          bloodlineCombinationSuccess,
          geneticDiversityScore,
          reasons,
        });
      }
    }

    // Sort by compatibility score and return top recommendations
    return recommendations
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);
  }

  /**
   * Recommend sparring matches
   */
  async recommendSparringMatches(
    limit: number = 10
  ): Promise<SparringMatchRecommendation[]> {
    // Get gamefowls available for sparring
    const gamefowls = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "CONDITIONING"],
        },
      },
      orderBy: {
        eloRating: "desc",
      },
    });

    const recommendations: SparringMatchRecommendation[] = [];
    const paired = new Set<number>();

    for (let i = 0; i < gamefowls.length - 1; i++) {
      if (paired.has(gamefowls[i].id)) continue;

      for (let j = i + 1; j < gamefowls.length; j++) {
        if (paired.has(gamefowls[j].id)) continue;

        const gamefowl1 = gamefowls[i];
        const gamefowl2 = gamefowls[j];

        // Calculate Elo gap
        const eloGap = Math.abs(gamefowl1.eloRating - gamefowl2.eloRating);

        // Calculate match balance (closer to 1 is better)
        const matchBalance = 1 - eloGap / 400; // 400 point gap = 0 balance

        // Calculate expected learning value
        const expectedLearningValue = this.calculateLearningValue(
          gamefowl1.eloRating,
          gamefowl2.eloRating
        );

        // Check if they've fought recently
        const recentMatch = await this.prisma.sparring.findFirst({
          where: {
            OR: [
              {
                gamefowl_1_Id: gamefowl1.id,
                gamefowl_2_Id: gamefowl2.id,
              },
              {
                gamefowl_1_Id: gamefowl2.id,
                gamefowl_2_Id: gamefowl1.id,
              },
            ],
            sparringDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        });

        if (recentMatch) continue;

        const reasons = this.generateSparringReasons(
          matchBalance,
          expectedLearningValue,
          eloGap
        );

        recommendations.push({
          gamefowl1Id: gamefowl1.id,
          gamefowl2Id: gamefowl2.id,
          gamefowl1Name: gamefowl1.name,
          gamefowl2Name: gamefowl2.name,
          eloGap,
          matchBalance,
          expectedLearningValue,
          reasons,
        });

        paired.add(gamefowl1.id);
        paired.add(gamefowl2.id);
        break;
      }
    }

    return recommendations
      .sort((a, b) => b.matchBalance - a.matchBalance)
      .slice(0, limit);
  }

  /**
   * Recommend conditioning programs
   */
  async recommendConditioningPrograms(
    gamefowlId: number
  ): Promise<ConditioningRecommendation[]> {
    const gamefowl = await this.getGamefowlPerformanceData(gamefowlId);
    if (!gamefowl) return [];

    const programs = await this.prisma.conditioningProgram.findMany({
      include: {
        activities: true,
      },
    });

    const recommendations: ConditioningRecommendation[] = [];

    for (const program of programs) {
      // Predict effectiveness based on bloodline
      const expectedImprovement = this.bayesian.predictConditioningSuccess(
        program.id.toString(),
        gamefowl.bloodline,
        gamefowl.conditioningScore
      );

      // Determine customizations based on gamefowl characteristics
      const customizations = this.determineConditioningCustomizations(
        gamefowl,
        program
      );

      const reasons = this.generateConditioningReasons(
        gamefowl,
        program,
        expectedImprovement
      );

      recommendations.push({
        gamefowlId: gamefowl.id,
        gamefowlName: gamefowl.name,
        recommendedProgramId: program.id,
        programName: program.programName,
        expectedImprovement,
        customizations,
        reasons,
      });
    }

    return recommendations
      .sort((a, b) => b.expectedImprovement - a.expectedImprovement)
      .slice(0, 5);
  }

  // Helper methods

  private calculateHealthScore(gamefowl: any): number {
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    // Check recent vaccinations
    const recentVaccines = gamefowl.vaccine.filter(
      (v: any) => now - v.vaccinationDate.getTime() < 6 * oneMonth
    );

    // Check recent deworming
    const recentDeworming = gamefowl.deworming.filter(
      (d: any) => now - d.dewormDate.getTime() < 3 * oneMonth
    );

    const vaccineScore = Math.min(recentVaccines.length / 3, 1) * 0.5;
    const dewormingScore = Math.min(recentDeworming.length / 2, 1) * 0.5;

    return vaccineScore + dewormingScore;
  }

  private calculateConditioningScore(gamefowl: any): number {
    if (gamefowl.conditioning.length === 0) return 0;

    const activeConditioning = gamefowl.conditioning.filter(
      (c: any) => c.conditioning.status === "ASSIGNED"
    );

    if (activeConditioning.length === 0) return 0.5;

    // Simple score based on having active conditioning
    return 0.8;
  }

  private calculateDerbyScore(
    performance: GamefowlPerformanceData,
    winProbability: number,
    context: RecommendationContext
  ): number {
    const weights = this.weights;

    let score =
      weights.eloWeight * (performance.eloRating / 1600) +
      weights.healthWeight * performance.healthScore +
      weights.conditioningWeight * performance.conditioningScore +
      weights.bloodlineWeight * performance.bloodlineStrength +
      weights.recentFormWeight * performance.recentFormScore;

    // Adjust for context
    if (context.timeToEvent && context.timeToEvent < 7) {
      // Prioritize conditioning readiness for imminent events
      score = score * 0.7 + performance.conditioningScore * 0.3;
    }

    return Math.min(score, 1);
  }

  private calculateGeneticDiversity(
    bloodline1: string,
    bloodline2: string
  ): number {
    // Simple diversity calculation - can be enhanced with actual genetic markers
    return bloodline1 === bloodline2 ? 0.3 : 0.8;
  }

  private calculateLearningValue(elo1: number, elo2: number): number {
    const gap = Math.abs(elo1 - elo2);
    // Optimal learning occurs with moderate skill gaps (100-200 points)
    if (gap < 50) return 0.5;
    if (gap < 150) return 0.9;
    if (gap < 300) return 0.7;
    return 0.3;
  }

  private determineConditioningCustomizations(
    gamefowl: GamefowlPerformanceData,
    program: any
  ): any {
    const duration = gamefowl.conditioningScore < 0.5 ? 21 : 14;
    const intensity =
      gamefowl.eloRating > 1400
        ? "intensive"
        : gamefowl.eloRating > 1200
        ? "moderate"
        : "light";

    const focusAreas = [];
    if (gamefowl.recentFormScore < 0.4) focusAreas.push("stamina");
    if (gamefowl.winRate < 0.5) focusAreas.push("technique");
    if (gamefowl.healthScore < 0.7) focusAreas.push("recovery");

    return { duration, intensity, focusAreas };
  }

  // Reason generation methods

  private generateDerbyReasons(
    performance: GamefowlPerformanceData,
    winProbability: number
  ): string[] {
    const reasons = [];

    if (performance.eloRating >= 1400) {
      reasons.push(
        `Elite rating of ${performance.eloRating} indicates championship potential`
      );
    }

    if (winProbability > 0.7) {
      reasons.push(
        `High win probability of ${Math.round(
          winProbability * 100
        )}% against expected competition`
      );
    }

    if (performance.recentFormScore > 0.8) {
      reasons.push("Excellent recent form with strong winning streak");
    }

    if (performance.bloodlineStrength > 0.7) {
      reasons.push(
        `${performance.bloodline} bloodline shows exceptional historical performance`
      );
    }

    if (performance.healthScore > 0.9) {
      reasons.push("Optimal health condition with up-to-date medical care");
    }

    return reasons;
  }

  private identifyRiskFactors(
    performance: GamefowlPerformanceData,
    context: RecommendationContext
  ): string[] {
    const risks = [];

    if (performance.recentFormScore < 0.3) {
      risks.push("Poor recent form may indicate underlying issues");
    }

    if (performance.healthScore < 0.5) {
      risks.push("Overdue for vaccination or deworming");
    }

    if (performance.totalFights < 5) {
      risks.push("Limited fighting experience");
    }

    if (
      context.timeToEvent &&
      context.timeToEvent < 7 &&
      performance.conditioningScore < 0.6
    ) {
      risks.push("Insufficient conditioning time before event");
    }

    return risks;
  }

  private generateBreedingReasons(
    sire: GamefowlPerformanceData,
    dam: GamefowlPerformanceData,
    compatibility: number,
    diversity: number
  ): string[] {
    const reasons = [];

    if (compatibility > 0.8) {
      reasons.push(
        "Exceptional bloodline compatibility based on historical data"
      );
    }

    if (sire.eloRating > 1400 && dam.eloRating > 1200) {
      reasons.push("Both parents have proven championship genetics");
    }

    if (diversity > 0.7) {
      reasons.push("Good genetic diversity will strengthen the bloodline");
    }

    if (sire.bloodlineStrength > 0.8) {
      reasons.push(`${sire.bloodline} sire line shows dominant winning traits`);
    }

    return reasons;
  }

  private generateSparringReasons(
    balance: number,
    learningValue: number,
    eloGap: number
  ): string[] {
    const reasons = [];

    if (balance > 0.9) {
      reasons.push("Perfectly balanced match for competitive sparring");
    }

    if (learningValue > 0.8) {
      reasons.push("Optimal skill gap for maximum learning potential");
    }

    if (eloGap < 100) {
      reasons.push("Close ratings ensure unpredictable and exciting match");
    }

    return reasons;
  }

  private generateConditioningReasons(
    gamefowl: GamefowlPerformanceData,
    program: any,
    expectedImprovement: number
  ): string[] {
    const reasons = [];

    if (expectedImprovement > 0.7) {
      reasons.push(
        `${gamefowl.bloodline} bloodline responds exceptionally well to this program`
      );
    }

    if (program.activities.length > 10) {
      reasons.push("Comprehensive program covers all aspects of conditioning");
    }

    if (gamefowl.conditioningScore < 0.5) {
      reasons.push("Gamefowl urgently needs structured conditioning");
    }

    return reasons;
  }
}
