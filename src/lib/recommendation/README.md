# Intelligent Recommendation System

## Overview

The Gamefowl Guardian recommendation system uses a hybrid approach combining **Bayesian inference** and the **Elo rating system** to provide data-driven recommendations for:

1. **Derby Participation** - Select the best gamefowls for upcoming events
2. **Breeding Pairs** - Optimize genetic combinations for superior offspring
3. **Sparring Matches** - Create balanced training matchups
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
GET /api/recommendations/sparring?limit=10
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

2. **Continuous Improvement**

   - Update Elo ratings immediately after sparring matches
   - Periodically refresh Bayesian priors (weekly/monthly)
   - Monitor prediction accuracy through actual vs. predicted outcomes

3. **Context Considerations**
   - Adjust weights based on event importance
   - Consider time-to-event for conditioning readiness
   - Factor in opponent strength for derby selections

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
