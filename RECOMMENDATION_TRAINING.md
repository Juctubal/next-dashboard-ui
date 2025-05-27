# Recommendation System Training Guide

This guide explains how to generate training data and train the AI recommendation models for the gamefowl management system.

## Overview

The recommendation system uses:

- **Elo Rating System**: For calculating competitive strength
- **Bayesian Analysis**: For learning from historical data patterns
- **Machine Learning**: For predicting outcomes and making recommendations
- **Health Data Integration**: For factoring in vaccine and deworming schedules

## Training Data Generation

### Step 1: Generate Sample Data

Run the following command to generate comprehensive training data:

```bash
npm run seed:recommendations
```

This will create:

- **250 Gamefowls** (200 males, 50 females) across 10 different bloodlines
- **30 Past Events** with complete results for training
  - Each event has 1 participant (handler/owner)
  - Three-Cock Derby: 3 gamefowls per event
  - Four-Cock Derby: 4 gamefowls per event
  - Five-Cock Derby: 5 gamefowls per event
- **500 Sparring Records** with Elo rating updates
- **100 Breeding Records** for bloodline combination analysis
- **35 Conditioning Records**:
  - All linked to specific events (1:1 relationship)
  - Each event has exactly one conditioning program
- **75 Total Events**:
  - 30 past events (finished with results)
  - 35 events with conditioning programs
  - 10 general upcoming events
- **Vaccine Records** (thousands):
  - Age-based vaccination schedule
  - Multiple vaccine types with realistic timing
  - Annual boosters for older birds
- **Deworming Records** (thousands):
  - Regular deworming schedules based on age
  - Pre-conditioning deworming
  - Different intervals for young vs mature birds

### Health Management Data

The system now tracks comprehensive health data:

#### Vaccine Schedule:

- **Marek's Disease**: Day 1
- **Newcastle Disease (B1B1)**: Day 7 and 21
- **Infectious Bronchitis**: Day 14
- **Fowl Pox**: Day 35
- **Newcastle Disease (Lasota)**: Day 60 and 120
- **Fowl Cholera**: Day 90
- **Annual Boosters**: Yearly for birds over 1 year

#### Deworming Schedule:

- **First deworming**: 21 days old
- **Young birds (< 6 months)**: Every 45 days
- **Mature birds (> 6 months)**: Every 90 days
- **Pre-conditioning**: 7 days before conditioning starts

### Conditioning and Status Management

The training data implements realistic status transitions with a strict one-to-one relationship between conditioning records and events:

#### Event-Conditioning Relationship:

- **Every conditioning record MUST have an associated event**
- **Each event can have at most ONE conditioning record**
- This ensures proper tracking and management of gamefowl preparation

#### When Gamefowl is Added to Conditioning:

- Status changes to `CONDITIONING`
- Gamefowl is being prepared for a specific event

#### When Conditioning is Completed:

- Gamefowl status changes to `COMPETING`
- Ready for the specific event

This creates a realistic workflow where:

1. **Event is Created** → Assigned to a handler
2. **Conditioning Program Started** → Linked to the event
3. **Gamefowls Selected** → Status changes to `CONDITIONING`
4. **Program Completed** → Status changes to `COMPETING`
5. **After Event** → Status returns to `IDLE` or `DECEASED` (if lost)

### Step 2: Update Bayesian Priors

After seeding the data, update the Bayesian priors:

```bash
# Option 1: Update via API (requires dev server running)
npm run dev  # In one terminal
npm run update:priors  # In another terminal

# Option 2: Update standalone (no server required)
npm run update:priors:standalone
```

Both options update all types of priors:

- **Performance Priors**: Bloodline win rates and fight statistics
- **Breeding Priors**: Bloodline combination success rates
- **Conditioning Priors**: Program effectiveness by bloodline
- **Health Priors**:
  - Vaccine effectiveness by bloodline
  - Deworming effectiveness patterns
  - Health-performance correlations

The update process will:

- Analyze vaccine compliance and effectiveness by bloodline
- Track deworming effectiveness patterns
- Calculate health-performance correlations
- Generate insights about which bloodlines respond best to health protocols
- Update bloodline win rates
- Calculate bloodline combination success rates
- Measure conditioning program effectiveness per bloodline
- Determine age category performance metrics

**Note**: Use the standalone option if:

- You're running the update as part of a build process
- The dev server isn't available
- You want to update priors without API dependencies

## Data Characteristics

### Bloodline Performance Profiles

The training data includes realistic performance characteristics for each bloodline:

| Bloodline | Base Elo | Win Rate | Aggression | Endurance |
| --------- | -------- | -------- | ---------- | --------- |
| Kelso     | 1250     | 70%      | 0.70       | 0.85      |
| Butcher   | 1240     | 69%      | 0.90       | 0.60      |
| Radio     | 1230     | 67%      | 0.78       | 0.72      |
| Sweater   | 1220     | 68%      | 0.75       | 0.80      |
| Grey      | 1210     | 66%      | 0.72       | 0.78      |
| Hatch     | 1200     | 65%      | 0.80       | 0.70      |
| McLean    | 1200     | 65%      | 0.73       | 0.77      |
| Albany    | 1190     | 64%      | 0.70       | 0.75      |
| Roundhead | 1180     | 62%      | 0.85       | 0.65      |
| Lemon     | 1170     | 60%      | 0.65       | 0.70      |

### Elo Rating System

- **K-factor**: 32 (standard for moderate volatility)
- **Base Rating**: 1000 for new gamefowls
- **Rating Range**: Typically 900-1400 after training

### Event Types Distribution

- Three-Cock Derby: 33% (3 gamefowls per event)
- Four-Cock Derby: 33% (4 gamefowls per event)
- Five-Cock Derby: 34% (5 gamefowls per event)

Each event represents one participant entering their required number of gamefowls.

## How the Recommendations Work

### 1. Derby Selection

- Analyzes gamefowl Elo ratings and recent performance
- **Evaluates health readiness based on vaccination and deworming status**
- **Applies bloodline-specific health impact multipliers**
- Considers health and conditioning readiness
- Matches gamefowl characteristics to event requirements
- Predicts win probability based on historical data
- Recommends the exact number of gamefowls required for the event type

### 2. Health Score Calculation

The health score (0-1) is calculated based on:

- **Vaccination Status (50% of score)**:
  - Up-to-date vaccines based on age requirements
  - Freshness bonus for recent vaccinations
  - Penalties for missing critical vaccines (Newcastle Disease)
- **Deworming Status (50% of score)**:
  - Regular deworming compliance
  - Age-appropriate intervals
  - Pre-conditioning deworming bonus

### 3. Bayesian Health Analysis

The system learns health patterns:

- **Vaccine Effectiveness**: Tracks how different bloodlines respond to vaccines
- **Deworming Effectiveness**: Monitors parasite resistance by bloodline
- **Health-Performance Correlation**: Learns how health impacts fight performance per bloodline

### 4. Breeding Pairs

- Evaluates genetic compatibility based on bloodline combinations
- Predicts expected offspring Elo rating
- Calculates genetic diversity score
- Uses historical breeding success rates

### 5. Sparring Matches

- Finds balanced matchups based on Elo ratings
- Maximizes learning value while minimizing injury risk
- Considers bloodline matchup history
- Ensures competitive balance

### 6. Conditioning Programs

- Matches program intensity to gamefowl needs
- Considers time until next event
- Analyzes bloodline-specific program effectiveness
- Customizes duration and focus areas

## Customizing Training Data

To modify the training data characteristics, edit `prisma/seed-recommendations.ts`:

1. **Bloodline Characteristics**: Modify the `bloodlineCharacteristics` object
2. **Data Volume**: Adjust the loop counts for more/fewer records
3. **Date Ranges**: Modify faker date generation parameters
4. **Win Probabilities**: Adjust the randomness factors in result generation
5. **Vaccine Types**: Modify the `vaccineTypes` array for different vaccines
6. **Deworming Medicines**: Update the `dewormingMedicines` array

## Monitoring Model Performance

After training, monitor the recommendation quality by:

1. Checking prediction accuracy against actual results
2. Reviewing Elo rating changes over time
3. Analyzing breeding success rates
4. Tracking conditioning program effectiveness
5. **Monitoring health score correlations with performance**
6. **Reviewing vaccine and deworming compliance rates**

## Health Data Integration

The recommendation engine now considers:

1. **Vaccine Compliance**: Gamefowls with up-to-date vaccines receive higher health scores
2. **Deworming Schedule**: Regular deworming improves health readiness
3. **Bloodline Health Patterns**: Some bloodlines may respond better to certain health protocols
4. **Pre-event Health Checks**: System prioritizes well-maintained gamefowls for events

## Troubleshooting

### Common Issues

1. **"Failed to update priors"**: Ensure the dev server is running on port 3000
2. **Database errors**: Run `npx prisma migrate dev` to ensure schema is up to date
3. **Insufficient data**: Increase record counts in the seed script

### Resetting Data

To start fresh:

```bash
# Reset database
npx prisma migrate reset

# Re-seed with training data
npm run seed:recommendations

# Update priors
npm run update:priors
```

## Best Practices

1. **Regular Updates**: Update priors weekly as new real data comes in
2. **Data Quality**: Ensure accurate result recording for better predictions
3. **Balanced Data**: Maintain diverse representation across bloodlines
4. **Performance Monitoring**: Track recommendation accuracy over time
5. **Health Records**: Keep accurate vaccination and deworming records
6. **Bloodline Health Tracking**: Monitor health patterns per bloodline

## Advanced Configuration

For production use, consider:

1. Increasing training data volume (10x current amounts)
2. Adding seasonal performance variations
3. Implementing cross-validation for model accuracy
4. Setting up automated prior updates

## Support

For questions or issues with the recommendation system:

1. Check the API logs for detailed error messages
2. Verify data integrity in the database
3. Ensure all required fields are populated
4. Review the Bayesian prior calculations in the API endpoints
