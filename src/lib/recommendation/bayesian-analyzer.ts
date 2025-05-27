// Bayesian Analysis System for Gamefowl Recommendations

import { BayesianPrior } from "./types";

export class BayesianAnalyzer {
  private priors: BayesianPrior;
  private sampleSize: number = 0;

  constructor(initialPriors?: BayesianPrior) {
    this.priors = initialPriors || {
      bloodlineWinRates: {},
      bloodlineCombinations: {},
      conditioningEffectiveness: {},
      agePerformance: {},
      vaccineEffectiveness: {},
      dewormingEffectiveness: {},
      healthToPerformanceCorrelation: {},
    };
  }

  /**
   * Update bloodline win rate using Bayesian inference
   * @param bloodline Bloodline name
   * @param wins Number of wins
   * @param losses Number of losses
   */
  updateBloodlinePerformance(
    bloodline: string,
    wins: number,
    losses: number
  ): void {
    const total = wins + losses;
    if (total === 0) return;

    // Beta distribution parameters
    const alpha = wins + 1; // Prior success + observed success
    const beta = losses + 1; // Prior failure + observed failure

    // Update posterior mean
    const currentPrior = this.priors.bloodlineWinRates[bloodline] || 0.5;
    const observedRate = wins / total;

    // Weighted average based on sample size
    const weight = total / (total + 10); // 10 is the equivalent sample size of prior
    this.priors.bloodlineWinRates[bloodline] =
      weight * observedRate + (1 - weight) * currentPrior;
  }

  /**
   * Update bloodline combination success rate
   * @param sireBloodline Sire's bloodline
   * @param damBloodline Dam's bloodline
   * @param offspringPerformance Performance score (0-1)
   */
  updateBloodlineCombination(
    sireBloodline: string,
    damBloodline: string,
    offspringPerformance: number
  ): void {
    const key = this.getCombinationKey(sireBloodline, damBloodline);
    const currentPrior = this.priors.bloodlineCombinations[key] || 0.5;

    // Exponential moving average for continuous updates
    const alpha = 0.1; // Learning rate
    this.priors.bloodlineCombinations[key] =
      alpha * offspringPerformance + (1 - alpha) * currentPrior;
  }

  /**
   * Update conditioning program effectiveness for a bloodline
   * @param programId Conditioning program ID
   * @param bloodline Gamefowl bloodline
   * @param effectiveness Observed effectiveness (0-1)
   */
  updateConditioningEffectiveness(
    programId: string,
    bloodline: string,
    effectiveness: number
  ): void {
    if (!this.priors.conditioningEffectiveness[programId]) {
      this.priors.conditioningEffectiveness[programId] = {};
    }

    const currentPrior =
      this.priors.conditioningEffectiveness[programId][bloodline] || 0.5;

    // Weighted update based on confidence
    const weight = 0.15; // Higher weight for newer observations
    this.priors.conditioningEffectiveness[programId][bloodline] =
      weight * effectiveness + (1 - weight) * currentPrior;
  }

  /**
   * Calculate posterior probability for bloodline performance
   * @param bloodline Bloodline to analyze
   * @param recentPerformance Recent win rate (optional)
   * @returns Posterior probability of success
   */
  getBloodlinePosterior(
    bloodline: string,
    recentPerformance?: { wins: number; losses: number }
  ): number {
    const prior = this.priors.bloodlineWinRates[bloodline] || 0.5;

    if (!recentPerformance) return prior;

    const { wins, losses } = recentPerformance;
    const total = wins + losses;

    if (total === 0) return prior;

    // Bayesian update with Beta-Binomial conjugate
    const alpha = prior * 10 + wins; // Prior strength of 10 samples
    const beta = (1 - prior) * 10 + losses;

    return alpha / (alpha + beta);
  }

  /**
   * Calculate breeding pair compatibility score
   * @param sireBloodline Sire's bloodline
   * @param damBloodline Dam's bloodline
   * @param sirePerformance Sire's performance data
   * @param damPerformance Dam's performance data
   * @returns Compatibility score (0-1)
   */
  calculateBreedingCompatibility(
    sireBloodline: string,
    damBloodline: string,
    sirePerformance: number,
    damPerformance: number
  ): number {
    const combinationKey = this.getCombinationKey(sireBloodline, damBloodline);
    const historicalSuccess =
      this.priors.bloodlineCombinations[combinationKey] || 0.5;

    // Individual bloodline strengths
    const sireStrength = this.priors.bloodlineWinRates[sireBloodline] || 0.5;
    const damStrength = this.priors.bloodlineWinRates[damBloodline] || 0.5;

    // Weighted combination
    const weights = {
      historical: 0.4,
      sireStrength: 0.2,
      damStrength: 0.2,
      sirePerformance: 0.1,
      damPerformance: 0.1,
    };

    return (
      weights.historical * historicalSuccess +
      weights.sireStrength * sireStrength +
      weights.damStrength * damStrength +
      weights.sirePerformance * sirePerformance +
      weights.damPerformance * damPerformance
    );
  }

  /**
   * Predict conditioning program effectiveness
   * @param programId Conditioning program ID
   * @param bloodline Gamefowl bloodline
   * @param currentCondition Current condition score (0-1)
   * @returns Expected improvement probability
   */
  predictConditioningSuccess(
    programId: string,
    bloodline: string,
    currentCondition: number
  ): number {
    const programData = this.priors.conditioningEffectiveness[programId];
    if (!programData) return 0.5; // No data, assume average

    const bloodlineEffectiveness = programData[bloodline];
    if (bloodlineEffectiveness !== undefined) {
      // Direct match found
      return bloodlineEffectiveness * (1 - currentCondition);
    }

    // Use average effectiveness across all bloodlines for this program
    const avgEffectiveness = this.calculateAverage(Object.values(programData));
    return avgEffectiveness * (1 - currentCondition);
  }

  /**
   * Calculate confidence interval for a prediction
   * @param mean Predicted mean value
   * @param sampleSize Number of observations
   * @returns Confidence interval (95%)
   */
  calculateConfidenceInterval(
    mean: number,
    sampleSize: number
  ): { lower: number; upper: number; confidence: number } {
    if (sampleSize === 0) {
      return { lower: 0, upper: 1, confidence: 0 };
    }

    // Using Wilson score interval for binomial proportion
    const z = 1.96; // 95% confidence
    const n = sampleSize;
    const p = mean;

    const denominator = 1 + (z * z) / n;
    const centre = (p + (z * z) / (2 * n)) / denominator;
    const margin =
      (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;

    return {
      lower: Math.max(0, centre - margin),
      upper: Math.min(1, centre + margin),
      confidence: Math.min(1, sampleSize / 30), // Confidence grows with sample size
    };
  }

  /**
   * Update vaccine effectiveness for a bloodline
   * @param bloodline Gamefowl bloodline
   * @param vaccine Vaccine name
   * @param healthOutcome Health score after vaccination (0-1)
   */
  updateVaccineEffectiveness(
    bloodline: string,
    vaccine: string,
    healthOutcome: number
  ): void {
    if (!this.priors.vaccineEffectiveness[bloodline]) {
      this.priors.vaccineEffectiveness[bloodline] = {};
    }

    const currentPrior =
      this.priors.vaccineEffectiveness[bloodline][vaccine] || 0.7; // Default effectiveness

    // Weighted update
    const weight = 0.1;
    this.priors.vaccineEffectiveness[bloodline][vaccine] =
      weight * healthOutcome + (1 - weight) * currentPrior;
  }

  /**
   * Update deworming effectiveness for a bloodline
   * @param bloodline Gamefowl bloodline
   * @param effectiveness Observed effectiveness (0-1)
   */
  updateDewormingEffectiveness(bloodline: string, effectiveness: number): void {
    const currentPrior = this.priors.dewormingEffectiveness[bloodline] || 0.8;

    // Weighted update
    const weight = 0.15;
    this.priors.dewormingEffectiveness[bloodline] =
      weight * effectiveness + (1 - weight) * currentPrior;
  }

  /**
   * Update health to performance correlation
   * @param bloodline Gamefowl bloodline
   * @param healthScore Current health score
   * @param performanceScore Fight performance score
   */
  updateHealthPerformanceCorrelation(
    bloodline: string,
    healthScore: number,
    performanceScore: number
  ): void {
    const currentCorrelation =
      this.priors.healthToPerformanceCorrelation[bloodline] || 0.5;

    // Calculate correlation factor
    const correlationFactor = healthScore * performanceScore;

    // Weighted update
    const weight = 0.1;
    this.priors.healthToPerformanceCorrelation[bloodline] =
      weight * correlationFactor + (1 - weight) * currentCorrelation;
  }

  /**
   * Get vaccine effectiveness for a bloodline
   * @param bloodline Gamefowl bloodline
   * @param vaccine Vaccine name
   * @returns Effectiveness score (0-1)
   */
  getVaccineEffectiveness(bloodline: string, vaccine: string): number {
    if (this.priors.vaccineEffectiveness[bloodline]?.[vaccine]) {
      return this.priors.vaccineEffectiveness[bloodline][vaccine];
    }

    // Check if we have data for this vaccine across other bloodlines
    let totalEffectiveness = 0;
    let count = 0;

    for (const bl in this.priors.vaccineEffectiveness) {
      if (this.priors.vaccineEffectiveness[bl][vaccine] !== undefined) {
        totalEffectiveness += this.priors.vaccineEffectiveness[bl][vaccine];
        count++;
      }
    }

    return count > 0 ? totalEffectiveness / count : 0.7; // Default to 0.7 if no data
  }

  /**
   * Predict health impact on performance
   * @param bloodline Gamefowl bloodline
   * @param currentHealthScore Current health score
   * @returns Expected performance multiplier
   */
  predictHealthImpact(bloodline: string, currentHealthScore: number): number {
    const correlation =
      this.priors.healthToPerformanceCorrelation[bloodline] || 0.5;

    // Health impact follows a sigmoid curve
    const baseImpact = 1 / (1 + Math.exp(-10 * (currentHealthScore - 0.5)));

    // Adjust based on bloodline-specific correlation
    return baseImpact * (0.5 + correlation);
  }

  /**
   * Get prior beliefs summary
   * @returns Summary of current Bayesian priors
   */
  getPriorsSummary(): {
    topBloodlines: Array<{ bloodline: string; winRate: number }>;
    bestCombinations: Array<{ combination: string; successRate: number }>;
    effectivePrograms: Array<{ program: string; avgEffectiveness: number }>;
    healthInsights: {
      vaccineResponsiveness: Array<{ bloodline: string; avgResponse: number }>;
      dewormingResponsiveness: Array<{
        bloodline: string;
        effectiveness: number;
      }>;
      healthPerformanceCorrelation: Array<{
        bloodline: string;
        correlation: number;
      }>;
    };
  } {
    // Top bloodlines by win rate
    const topBloodlines = Object.entries(this.priors.bloodlineWinRates)
      .map(([bloodline, winRate]) => ({ bloodline, winRate }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10);

    // Best breeding combinations
    const bestCombinations = Object.entries(this.priors.bloodlineCombinations)
      .map(([combination, successRate]) => ({ combination, successRate }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    // Most effective conditioning programs
    const effectivePrograms = Object.entries(
      this.priors.conditioningEffectiveness
    )
      .map(([program, bloodlineData]) => ({
        program,
        avgEffectiveness: this.calculateAverage(Object.values(bloodlineData)),
      }))
      .sort((a, b) => b.avgEffectiveness - a.avgEffectiveness);

    // Health insights
    const vaccineResponsiveness = Object.entries(
      this.priors.vaccineEffectiveness
    )
      .map(([bloodline, vaccines]) => ({
        bloodline,
        avgResponse: this.calculateAverage(Object.values(vaccines)),
      }))
      .sort((a, b) => b.avgResponse - a.avgResponse);

    const dewormingResponsiveness = Object.entries(
      this.priors.dewormingEffectiveness
    )
      .map(([bloodline, effectiveness]) => ({ bloodline, effectiveness }))
      .sort((a, b) => b.effectiveness - a.effectiveness);

    const healthPerformanceCorrelation = Object.entries(
      this.priors.healthToPerformanceCorrelation
    )
      .map(([bloodline, correlation]) => ({ bloodline, correlation }))
      .sort((a, b) => b.correlation - a.correlation);

    return {
      topBloodlines,
      bestCombinations,
      effectivePrograms,
      healthInsights: {
        vaccineResponsiveness,
        dewormingResponsiveness,
        healthPerformanceCorrelation,
      },
    };
  }

  /**
   * Helper method to create combination key
   */
  private getCombinationKey(sire: string, dam: string): string {
    return `${sire}:${dam}`;
  }

  /**
   * Helper method to calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Export priors for persistence
   */
  exportPriors(): BayesianPrior {
    return JSON.parse(JSON.stringify(this.priors));
  }

  /**
   * Import priors from storage
   */
  importPriors(priors: BayesianPrior): void {
    this.priors = priors;
  }
}
