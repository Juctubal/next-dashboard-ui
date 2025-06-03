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
    limit: number = 5
  ): Promise<DerbyRecommendation[]> {
    // Get eligible gamefowls
    const whereClause: any = {
      isArchived: false,
      status: {
        notIn: ["BREEDING", "INJURED", "DECEASED", "SOLD"],
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
    } else if (context.ageCategory === "ANY") {
      // For ANY category, include STAG, BULLSTAG, and COCK
      whereClause.age = {
        in: ["STAG", "BULLSTAG", "COCK"],
      };
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

      // Calculate overall score without win probability
      const overallScore = this.calculateDerbyScore(performanceData, context);

      // Generate reasons without win probability
      const reasons = this.generateDerbyReasons(performanceData);
      const riskFactors = this.identifyRiskFactors(performanceData, context);

      recommendations.push({
        gamefowlId: gamefowl.id,
        gamefowlName: gamefowl.name,
        bloodline: gamefowl.bloodline,
        currentElo: gamefowl.eloRating,
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
    // Get potential sires and dams with their full data
    const sires = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "BREEDING"],
        },
      },
      include: {
        sparring_winner: true,
        sparring_loser: true,
        vaccine: {
          orderBy: { vaccinationDate: "desc" },
          take: 5,
        },
        deworming: {
          orderBy: { dewormDate: "desc" },
          take: 5,
        },
        conditioning: {
          orderBy: { id: "desc" },
          take: 1,
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
      include: {
        sparring_winner: true,
        sparring_loser: true,
        vaccine: {
          orderBy: { vaccinationDate: "desc" },
          take: 5,
        },
        deworming: {
          orderBy: { dewormDate: "desc" },
          take: 5,
        },
        conditioning: {
          orderBy: { id: "desc" },
          take: 1,
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

        // Calculate genetic diversity
        const geneticDiversityScore = this.calculateGeneticDiversity(
          sire.bloodline,
          dam.bloodline
        );

        // Get historical success rate
        const bloodlineCombinationSuccess = this.bayesian.getBloodlinePosterior(
          `${sire.bloodline}:${dam.bloodline}`
        );

        // Calculate strength indicators
        const strengthIndicators = {
          sparringRecord: this.hasGoodSparringRecord(sire, dam),
          healthStatus: this.hasExcellentHealth(sire, dam),
          conditioning: this.hasProperConditioning(sire, dam),
          activity: this.hasHighActivity(sire, dam),
          temperament: this.hasBalancedTemperament(sireData, damData),
        };

        const reasons = this.generateBreedingReasonsWithIndicators(
          sireData,
          damData,
          compatibilityScore,
          geneticDiversityScore,
          strengthIndicators
        );

        recommendations.push({
          sireId: sire.id,
          damId: dam.id,
          sireName: sire.name,
          damName: dam.name,
          compatibilityScore,
          bloodlineCombinationSuccess,
          geneticDiversityScore,
          strengthIndicators,
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
    limit: number = 10,
    eloTolerance: number = 30
  ): Promise<SparringMatchRecommendation[]> {
    // Get gamefowls available for sparring with their full data
    const gamefowls = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "CONDITIONING"],
        },
      },
      include: {
        sparring_winner: true,
        sparring_loser: true,
        conditioning: {
          orderBy: { id: "desc" },
          take: 1,
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

        // Calculate track records
        const gamefowl1Wins = gamefowl1.sparring_winner?.length || 0;
        const gamefowl1Losses = gamefowl1.sparring_loser?.length || 0;
        const gamefowl2Wins = gamefowl2.sparring_winner?.length || 0;
        const gamefowl2Losses = gamefowl2.sparring_loser?.length || 0;

        const gamefowl1TrackRecord = `${gamefowl1Wins}-${gamefowl1Losses}`;
        const gamefowl2TrackRecord = `${gamefowl2Wins}-${gamefowl2Losses}`;

        // Calculate matching criteria
        const matchingCriteria = {
          trackRecordSimilarity: this.areTrackRecordsSimilar(
            gamefowl1Wins,
            gamefowl1Losses,
            gamefowl2Wins,
            gamefowl2Losses
          ),
          eloWithinTolerance: eloGap <= eloTolerance,
          conditioningMatch: this.haveMatchingConditioning(
            gamefowl1,
            gamefowl2
          ),
          previousOutcomes: !recentMatch,
        };

        const reasons = this.generateSparringReasonsWithCriteria(
          matchBalance,
          expectedLearningValue,
          eloGap,
          matchingCriteria,
          gamefowl1TrackRecord,
          gamefowl2TrackRecord
        );

        // Calculate win probabilities
        const gamefowl1WinProbability = EloCalculator.getWinProbability(
          gamefowl1.eloRating,
          gamefowl2.eloRating
        );
        const gamefowl2WinProbability = 100 - gamefowl1WinProbability;

        recommendations.push({
          gamefowl1Id: gamefowl1.id,
          gamefowl2Id: gamefowl2.id,
          gamefowl1Name: gamefowl1.name,
          gamefowl2Name: gamefowl2.name,
          gamefowl1Elo: gamefowl1.eloRating,
          gamefowl2Elo: gamefowl2.eloRating,
          gamefowl1TrackRecord,
          gamefowl2TrackRecord,
          gamefowl1WinProbability,
          gamefowl2WinProbability,
          eloGap,
          matchBalance,
          expectedLearningValue,
          matchingCriteria,
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
   * Recommend sparring partners for a specific gamefowl
   */
  async recommendSparringPartnersForGamefowl(
    gamefowlId: number,
    limit: number = 5,
    eloTolerance: number = 30
  ): Promise<SparringMatchRecommendation[]> {
    // Get the target gamefowl
    const targetGamefowl = await this.prisma.gamefowl.findUnique({
      where: { id: gamefowlId },
      include: {
        sparring_winner: true,
        sparring_loser: true,
        conditioning: {
          orderBy: { id: "desc" },
          take: 1,
        },
      },
    });

    if (!targetGamefowl || targetGamefowl.isArchived) {
      return [];
    }

    // Get potential sparring partners
    const potentialPartners = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "CONDITIONING"],
        },
        id: {
          not: gamefowlId, // Exclude the target gamefowl
        },
      },
      include: {
        sparring_winner: true,
        sparring_loser: true,
        conditioning: {
          orderBy: { id: "desc" },
          take: 1,
        },
      },
      orderBy: {
        eloRating: "desc",
      },
    });

    const recommendations: SparringMatchRecommendation[] = [];

    for (const partner of potentialPartners) {
      // Calculate Elo gap
      const eloGap = Math.abs(targetGamefowl.eloRating - partner.eloRating);

      // Calculate match balance (closer to 1 is better)
      const matchBalance = 1 - eloGap / 400; // 400 point gap = 0 balance

      // Calculate expected learning value
      const expectedLearningValue = this.calculateLearningValue(
        targetGamefowl.eloRating,
        partner.eloRating
      );

      // Check if they've fought recently
      const recentMatch = await this.prisma.sparring.findFirst({
        where: {
          OR: [
            {
              gamefowl_1_Id: targetGamefowl.id,
              gamefowl_2_Id: partner.id,
            },
            {
              gamefowl_1_Id: partner.id,
              gamefowl_2_Id: targetGamefowl.id,
            },
          ],
          sparringDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      if (recentMatch) continue;

      // Calculate track records
      const targetWins = targetGamefowl.sparring_winner?.length || 0;
      const targetLosses = targetGamefowl.sparring_loser?.length || 0;
      const partnerWins = partner.sparring_winner?.length || 0;
      const partnerLosses = partner.sparring_loser?.length || 0;

      const targetTrackRecord = `${targetWins}-${targetLosses}`;
      const partnerTrackRecord = `${partnerWins}-${partnerLosses}`;

      // Calculate matching criteria
      const matchingCriteria = {
        trackRecordSimilarity: this.areTrackRecordsSimilar(
          targetWins,
          targetLosses,
          partnerWins,
          partnerLosses
        ),
        eloWithinTolerance: eloGap <= eloTolerance,
        conditioningMatch: this.haveMatchingConditioning(
          targetGamefowl,
          partner
        ),
        previousOutcomes: !recentMatch,
      };

      const reasons = this.generateSparringReasonsWithCriteria(
        matchBalance,
        expectedLearningValue,
        eloGap,
        matchingCriteria,
        targetTrackRecord,
        partnerTrackRecord
      );

      // Calculate win probabilities
      const targetWinProbability = EloCalculator.getWinProbability(
        targetGamefowl.eloRating,
        partner.eloRating
      );
      const partnerWinProbability = 100 - targetWinProbability;

      recommendations.push({
        gamefowl1Id: targetGamefowl.id,
        gamefowl2Id: partner.id,
        gamefowl1Name: targetGamefowl.name,
        gamefowl2Name: partner.name,
        gamefowl1Elo: targetGamefowl.eloRating,
        gamefowl2Elo: partner.eloRating,
        gamefowl1TrackRecord: targetTrackRecord,
        gamefowl2TrackRecord: partnerTrackRecord,
        gamefowl1WinProbability: targetWinProbability,
        gamefowl2WinProbability: partnerWinProbability,
        eloGap,
        matchBalance,
        expectedLearningValue,
        matchingCriteria,
        reasons,
      });
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
    const oneDay = 24 * 60 * 60 * 1000;

    // Calculate gamefowl age in days
    const ageInDays = gamefowl.date_hatched
      ? Math.floor((now - new Date(gamefowl.date_hatched).getTime()) / oneDay)
      : 365; // Default to 1 year if no hatch date

    // Define required vaccination intervals based on the seed data
    const vaccineRequirements = [
      { name: "Newcastle Disease (B1B1)", requiredAge: 7, intervalDays: 365 },
      {
        name: "Newcastle Disease (B1B1) - 2nd dose",
        requiredAge: 21,
        intervalDays: 365,
      },
      { name: "Fowl Pox", requiredAge: 35, intervalDays: 365 },
      {
        name: "Newcastle Disease (Lasota)",
        requiredAge: 60,
        intervalDays: 180,
      },
      {
        name: "Newcastle Disease (Lasota) - Booster",
        requiredAge: 120,
        intervalDays: 180,
      },
      { name: "Fowl Cholera", requiredAge: 90, intervalDays: 365 },
      { name: "Infectious Bronchitis", requiredAge: 14, intervalDays: 365 },
      { name: "Marek's Disease", requiredAge: 1, intervalDays: 9999 }, // One-time vaccine
    ];

    // Calculate vaccination score
    let vaccineScore = 0;
    let requiredVaccines = 0;
    let upToDateVaccines = 0;
    let criticalMissing = false;

    // Determine booster interval based on age category
    const boosterInterval = gamefowl.age === "COCK" ? 365 * 3 : 365; // 3 years for COCK, 1 year for others

    for (const requirement of vaccineRequirements) {
      // Only require vaccines appropriate for the gamefowl's age
      if (ageInDays >= requirement.requiredAge) {
        requiredVaccines++;

        // Find most recent vaccination of this type
        const mostRecent = gamefowl.vaccine.find(
          (v: any) =>
            v.name === requirement.name ||
            (requirement.name.includes("Booster") &&
              v.name.includes("Annual Booster"))
        );

        if (mostRecent) {
          const daysSinceVaccination = Math.floor(
            (now - new Date(mostRecent.vaccinationDate).getTime()) / oneDay
          );

          // Use appropriate interval for boosters
          const intervalDays = requirement.name.includes("Booster")
            ? boosterInterval
            : requirement.intervalDays;

          if (daysSinceVaccination <= intervalDays) {
            upToDateVaccines++;
            // Give bonus points for recent vaccinations
            const freshness = 1 - daysSinceVaccination / intervalDays;
            vaccineScore += freshness * 0.05;
          } else {
            // Mark critical vaccines (Newcastle Disease) as missing
            if (requirement.name.includes("Newcastle Disease")) {
              criticalMissing = true;
            }
          }
        } else {
          // No vaccination record for required vaccine
          if (
            requirement.name.includes("Newcastle Disease") &&
            ageInDays > requirement.requiredAge + 30
          ) {
            criticalMissing = true;
          }
        }
      }
    }

    // Base vaccine score on percentage of up-to-date vaccines
    if (requiredVaccines > 0) {
      vaccineScore =
        (upToDateVaccines / requiredVaccines) * 0.5 +
        Math.min(vaccineScore, 0.1);
    } else {
      vaccineScore = 0.5; // Young bird with no required vaccines yet
    }

    // Apply penalty for missing critical vaccines
    if (criticalMissing) {
      vaccineScore *= 0.5;
    }

    // Calculate deworming score
    const dewormingInterval = ageInDays < 180 ? 180 : 180; // Both intervals are now 180 days
    let dewormingScore = 0;

    if (gamefowl.deworming.length > 0) {
      const mostRecentDeworming = gamefowl.deworming[0]; // Already ordered by date desc
      const daysSinceDeworming = Math.floor(
        (now - new Date(mostRecentDeworming.dewormDate).getTime()) / oneDay
      );

      if (daysSinceDeworming <= dewormingInterval) {
        // Full score if dewormed within interval
        dewormingScore = 0.4;
        // Add freshness bonus
        const freshness = 1 - daysSinceDeworming / dewormingInterval;
        dewormingScore += freshness * 0.1;
      } else if (daysSinceDeworming <= dewormingInterval * 1.5) {
        // Partial score if slightly overdue
        dewormingScore = 0.2;
      } else if (daysSinceDeworming <= dewormingInterval * 2) {
        // Low score if moderately overdue
        dewormingScore = 0.1;
      }
      // No score if significantly overdue
    } else if (ageInDays < 21) {
      // Young birds not yet requiring deworming
      dewormingScore = 0.5;
    }

    // Check for pre-conditioning deworming if in conditioning
    if (gamefowl.status === "CONDITIONING" && gamefowl.deworming.length > 0) {
      // Check if dewormed within last 30 days (increased from 14 days due to reduced frequency)
      const recentDeworming = gamefowl.deworming.find((d: any) => {
        const daysSince = Math.floor(
          (now - new Date(d.dewormDate).getTime()) / oneDay
        );
        return daysSince <= 30 && d.notes?.includes("Pre-conditioning");
      });

      if (recentDeworming) {
        dewormingScore = Math.min(dewormingScore + 0.1, 0.5);
      }
    }

    // Combined health score
    const totalScore = vaccineScore + dewormingScore;

    // Apply penalties for health issues
    if (gamefowl.status === "INJURED") {
      return totalScore * 0.5;
    }

    // Apply bonus for young healthy birds
    if (ageInDays < 365 && totalScore > 0.8) {
      return Math.min(totalScore * 1.1, 1);
    }

    return Math.min(totalScore, 1);
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
    context: RecommendationContext
  ): number {
    const weights = this.weights;

    // Get health impact multiplier from Bayesian analysis
    const healthImpact = this.bayesian.predictHealthImpact(
      performance.bloodline,
      performance.healthScore
    );

    let score =
      weights.eloWeight * (performance.eloRating / 1600) +
      weights.healthWeight * performance.healthScore +
      weights.conditioningWeight * performance.conditioningScore +
      weights.bloodlineWeight * performance.bloodlineStrength +
      weights.recentFormWeight * performance.recentFormScore;

    // Apply health impact multiplier
    score = score * healthImpact;

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

  private generateDerbyReasons(performance: GamefowlPerformanceData): string[] {
    const reasons: string[] = [];

    if (performance.eloRating > 1300) {
      reasons.push(
        `High Elo rating of ${performance.eloRating} indicates strong competitive ability`
      );
    }

    if (performance.healthScore > 0.8) {
      reasons.push(
        "Excellent health status with up-to-date vaccinations and deworming"
      );
    } else if (performance.healthScore > 0.6) {
      reasons.push("Good health condition with recent medical care");
    }

    if (performance.conditioningScore > 0.7) {
      reasons.push("Well-conditioned and ready for competition");
    }

    if (performance.recentFormScore > 0.7) {
      reasons.push(
        `Strong recent form with ${Math.round(
          performance.recentFormScore * 100
        )}% win rate in last 5 fights`
      );
    }

    if (performance.bloodlineStrength > 0.6) {
      reasons.push(
        `${performance.bloodline} bloodline shows proven success rate`
      );
    }

    if (performance.winRate > 0.65) {
      reasons.push(
        `Impressive career win rate of ${Math.round(
          performance.winRate * 100
        )}%`
      );
    }

    return reasons;
  }

  private identifyRiskFactors(
    performance: GamefowlPerformanceData,
    context: RecommendationContext
  ): string[] {
    const risks: string[] = [];

    if (performance.healthScore < 0.6) {
      if (performance.healthScore < 0.3) {
        risks.push(
          "Critical health concerns - requires immediate medical attention"
        );
      } else {
        risks.push(
          "Below optimal health - check vaccination and deworming schedule"
        );
      }
    }

    if (performance.conditioningScore < 0.5) {
      risks.push("Insufficient conditioning preparation");
    }

    if (performance.recentFormScore < 0.3) {
      risks.push("Poor recent performance record");
    }

    if (performance.totalFights < 3) {
      risks.push("Limited fight experience");
    }

    if (context.timeToEvent && context.timeToEvent < 7) {
      if (performance.conditioningScore < 0.8) {
        risks.push("Insufficient time for proper conditioning");
      }
    }

    // Check for age-related risks
    if (performance.ageCategory === "STAG" && performance.totalFights > 10) {
      risks.push("High fight count for young age");
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

  private generateBreedingReasonsWithIndicators(
    sire: GamefowlPerformanceData,
    dam: GamefowlPerformanceData,
    compatibility: number,
    geneticDiversity: number,
    indicators: any
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

    if (geneticDiversity > 0.7) {
      reasons.push("Good genetic diversity will strengthen the bloodline");
    }

    if (sire.bloodlineStrength > 0.8) {
      reasons.push(`${sire.bloodline} sire line shows dominant winning traits`);
    }

    if (indicators.sparringRecord) {
      reasons.push("Good sparring record between the parents");
    }

    if (indicators.healthStatus) {
      reasons.push("Both parents have excellent health status");
    }

    if (indicators.conditioning) {
      reasons.push("Both parents have proper conditioning");
    }

    if (indicators.activity) {
      reasons.push("Both parents have high activity level");
    }

    if (indicators.temperament) {
      reasons.push("Balanced temperament between the parents");
    }

    return reasons;
  }

  private hasGoodSparringRecord(sire: any, dam: any): boolean {
    const sireWins = sire.sparring_winner?.length || 0;
    const sireLosses = sire.sparring_loser?.length || 0;
    const damWins = dam.sparring_winner?.length || 0;
    const damLosses = dam.sparring_loser?.length || 0;

    const sireTotal = sireWins + sireLosses;
    const damTotal = damWins + damLosses;

    // Good record if win rate > 60% with at least 3 fights
    const sireGoodRecord = sireTotal >= 3 && sireWins / sireTotal > 0.6;
    const damGoodRecord = damTotal >= 3 && damWins / damTotal > 0.6;

    return sireGoodRecord || damGoodRecord;
  }

  private hasExcellentHealth(sire: any, dam: any): boolean {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sixMonths = 180 * 24 * 60 * 60 * 1000;

    // Check recent vaccinations
    const sireRecentVaccine = sire.vaccine?.some(
      (v: any) => now - new Date(v.vaccinationDate).getTime() < sixMonths
    );
    const damRecentVaccine = dam.vaccine?.some(
      (v: any) => now - new Date(v.vaccinationDate).getTime() < sixMonths
    );

    // Check recent deworming
    const sireRecentDeworming = sire.deworming?.some(
      (d: any) => now - new Date(d.dewormDate).getTime() < sixMonths
    );
    const damRecentDeworming = dam.deworming?.some(
      (d: any) => now - new Date(d.dewormDate).getTime() < sixMonths
    );

    return (
      (sireRecentVaccine && sireRecentDeworming) ||
      (damRecentVaccine && damRecentDeworming)
    );
  }

  private hasProperConditioning(sire: any, dam: any): boolean {
    // Check if they have active or recent conditioning
    const sireConditioned = sire.conditioning?.length > 0;
    const damConditioned = dam.conditioning?.length > 0;

    return sireConditioned || damConditioned;
  }

  private hasHighActivity(sire: any, dam: any): boolean {
    // Check if they are actively competing or training
    const activeStatuses = ["IDLE", "COMPETING", "CONDITIONING"];
    return (
      activeStatuses.includes(sire.status) &&
      activeStatuses.includes(dam.status)
    );
  }

  private hasBalancedTemperament(
    sireData: GamefowlPerformanceData,
    damData: GamefowlPerformanceData
  ): boolean {
    // Good temperament if consistent performance (recent form > 0.6)
    return sireData.recentFormScore > 0.6 || damData.recentFormScore > 0.6;
  }

  private areTrackRecordsSimilar(
    wins1: number,
    losses1: number,
    wins2: number,
    losses2: number
  ): boolean {
    const total1 = wins1 + losses1;
    const total2 = wins2 + losses2;

    if (total1 === 0 || total2 === 0) return false;

    const winRate1 = wins1 / total1;
    const winRate2 = wins2 / total2;

    const difference = Math.abs(winRate1 - winRate2);
    return difference < 0.1;
  }

  private haveMatchingConditioning(gamefowl1: any, gamefowl2: any): boolean {
    const condition1 = gamefowl1.conditioning?.length > 0;
    const condition2 = gamefowl2.conditioning?.length > 0;

    return condition1 && condition2;
  }

  private generateSparringReasonsWithCriteria(
    balance: number,
    learningValue: number,
    eloGap: number,
    matchingCriteria: any,
    gamefowl1TrackRecord: string,
    gamefowl2TrackRecord: string
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

    if (matchingCriteria.trackRecordSimilarity) {
      reasons.push("Track records are similar");
    }

    if (matchingCriteria.eloWithinTolerance) {
      reasons.push(`Elo gap within tolerance (${eloGap} points)`);
    }

    if (matchingCriteria.conditioningMatch) {
      reasons.push("Both gamefowls have matching conditioning");
    }

    if (matchingCriteria.previousOutcomes) {
      reasons.push("No recent outcomes between the gamefowls");
    }

    return reasons;
  }
}
