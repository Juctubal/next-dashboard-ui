import { PrismaClient } from "@prisma/client";

interface SparringAnalysis {
  averageEloGap: number;
  medianEloGap: number;
  standardDeviation: number;
  optimalTolerance: number;
  confidenceLevel: number;
  dataPoints: number;
  qualityMatches: number;
  totalMatches: number;
}

interface EloDistribution {
  min: number;
  max: number;
  mean: number;
  median: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export class EloToleranceCalculator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Calculate optimal ELO tolerance based on historical sparring data
   * @param minDataPoints Minimum number of sparring records required for analysis
   * @param qualityThreshold Win probability range considered "quality" (e.g., 0.3-0.7)
   * @returns Sparring analysis with optimal tolerance
   */
  async calculateOptimalTolerance(
    minDataPoints: number = 20,
    qualityThreshold: { min: number; max: number } = { min: 0.3, max: 0.7 }
  ): Promise<SparringAnalysis> {
    // Fetch historical sparring data with gamefowl ELO ratings
    const sparringRecords = await this.prisma.sparring.findMany({
      include: {
        gamefowl1: true,
        gamefowl2: true,
        winner: true,
        loser: true,
      },
      orderBy: {
        sparringDate: "desc",
      },
      take: 500, // Analyze last 500 matches for relevance
    });

    if (sparringRecords.length < minDataPoints) {
      // Not enough data, return conservative default
      return this.getDefaultAnalysis();
    }

    // Calculate ELO gaps and analyze match quality
    const eloGaps: number[] = [];
    const qualityMatchGaps: number[] = [];

    for (const record of sparringRecords) {
      const elo1 = record.gamefowl1.eloRating;
      const elo2 = record.gamefowl2.eloRating;
      const eloGap = Math.abs(elo1 - elo2);

      eloGaps.push(eloGap);

      // Calculate win probability for the match
      const winProb = this.calculateWinProbability(elo1, elo2);
      const lowerProb = Math.min(winProb, 1 - winProb);

      // Check if this was a "quality" match (competitive)
      if (
        lowerProb >= qualityThreshold.min &&
        lowerProb <= qualityThreshold.max
      ) {
        qualityMatchGaps.push(eloGap);
      }
    }

    // Calculate statistics
    const averageEloGap = this.calculateMean(eloGaps);
    const medianEloGap = this.calculateMedian(eloGaps);
    const standardDeviation = this.calculateStandardDeviation(eloGaps);

    // Calculate optimal tolerance based on quality matches
    let optimalTolerance: number;
    let confidenceLevel: number;

    if (qualityMatchGaps.length >= minDataPoints) {
      // Use 75th percentile of quality match gaps as optimal tolerance
      const sortedQualityGaps = [...qualityMatchGaps].sort((a, b) => a - b);
      const percentile75Index = Math.floor(sortedQualityGaps.length * 0.75);
      optimalTolerance = Math.round(sortedQualityGaps[percentile75Index]);
      confidenceLevel = Math.min(
        0.95,
        qualityMatchGaps.length / sparringRecords.length + 0.5
      );
    } else {
      // Fallback: use mean + 0.5 * standard deviation
      optimalTolerance = Math.round(averageEloGap + 0.5 * standardDeviation);
      confidenceLevel = 0.7;
    }

    // Ensure tolerance is within reasonable bounds
    optimalTolerance = Math.max(20, Math.min(100, optimalTolerance));

    return {
      averageEloGap,
      medianEloGap,
      standardDeviation,
      optimalTolerance,
      confidenceLevel,
      dataPoints: sparringRecords.length,
      qualityMatches: qualityMatchGaps.length,
      totalMatches: sparringRecords.length,
    };
  }

  /**
   * Get ELO distribution of active gamefowls
   * @returns Distribution statistics
   */
  async getEloDistribution(): Promise<EloDistribution> {
    const gamefowls = await this.prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "CONDITIONING"],
        },
      },
      select: {
        eloRating: true,
      },
    });

    const ratings = gamefowls.map((g) => g.eloRating).sort((a, b) => a - b);

    if (ratings.length === 0) {
      return {
        min: 1000,
        max: 1000,
        mean: 1000,
        median: 1000,
        quartiles: { q1: 1000, q2: 1000, q3: 1000 },
      };
    }

    return {
      min: ratings[0],
      max: ratings[ratings.length - 1],
      mean: this.calculateMean(ratings),
      median: this.calculateMedian(ratings),
      quartiles: {
        q1: ratings[Math.floor(ratings.length * 0.25)],
        q2: ratings[Math.floor(ratings.length * 0.5)],
        q3: ratings[Math.floor(ratings.length * 0.75)],
      },
    };
  }

  /**
   * Calculate dynamic tolerance based on specific gamefowl's ELO
   * @param gamefowlElo The ELO rating of the gamefowl
   * @param distribution Current ELO distribution
   * @returns Adjusted tolerance for this specific ELO range
   */
  async calculateDynamicTolerance(
    gamefowlElo: number,
    distribution?: EloDistribution
  ): Promise<number> {
    if (!distribution) {
      distribution = await this.getEloDistribution();
    }

    const baseAnalysis = await this.calculateOptimalTolerance();
    let tolerance = baseAnalysis.optimalTolerance;

    // Adjust tolerance based on ELO position in distribution
    if (
      gamefowlElo <= distribution.quartiles.q1 ||
      gamefowlElo >= distribution.quartiles.q3
    ) {
      // For gamefowls at the extremes, increase tolerance
      tolerance = Math.round(tolerance * 1.5);
    } else if (
      gamefowlElo > distribution.quartiles.q1 &&
      gamefowlElo < distribution.quartiles.q3
    ) {
      // For gamefowls in the middle 50%, use standard tolerance
      tolerance = baseAnalysis.optimalTolerance;
    }

    // Further adjust based on available opponents
    const availableOpponents = await this.prisma.gamefowl.count({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "CONDITIONING"],
        },
        eloRating: {
          gte: gamefowlElo - tolerance,
          lte: gamefowlElo + tolerance,
        },
      },
    });

    // If too few opponents, gradually increase tolerance
    if (availableOpponents < 3) {
      tolerance = Math.round(tolerance * 1.5);
    } else if (availableOpponents < 5) {
      tolerance = Math.round(tolerance * 1.25);
    }

    return Math.min(150, tolerance); // Cap at 150
  }

  /**
   * Get tolerance recommendation with explanation
   * @returns Tolerance value with reasoning
   */
  async getToleranceRecommendation(): Promise<{
    tolerance: number;
    reasoning: string[];
    confidence: number;
    analysis: SparringAnalysis;
  }> {
    const analysis = await this.calculateOptimalTolerance();
    const distribution = await this.getEloDistribution();

    const reasoning: string[] = [];

    if (analysis.dataPoints < 20) {
      reasoning.push(
        "Limited historical data available - using conservative estimates"
      );
    } else {
      reasoning.push(`Based on ${analysis.dataPoints} recent sparring matches`);
    }

    if (analysis.qualityMatches > analysis.totalMatches * 0.6) {
      reasoning.push(
        "High proportion of competitive matches indicates good matchmaking"
      );
    } else if (analysis.qualityMatches < analysis.totalMatches * 0.3) {
      reasoning.push(
        "Low proportion of competitive matches - tolerance may need adjustment"
      );
    }

    reasoning.push(
      `Average ELO gap in matches: ${Math.round(analysis.averageEloGap)} points`
    );
    reasoning.push(
      `${analysis.qualityMatches} quality matches identified (${Math.round(
        (analysis.qualityMatches / analysis.totalMatches) * 100
      )}%)`
    );

    if (distribution.max - distribution.min > 600) {
      reasoning.push(
        "Wide ELO distribution detected - dynamic tolerance recommended"
      );
    }

    return {
      tolerance: analysis.optimalTolerance,
      reasoning,
      confidence: analysis.confidenceLevel,
      analysis,
    };
  }

  // Helper methods
  private calculateWinProbability(elo1: number, elo2: number): number {
    return 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  private getDefaultAnalysis(): SparringAnalysis {
    return {
      averageEloGap: 30,
      medianEloGap: 30,
      standardDeviation: 15,
      optimalTolerance: 30,
      confidenceLevel: 0.5,
      dataPoints: 0,
      qualityMatches: 0,
      totalMatches: 0,
    };
  }
}
