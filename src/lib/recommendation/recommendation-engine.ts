// Main Recommendation Engine

import { PrismaClient, ConditioningType } from "@prisma/client";
import { EloCalculator } from "./elo-calculator";
import { BayesianAnalyzer } from "./bayesian-analyzer";
import { EloToleranceCalculator } from "./elo-tolerance-calculator";
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
  private eloToleranceCalculator: EloToleranceCalculator;

  constructor(
    prisma: PrismaClient,
    bayesianAnalyzer?: BayesianAnalyzer,
    weights?: RecommendationWeights
  ) {
    this.prisma = prisma;
    this.bayesian = bayesianAnalyzer || new BayesianAnalyzer();
    this.weights = weights || DEFAULT_WEIGHTS;
    this.eloToleranceCalculator = new EloToleranceCalculator(prisma);
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
      ...gamefowl.sparring_winner.map((s: any) => ({
        date: s.sparringDate,
        won: true,
      })),
      ...gamefowl.sparring_loser.map((s: any) => ({
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
      gamefowlData: gamefowl, // Include full gamefowl data
      eventWins: gamefowl.EventResult.filter((r: any) => r.result === "WIN")
        .length,
      eventParticipations: gamefowl.EventResult.length,
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
        notIn: ["BREEDING", "INJURED", "DECEASED", "SOLD", "SICK"],
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
      include: {
        EventResult: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Get bloodline event win statistics
    const bloodlineEventWins: Record<string, number> = {};
    const allGamefowlsWithEventWins = await this.prisma.gamefowl.findMany({
      where: {
        EventResult: {
          some: {
            result: "WIN",
          },
        },
      },
      include: {
        EventResult: {
          where: {
            result: "WIN",
          },
        },
      },
    });

    // Count gamefowls per bloodline that have won events
    allGamefowlsWithEventWins.forEach((g) => {
      if (!bloodlineEventWins[g.bloodline]) {
        bloodlineEventWins[g.bloodline] = 0;
      }
      bloodlineEventWins[g.bloodline]++;
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
      let reasons = this.generateDerbyReasons(performanceData);

      // Filter bloodline success reason based on actual event wins
      const bloodlineWinners = bloodlineEventWins[gamefowl.bloodline] || 0;
      if (bloodlineWinners < 2) {
        // Remove the bloodline success reason if less than 2 gamefowls have won
        reasons = reasons.filter(
          (r) => !r.includes("bloodline shows proven success rate")
        );
      } else {
        // Update the reason to be more specific
        reasons = reasons.map((r) => {
          if (r.includes("bloodline shows proven success rate")) {
            return `${gamefowl.bloodline} bloodline shows proven success rate (${bloodlineWinners} gamefowls have won events)`;
          }
          return r;
        });
      }

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
    // Get all males with their full data to find high performers
    const allMales = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
      },
      include: {
        sparring_winner: true,
        sparring_loser: true,
        EventResult: {
          where: {
            result: "WIN",
          },
        },
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

    // Find high ELO males (within 200 points of the highest ELO)
    const sortedMales = allMales.sort((a, b) => b.eloRating - a.eloRating);
    const highestElo = sortedMales[0]?.eloRating || 1000;

    // Define high ELO as within 200 points of the highest ELO
    // This creates a dynamic range that adapts to the current population
    const highEloThreshold = highestElo - 200;

    const highEloMales = sortedMales.filter(
      (male) => male.eloRating >= highEloThreshold
    );

    // Get bloodlines of high ELO males
    const highEloBloodlines = Array.from(
      new Set(highEloMales.map((m) => m.bloodline))
    );

    // Get potential sires (males available for breeding)
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
        EventResult: {
          where: {
            result: "WIN",
          },
        },
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

    // Get potential dams (females available for breeding)
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
        EventResult: true,
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

      // Check if sire has event wins
      const sireEventWins = sire.EventResult?.length || 0;
      const sireHasGoodSparringRecord = this.hasSireGoodSparringRecord(sire);

      for (const dam of dams) {
        const damData = await this.getGamefowlPerformanceData(dam.id);
        if (!damData) continue;

        // Check if dam shares bloodline with high ELO males
        const damSharesHighEloBloodline = highEloBloodlines.includes(
          dam.bloodline
        );

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

        // Boost compatibility if dam shares bloodline with high ELO males
        let adjustedCompatibilityScore = compatibilityScore;
        if (damSharesHighEloBloodline) {
          adjustedCompatibilityScore = Math.min(compatibilityScore * 1.2, 1);
        }

        // Calculate strength indicators
        const strengthIndicators = {
          sparringRecord: sireHasGoodSparringRecord,
          healthStatus: this.hasExcellentHealth(sire, dam),
          conditioning: this.hasProperConditioning(sire, dam),
          activity: false, // Removed as per requirement
          temperament: false, // Removed as per requirement
          damSharesSuccessfulBloodline: damSharesHighEloBloodline,
          sireEventWins: sireEventWins > 0,
        };

        const reasons = this.generateBreedingReasonsWithIndicators(
          sireData,
          damData,
          adjustedCompatibilityScore,
          geneticDiversityScore,
          strengthIndicators,
          sireEventWins,
          damSharesHighEloBloodline
        );

        recommendations.push({
          sireId: sire.id,
          damId: dam.id,
          sireName: sire.name,
          damName: dam.name,
          compatibilityScore: adjustedCompatibilityScore,
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
    manualEloTolerance?: number
  ): Promise<SparringMatchRecommendation[]> {
    // Calculate optimal ELO tolerance if not manually provided
    let eloTolerance: number;
    let toleranceReasoning: string[] = [];

    if (manualEloTolerance !== undefined) {
      eloTolerance = manualEloTolerance;
      toleranceReasoning.push(`Using manual ELO tolerance: ±${eloTolerance}`);
    } else {
      const toleranceRecommendation =
        await this.eloToleranceCalculator.getToleranceRecommendation();
      eloTolerance = toleranceRecommendation.tolerance;
      toleranceReasoning = toleranceRecommendation.reasoning;
    }

    console.log("ELO tolerance:", eloTolerance); // Debug log

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

    console.log("Available gamefowls:", gamefowls.length); // Debug log

    const recommendations: SparringMatchRecommendation[] = [];

    for (let i = 0; i < gamefowls.length - 1; i++) {
      for (let j = i + 1; j < gamefowls.length; j++) {
        const gamefowl1 = gamefowls[i];
        const gamefowl2 = gamefowls[j];

        // Calculate Elo gap
        const eloGap = Math.abs(gamefowl1.eloRating - gamefowl2.eloRating);

        // Skip if ELO gap is too large
        if (eloGap > eloTolerance) {
          console.log(
            `Skipping pair ${gamefowl1.name} vs ${gamefowl2.name} - ELO gap ${eloGap} > tolerance ${eloTolerance}`
          ); // Debug log
          continue;
        }

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

        if (recentMatch) {
          console.log(
            `Skipping pair ${gamefowl1.name} vs ${gamefowl2.name} - recent match found`
          ); // Debug log
          continue;
        }

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

        // Add tolerance reasoning to the first recommendation
        if (recommendations.length === 0 && !manualEloTolerance) {
          reasons.push(
            ...toleranceReasoning.map((r) => `[Auto-tolerance] ${r}`)
          );
        }

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

        console.log(
          `Added recommendation: ${gamefowl1.name} vs ${gamefowl2.name}`
        ); // Debug log
      }
    }

    console.log(
      "Total recommendations before sorting:",
      recommendations.length
    ); // Debug log

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
    manualEloTolerance?: number
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

    // Calculate optimal ELO tolerance if not manually provided
    let eloTolerance: number;
    let toleranceReasoning: string[] = [];

    if (manualEloTolerance !== undefined) {
      eloTolerance = manualEloTolerance;
      toleranceReasoning.push(`Using manual ELO tolerance: ±${eloTolerance}`);
    } else {
      // Use dynamic tolerance based on the specific gamefowl's ELO
      eloTolerance =
        await this.eloToleranceCalculator.calculateDynamicTolerance(
          targetGamefowl.eloRating
        );
      const toleranceRecommendation =
        await this.eloToleranceCalculator.getToleranceRecommendation();
      toleranceReasoning = [
        `Dynamic tolerance for ELO ${targetGamefowl.eloRating}: ±${eloTolerance}`,
        ...toleranceRecommendation.reasoning,
      ];
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

      // Add tolerance reasoning to the first recommendation
      if (recommendations.length === 0 && !manualEloTolerance) {
        reasons.push(...toleranceReasoning.map((r) => `[Auto-tolerance] ${r}`));
      }

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
    gamefowlId: number,
    timeToEvent?: number,
    targetType?: "general" | "brooding" | "breeding" | "derby"
  ): Promise<ConditioningRecommendation[]> {
    const gamefowl = await this.getGamefowlPerformanceData(gamefowlId);
    if (!gamefowl) return [];

    // Build filter for conditioning type based on target
    let conditioningTypeFilter: ConditioningType[] | undefined;

    if (targetType === "brooding") {
      conditioningTypeFilter = [ConditioningType.BROODING];
    } else if (targetType === "breeding") {
      conditioningTypeFilter = [
        ConditioningType.BREEDING,
        "PRIMING" as ConditioningType,
      ];
    } else if (targetType === "derby") {
      conditioningTypeFilter = [
        ConditioningType.PRE_CONDITIONING,
        ConditioningType.CONDITIONING,
      ];
    }
    // For "general", no filter is applied (show all types)

    const programs = await this.prisma.conditioningProgram.findMany({
      where: conditioningTypeFilter
        ? {
            conditioningType: {
              in: conditioningTypeFilter,
            },
          }
        : undefined,
      include: {
        activities: true,
      },
    });

    // Ensure recommendations is defined and in scope
    const recommendations: ConditioningRecommendation[] = [];

    if (targetType === "brooding") {
      // Special logic for brooding - target young gamefowls (chicks)
      const gamefowlData = gamefowl.gamefowlData;
      if (!gamefowlData) return [];

      // Calculate age in days
      const now = Date.now();
      const ageInDays = gamefowlData.date_hatched
        ? Math.floor(
            (now - new Date(gamefowlData.date_hatched).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : 365; // Default to 1 year if no hatch date

      // Brooding is typically for chicks under 8 weeks (56 days)
      if (ageInDays > 56) {
        // Return empty if the gamefowl is too old for brooding
        return [];
      }

      // Check vaccination status for young chicks
      const hasEarlyVaccines = gamefowlData.vaccine?.some((v: any) => {
        const vaccineName = v.name.toLowerCase();
        return (
          vaccineName.includes("newcastle") && vaccineName.includes("b1b1")
        );
      });

      // Check if deworming has been done (usually starts around 3-4 weeks)
      const hasDeworming = gamefowlData.deworming?.length > 0;

      for (const program of programs) {
        const customizations = this.determineConditioningCustomizations(
          gamefowl,
          program
        );

        // Generate brooding-specific reasons
        const reasons = this.generateBroodingReasons(
          gamefowl,
          program,
          ageInDays,
          hasEarlyVaccines,
          hasDeworming
        );

        recommendations.push({
          gamefowlId: gamefowl.id,
          gamefowlName: gamefowl.name,
          recommendedProgramId: program.id,
          programName: program.programName,
          conditioningType: program.conditioningType || undefined,
          durationDays: program.durationDays || undefined,
          customizations,
          reasons,
        });
      }

      return recommendations.slice(0, 5);
    }

    if (targetType === "breeding") {
      // Check if gamefowl has had any 'Priming' conditioning in the past month
      const now = Date.now();
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days
      const conditioningRecords = gamefowl.gamefowlData?.conditioning || [];

      // Debug: Log conditioning records to understand the data structure
      console.log(
        `Debug - Gamefowl ${gamefowl.id} conditioning records:`,
        conditioningRecords.map((c: any) => ({
          conditioningType: c.conditioning?.conditioningType,
          status: c.conditioning?.status,
          startDate: c.conditioning?.startDate,
          programName: c.conditioning?.conProg?.programName,
        }))
      );

      // Check if gamefowl has ever had priming conditioning (more flexible check)
      const hasEverHadPriming = conditioningRecords.some((c: any) => {
        const conditioningType = c.conditioning?.conditioningType;
        // Check for various possible values
        return (
          conditioningType === "PRIMING" ||
          conditioningType === "Priming" ||
          conditioningType === "priming" ||
          (c.conditioning?.conProg?.programName &&
            c.conditioning.conProg.programName
              .toLowerCase()
              .includes("priming"))
        );
      });

      // Check if gamefowl has had priming conditioning within the last month
      const hadRecentPrimingConditioning = conditioningRecords.some(
        (c: any) => {
          const startDate = new Date(c.conditioning?.startDate).getTime();
          const conditioningType = c.conditioning?.conditioningType;
          const status = c.conditioning?.status;

          // More flexible status check - include COMPLETED, ACTIVE, etc.
          const validStatuses = [
            "ASSIGNED",
            "COMPLETED",
            "ACTIVE",
            "IN_PROGRESS",
          ];
          const hasValidStatus = validStatuses.includes(status);

          // More flexible conditioning type check
          const isPrimingType =
            conditioningType === "PRIMING" ||
            conditioningType === "Priming" ||
            conditioningType === "priming" ||
            (c.conditioning?.conProg?.programName &&
              c.conditioning.conProg.programName
                .toLowerCase()
                .includes("priming"));

          return startDate > oneMonthAgo && isPrimingType && hasValidStatus;
        }
      );

      // Debug: Log the results
      console.log(`Debug - Gamefowl ${gamefowl.id}:`, {
        hasEverHadPriming,
        hadRecentPrimingConditioning,
        conditioningRecordsCount: conditioningRecords.length,
      });

      let filteredPrograms;
      let reasons;

      if (!hasEverHadPriming) {
        // Has never had priming: recommend conditioning type "PRIMING"
        filteredPrograms = programs.filter(
          (p: any) => p.conditioningType === "PRIMING"
        );
        reasons = [
          "Gamefowl has not yet undergone Priming conditioning - this is required before breeding programs",
        ];
      } else if (hadRecentPrimingConditioning) {
        // Had priming within the last month: recommend conditioning type "BREEDING"
        filteredPrograms = programs.filter(
          (p: any) => p.conditioningType === "BREEDING"
        );
        reasons = [
          "Gamefowl has completed Priming within the last month - ready for Breeding conditioning programs",
        ];
      } else {
        // Had priming before but not recently: recommend priming again
        filteredPrograms = programs.filter(
          (p: any) => p.conditioningType === "PRIMING"
        );
        reasons = [
          "Gamefowl needs fresh Priming conditioning before proceeding with breeding programs",
        ];
      }

      for (const program of filteredPrograms) {
        const customizations = this.determineConditioningCustomizations(
          gamefowl,
          program
        );
        recommendations.push({
          gamefowlId: gamefowl.id,
          gamefowlName: gamefowl.name,
          recommendedProgramId: program.id,
          programName: program.programName,
          conditioningType: program.conditioningType || undefined,
          durationDays: program.durationDays || undefined,
          customizations,
          reasons,
        });
      }
      return recommendations.slice(0, 5);
    }

    // For other target types, loop over all programs
    for (const program of programs) {
      // Skip programs that exceed available time to event
      if (
        timeToEvent &&
        program.durationDays &&
        program.durationDays > timeToEvent
      ) {
        continue;
      }

      // Determine customizations based on gamefowl characteristics
      const customizations = this.determineConditioningCustomizations(
        gamefowl,
        program
      );

      // If we have a timeToEvent, adjust the duration if needed
      if (timeToEvent && customizations.duration > timeToEvent) {
        customizations.duration = timeToEvent;
      }

      const reasons = this.generateConditioningReasons(
        gamefowl,
        program,
        timeToEvent,
        targetType
      );

      recommendations.push({
        gamefowlId: gamefowl.id,
        gamefowlName: gamefowl.name,
        recommendedProgramId: program.id,
        programName: program.programName,
        conditioningType: program.conditioningType || undefined,
        durationDays: program.durationDays || undefined,
        customizations,
        reasons,
      });
    }

    // Sort by program suitability (you can add custom logic here)
    return recommendations.slice(0, 5);
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

    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days

    // Check for PRE_CONDITIONING or CONDITIONING within the last month that are COMPLETED
    const relevantConditioning = gamefowl.conditioning.filter((c: any) => {
      const conditioningType = c.conditioning.conProg.conditioningType;
      const endDate = c.conditioning.endDate
        ? new Date(c.conditioning.endDate).getTime()
        : null;
      const status = c.conditioning.status;

      // Must be PRE_CONDITIONING or CONDITIONING type
      const isRelevantType =
        conditioningType === "PRE_CONDITIONING" ||
        conditioningType === "CONDITIONING";

      // Must be COMPLETED
      const isCompleted = status === "COMPLETED";

      // Must have ended within the last month
      const isRecentlyCompleted = endDate && endDate > oneMonthAgo;

      return isRelevantType && isCompleted && isRecentlyCompleted;
    });

    if (relevantConditioning.length === 0) {
      // No relevant conditioning completed within the last month
      return 0.2;
    }

    // Has completed relevant conditioning within the last month
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
    // Use the actual program duration if available, otherwise fall back to calculated duration
    const calculatedDuration = gamefowl.conditioningScore < 0.5 ? 21 : 14;
    const duration = program.durationDays || calculatedDuration;

    return { duration };
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

    // Add event wins/participations information
    if (performance.eventWins && performance.eventParticipations) {
      if (performance.eventWins > 0) {
        reasons.push(
          `Has won ${performance.eventWins} out of ${
            performance.eventParticipations
          } event${performance.eventParticipations > 1 ? "s" : ""}`
        );
      }
    }

    // Check for bloodline success - this will be checked in recommendForDerby
    if (performance.bloodlineStrength > 0.6) {
      // This will be updated in recommendForDerby based on actual event wins
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

    // Check for vaccine/deworming records in the past 2 months
    const now = Date.now();
    const twoMonthsAgo = now - 60 * 24 * 60 * 60 * 1000; // 60 days

    // Get the gamefowl data with vaccine and deworming records
    const gamefowlData = (performance as any).gamefowlData;

    if (gamefowlData) {
      const hasRecentVaccine = gamefowlData.vaccine?.some(
        (v: any) => new Date(v.vaccinationDate).getTime() > twoMonthsAgo
      );
      const hasRecentDeworming = gamefowlData.deworming?.some(
        (d: any) => new Date(d.dewormDate).getTime() > twoMonthsAgo
      );

      if (!hasRecentVaccine || !hasRecentDeworming) {
        risks.push("No recent vaccine/deworming records (past 2 months)");
      }
    }

    if (performance.healthScore < 0.6) {
      risks.push(
        "Below optimal health - check vaccination and deworming schedule"
      );
    }

    // Check for conditioning within the last month
    if (gamefowlData && gamefowlData.conditioning) {
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days
      const hasRelevantRecentConditioning = gamefowlData.conditioning.some(
        (c: any) => {
          const conditioningType = c.conditioning.conProg.conditioningType;
          const endDate = c.conditioning.endDate
            ? new Date(c.conditioning.endDate).getTime()
            : null;
          const status = c.conditioning.status;

          // Must be PRE_CONDITIONING or CONDITIONING type
          const isRelevantType =
            conditioningType === "PRE_CONDITIONING" ||
            conditioningType === "CONDITIONING";

          // Must be COMPLETED
          const isCompleted = status === "COMPLETED";

          // Must have ended within the last month
          const isRecentlyCompleted = endDate && endDate > oneMonthAgo;

          return isRelevantType && isCompleted && isRecentlyCompleted;
        }
      );

      if (!hasRelevantRecentConditioning) {
        risks.push("Insufficient conditioning preparation for derby event");
      }
    } else if (performance.conditioningScore < 0.5) {
      risks.push("Insufficient conditioning preparation for derby event");
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
    timeToEvent?: number,
    targetType?: string
  ): string[] {
    const reasons = [];

    // Breeding-specific logic (handled in recommendConditioningPrograms, not here)

    // Default logic for other types
    if (gamefowl.conditioningScore < 0.5) {
      reasons.push("Gamefowl urgently needs structured conditioning");
    }

    if (program.activities.length > 10) {
      reasons.push("Comprehensive program covers all aspects of conditioning");
    }

    if (program.conditioningType) {
      reasons.push(
        `Specialized ${program.conditioningType} program suitable for this gamefowl`
      );
    }

    // Time-based reasoning
    if (timeToEvent) {
      if (program.durationDays && program.durationDays === timeToEvent) {
        reasons.push("Program duration perfectly matches time until event");
      }
    }

    if (program.durationDays && program.durationDays > 21) {
      reasons.push("Extended program for thorough conditioning");
    }

    if (gamefowl.healthScore > 0.8) {
      reasons.push("Excellent health status allows for intensive training");
    }

    if (gamefowl.eloRating > 1300) {
      reasons.push(
        "High performance gamefowl will benefit from advanced conditioning"
      );
    }

    return reasons;
  }

  private generateBreedingReasonsWithIndicators(
    sire: GamefowlPerformanceData,
    dam: GamefowlPerformanceData,
    compatibility: number,
    geneticDiversity: number,
    indicators: any,
    sireEventWins: number = 0,
    damSharesHighEloBloodline: boolean = false
  ): string[] {
    const reasons = [];

    // Only add non-redundant reasons
    if (compatibility > 0.8) {
      reasons.push(
        "Exceptional bloodline compatibility based on historical data"
      );
    }

    if (sire.eloRating > 1400) {
      if (dam.eloRating > 1200) {
        reasons.push("Both parents have proven championship genetics");
      } else {
        reasons.push(`Sire has elite ELO rating of ${sire.eloRating}`);
      }
    }

    if (geneticDiversity > 0.7) {
      reasons.push("Good genetic diversity will strengthen the bloodline");
    }

    if (sire.bloodlineStrength > 0.8) {
      reasons.push(`${sire.bloodline} sire line shows dominant winning traits`);
    }

    // Add event wins information
    if (sireEventWins > 0) {
      reasons.push(
        `Sire has won ${sireEventWins} event${sireEventWins > 1 ? "s" : ""}`
      );
    }

    // Add dam bloodline information
    if (damSharesHighEloBloodline) {
      reasons.push(
        `Dam's ${dam.bloodline} bloodline has produced high ELO males`
      );
    }

    return reasons;
  }

  private hasSireGoodSparringRecord(sire: any): boolean {
    const sireWins = sire.sparring_winner?.length || 0;
    const sireLosses = sire.sparring_loser?.length || 0;
    const sireTotal = sireWins + sireLosses;

    // Good record if win rate > 60% with at least 3 fights
    return sireTotal >= 3 && sireWins / sireTotal > 0.6;
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
    // This method is no longer used but kept for backward compatibility
    return false;
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

    if (matchingCriteria.trackRecordSimilarity) {
      reasons.push("Track records are similar");
    }

    if (matchingCriteria.eloWithinTolerance) {
      reasons.push("Close ratings ensure unpredictable and exciting match");
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

  private generateBroodingReasons(
    gamefowl: GamefowlPerformanceData,
    program: any,
    ageInDays: number,
    hasEarlyVaccines: boolean,
    hasDeworming: boolean
  ): string[] {
    const reasons = [];

    // Age-specific reasons
    if (ageInDays <= 21) {
      reasons.push(
        "Chick is in early development stage - needs structured brooding program"
      );
    } else if (ageInDays <= 42) {
      reasons.push(
        "Chick is transitioning to juvenile stage - final brooding period"
      );
    } else if (ageInDays <= 56) {
      reasons.push(
        "Chick is ready for transition from brooding to basic conditioning"
      );
    }

    // Vaccination status reasons
    if (!hasEarlyVaccines) {
      if (ageInDays >= 7) {
        reasons.push(
          "Newcastle Disease (B1B1) vaccination is due - critical for chick health"
        );
      }
      if (ageInDays >= 21) {
        reasons.push("Second Newcastle Disease (B1B1) dose is required");
      }
    } else {
      reasons.push("Vaccination schedule is on track for healthy development");
    }

    // Deworming reasons
    if (ageInDays >= 21 && !hasDeworming) {
      reasons.push(
        "Deworming treatment should be started around 3-4 weeks of age"
      );
    } else if (hasDeworming && ageInDays >= 21) {
      reasons.push("Deworming protocol has been properly initiated");
    }

    // Program-specific reasons
    if (program.conditioningType === "BROODING") {
      reasons.push(
        "Specialized brooding program designed for chick development"
      );
    }

    if (program.activities && program.activities.length > 0) {
      const hasNutritionActivity = program.activities.some(
        (activity: any) =>
          activity.activityName?.toLowerCase().includes("nutrition") ||
          activity.activityName?.toLowerCase().includes("feeding")
      );

      if (hasNutritionActivity) {
        reasons.push(
          "Program includes proper nutrition management for growing chicks"
        );
      }

      const hasEnvironmentActivity = program.activities.some(
        (activity: any) =>
          activity.activityName?.toLowerCase().includes("environment") ||
          activity.activityName?.toLowerCase().includes("housing") ||
          activity.activityName?.toLowerCase().includes("temperature")
      );

      if (hasEnvironmentActivity) {
        reasons.push(
          "Program covers essential environmental controls for chick welfare"
        );
      }
    }

    // Health and development reasons
    if (gamefowl.healthScore > 0.8) {
      reasons.push(
        "Excellent health status supports optimal brooding outcomes"
      );
    } else if (gamefowl.healthScore > 0.6) {
      reasons.push("Good health condition suitable for brooding program");
    } else {
      reasons.push(
        "Health improvements needed - brooding program will help establish proper care"
      );
    }

    // Bloodline-specific reasoning
    if (gamefowl.bloodlineStrength > 0.7) {
      reasons.push(
        `${gamefowl.bloodline} bloodline has strong genetic potential - proper brooding is crucial`
      );
    }

    return reasons;
  }
}
