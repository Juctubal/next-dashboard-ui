// Recommendation System Types

export interface GamefowlPerformanceData {
  id: number;
  name: string;
  bloodline: string;
  sex: string;
  eloRating: number;
  totalFights: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  healthScore: number;
  conditioningScore: number;
  ageCategory: string;
  recentFormScore: number; // Based on last 5 fights
  bloodlineStrength: number; // Bayesian derived
  gamefowlData?: any; // Full gamefowl data including vaccine, deworming, conditioning
  eventWins?: number; // Number of event wins
  eventParticipations?: number; // Total event participations
}

export interface BreedingPairRecommendation {
  sireId: number;
  damId: number;
  sireName: string;
  damName: string;
  compatibilityScore: number;
  bloodlineCombinationSuccess: number;
  geneticDiversityScore: number;
  strengthIndicators: {
    sparringRecord: boolean;
    healthStatus: boolean;
    conditioning: boolean;
    activity: boolean;
    temperament: boolean;
    damSharesSuccessfulBloodline?: boolean;
    sireEventWins?: boolean;
  };
  reasons: string[];
}

export interface DerbyRecommendation {
  gamefowlId: number;
  gamefowlName: string;
  bloodline: string;
  currentElo: number;
  conditionReadiness: number;
  healthReadiness: number;
  overallScore: number;
  reasons: string[];
  riskFactors: string[];
}

export interface SparringMatchRecommendation {
  gamefowl1Id: number;
  gamefowl2Id: number;
  gamefowl1Name: string;
  gamefowl2Name: string;
  gamefowl1Elo: number;
  gamefowl2Elo: number;
  gamefowl1TrackRecord: string;
  gamefowl2TrackRecord: string;
  gamefowl1WinProbability: number;
  gamefowl2WinProbability: number;
  eloGap: number;
  matchBalance: number; // 0-1, where 1 is perfectly balanced
  expectedLearningValue: number;
  matchingCriteria: {
    trackRecordSimilarity: boolean;
    eloWithinTolerance: boolean;
    conditioningMatch: boolean;
    previousOutcomes: boolean;
  };
  reasons: string[];
}

export interface ConditioningRecommendation {
  gamefowlId: number;
  gamefowlName: string;
  recommendedProgramId: number;
  programName: string;
  conditioningType?: string;
  durationDays?: number;
  customizations: {
    duration: number;
  };
  reasons: string[];
}

export interface BayesianPrior {
  bloodlineWinRates: Record<string, number>;
  bloodlineCombinations: Record<string, number>;
  conditioningEffectiveness: Record<string, Record<string, number>>; // programId -> bloodline -> effectiveness
  agePerformance: Record<string, number>;
  vaccineEffectiveness: Record<string, Record<string, number>>; // bloodline -> vaccine -> effectiveness
  dewormingEffectiveness: Record<string, number>; // bloodline -> effectiveness
  healthToPerformanceCorrelation: Record<string, number>; // bloodline -> correlation
}

export interface RecommendationContext {
  eventType?:
    | "THREE_COCK_DERBY"
    | "FOUR_COCK_DERBY"
    | "FIVE_COCK_DERBY"
    | "SOLO"
    | "OTHER";
  ageCategory?: "STAG" | "BULLSTAG" | "COCK" | "ANY";
  timeToEvent?: number; // Days until event
}

export interface RecommendationWeights {
  eloWeight: number;
  healthWeight: number;
  conditioningWeight: number;
  bloodlineWeight: number;
  recentFormWeight: number;
  ageWeight: number;
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  eloWeight: 0.3,
  healthWeight: 0.2,
  conditioningWeight: 0.2,
  bloodlineWeight: 0.15,
  recentFormWeight: 0.1,
  ageWeight: 0.05,
};
