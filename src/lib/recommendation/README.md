# Intelligent Recommendation System

## Overview

The Gamefowl Guardian recommendation system uses a hybrid approach combining **Bayesian inference** and the **Elo rating system** to provide data-driven recommendations for:

1. **Derby Participation** - Select the best gamefowls for upcoming events
2. **Breeding Pairs** - Optimize genetic combinations for superior offspring
3. **Sparring Matches** - Create balanced training matchups with automatic ELO tolerance
4. **Conditioning Programs** - Personalize training based on bloodline and performance

## Architecture

### Core Components

1. **Elo Rating System** (`elo-calculator.ts`)

   - Dynamic performance ratings (default: 1000)
   - K-factor of 32 for volatile adjustments
   - Win probability calculations
   - Rating categories (Elite, Champion, Strong, etc.)

2. **Bayesian Analyzer** (`bayesian-analyzer.ts`)

   - Bloodline performance tracking
   - Breeding combination success rates
   - Conditioning program effectiveness
   - Continuous learning from new data

3. **Recommendation Engine** (`recommendation-engine.ts`)

   - Combines Elo and Bayesian analysis
   - Weighted scoring system
   - Context-aware recommendations
   - Risk factor identification

4. **Bayesian Updater** (`bayesian-updater.ts`)

   - Batch updates from historical data
   - Real-time updates after events
   - Prior belief persistence

5. **ELO Tolerance Calculator** (`elo-tolerance-calculator.ts`)
   - Automatic tolerance calculation based on historical data
   - Dynamic tolerance adjustment per gamefowl
   - Quality match analysis
   - ELO distribution tracking

## API Endpoints

### Derby Recommendations

```
POST /api/recommendations/derby
Body: {
  eventType: "THREE_COCK_DERBY" | "FOUR_COCK_DERBY" | etc.
  ageCategory: "STAG" | "BULLSTAG" | "COCK" | "ANY"
  opponentStrength?: number (Elo rating)
  timeToEvent?: number (days)
  limit?: number
}
```

### Breeding Recommendations

```
GET /api/recommendations/breeding?limit=10
```

### Sparring Recommendations

```
POST /api/recommendations/sparring
Body: {
  maxEloGap?: number
  minMatchBalance?: number  // Deprecated: use matchQuality instead
  matchQuality?: "excellent" | "balanced" | "competitive" | "all"  // User-friendly alternative
  bloodline?: string
  eloTolerance?: number (optional - auto-calculated if not provided)
  targetGamefowlId?: number
  useAutoTolerance?: boolean (default: true)
}
```

**Match Quality Options:**

- `excellent`: Very close ELO ratings (≤40 point gap, minMatchBalance: 0.9)
- `balanced`: Balanced matches (≤120 point gap, minMatchBalance: 0.7) - **Default**
- `competitive`: Competitive matches (≤200 point gap, minMatchBalance: 0.5)
- `all`: All possible matches (any gap, minMatchBalance: 0.0)

**Note:** The `matchQuality` parameter provides a user-friendly interface that automatically maps to appropriate `minMatchBalance` values. The raw `minMatchBalance` parameter is still supported for backward compatibility.

### ELO Tolerance Analysis

```
GET /api/recommendations/sparring/tolerance
Response: {
  tolerance: number
  confidence: number
  reasoning: string[]
  analysis: {
    averageEloGap: number
    medianEloGap: number
    standardDeviation: number
    optimalTolerance: number
    confidenceLevel: number
    dataPoints: number
    qualityMatches: number
    totalMatches: number
  }
  distribution: {
    min: number
    max: number
    mean: number
    median: number
    quartiles: { q1: number, q2: number, q3: number }
  }
}

POST /api/recommendations/sparring/tolerance
Body: {
  gamefowlElo?: number (for dynamic tolerance calculation)
}
```

### Conditioning Recommendations

```
GET /api/recommendations/conditioning?gamefowlId=123
```

### Update Elo Ratings

```
POST /api/sparring/update-elo
Body: {
  sparringId: number
}
```

### Update Bayesian Priors

```
POST /api/recommendations/update-priors
```

## Automatic ELO Tolerance System

### How It Works

The system automatically determines optimal ELO tolerance based on:

1. **Historical Match Analysis**

   - Analyzes last 500 sparring matches
   - Identifies "quality matches" (30-70% win probability)
   - Uses 75th percentile of quality match gaps

2. **Dynamic Adjustment**

   - Adjusts tolerance based on gamefowl's position in ELO distribution
   - Increases tolerance for gamefowls at extremes (top/bottom 25%)
   - Further adjusts based on available opponents

3. **Quality Metrics**
   - Tracks proportion of competitive matches
   - Provides confidence level (0-1) based on data quality
   - Minimum 20 data points for reliable analysis

### Tolerance Calculation Algorithm

```typescript
// Base tolerance from historical data
optimalTolerance = 75th percentile of quality match ELO gaps

// Dynamic adjustment for specific gamefowl
if (gamefowl in top/bottom 25% of ELO distribution) {
  tolerance *= 1.5
}

// Availability adjustment
if (available opponents < 3) {
  tolerance *= 1.5
} else if (available opponents < 5) {
  tolerance *= 1.25
}

// Cap at 150 ELO points
tolerance = min(150, tolerance)
```

## Scoring System

### Derby Selection Weights

- **Elo Rating**: 30%
- **Health Score**: 20%
- **Conditioning Score**: 20%
- **Bloodline Strength**: 15%
- **Recent Form**: 10%
- **Age Appropriateness**: 5%

### Health Score Calculation

- Recent vaccinations (within 6 months): 50%
- Recent deworming (within 3 months): 50%

### Conditioning Score

- Active conditioning program: 80%
- No conditioning: 0%
- Completed conditioning: 50%

## Bayesian Learning

The system continuously improves through:

1. **Bloodline Performance Updates**

   - Win/loss ratios by bloodline
   - Beta distribution for probability updates
   - Prior strength equivalent to 10 samples

2. **Breeding Combination Analysis**

   - Offspring performance tracking
   - Exponential moving average (α = 0.1)
   - Cross-bloodline compatibility scores

3. **Conditioning Effectiveness**
   - Program success by bloodline
   - Weighted updates (15% for new observations)
   - 90-day performance window

## Elo Rating System

### Rating Calculation

```
Expected Score = 1 / (1 + 10^((RatingB - RatingA) / 400))
Rating Change = K * (Actual - Expected)
```

### Rating Categories

- **Elite**: 1600+
- **Champion**: 1400-1599
- **Strong**: 1200-1399
- **Average**: 1000-1199
- **Developing**: 800-999
- **Beginner**: <800

## Best Practices

1. **Initial Setup**

   - Run `/api/recommendations/update-priors` to initialize from historical data
   - Ensure at least 5 sparring matches per gamefowl for reliable ratings
   - Allow system to accumulate 20+ sparring records for optimal ELO tolerance

2. **Continuous Improvement**

   - Update Elo ratings immediately after sparring matches
   - Periodically refresh Bayesian priors (weekly/monthly)
   - Monitor prediction accuracy through actual vs. predicted outcomes
   - Review automatic ELO tolerance effectiveness quarterly

3. **Context Considerations**
   - Adjust weights based on event importance
   - Consider time-to-event for conditioning readiness
   - Factor in opponent strength for derby selections
   - Trust automatic ELO tolerance unless specific requirements exist

## Future Enhancements

1. **Advanced Genetics**

   - Multi-generation pedigree analysis
   - Recessive trait tracking
   - Inbreeding coefficient calculations

2. **Environmental Factors**

   - Weather condition preferences
   - Arena type performance
   - Seasonal adjustments

3. **Machine Learning Integration**
   - Neural network for pattern recognition
   - Clustering for bloodline grouping
   - Time series analysis for form prediction

## Troubleshooting

### Common Issues

1. **No Recommendations Generated**

   - Check if gamefowls meet filter criteria
   - Ensure sufficient historical data exists
   - Verify Bayesian priors are initialized

2. **Inaccurate Predictions**

   - Update priors with recent data
   - Verify Elo ratings are current
   - Check for data quality issues

3. **Performance Issues**
   - Limit recommendation batch sizes
   - Implement caching for frequent queries
   - Optimize database queries with proper indexing
