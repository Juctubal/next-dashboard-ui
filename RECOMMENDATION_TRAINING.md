# Recommendation System Training Guide

This guide explains how to generate training data and train the AI recommendation models for the gamefowl management system.

## Overview

The recommendation system uses:

- **Elo Rating System**: For calculating competitive strength
- **Bayesian Analysis**: For learning from historical data patterns
- **Machine Learning**: For predicting outcomes and making recommendations

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
# Make sure your dev server is running first
npm run dev

# In another terminal, run:
npm run update:priors
```

This analyzes the training data and updates:

- Bloodline win rates
- Bloodline combination success rates
- Conditioning program effectiveness per bloodline
- Age category performance metrics

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
- Considers health and conditioning readiness
- Matches gamefowl characteristics to event requirements
- Predicts win probability based on historical data
- Recommends the exact number of gamefowls required for the event type

### 2. Breeding Pairs

- Evaluates genetic compatibility based on bloodline combinations
- Predicts expected offspring Elo rating
- Calculates genetic diversity score
- Uses historical breeding success rates

### 3. Sparring Matches

- Finds balanced matchups based on Elo ratings
- Maximizes learning value while minimizing injury risk
- Considers bloodline matchup history
- Ensures competitive balance

### 4. Conditioning Programs

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

## Monitoring Model Performance

After training, monitor the recommendation quality by:

1. Checking prediction accuracy against actual results
2. Reviewing Elo rating changes over time
3. Analyzing breeding success rates
4. Tracking conditioning program effectiveness

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
