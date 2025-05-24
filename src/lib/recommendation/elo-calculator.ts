// Elo Rating System Calculator

export class EloCalculator {
  private static readonly K_FACTOR = 32; // Higher K-factor for more volatile ratings
  private static readonly INITIAL_RATING = 1000;

  /**
   * Calculate new Elo ratings after a match
   * @param winnerRating Current Elo rating of the winner
   * @param loserRating Current Elo rating of the loser
   * @returns Object containing new ratings and changes
   */
  static calculateNewRatings(
    winnerRating: number,
    loserRating: number
  ): {
    newWinnerRating: number;
    newLoserRating: number;
    winnerChange: number;
    loserChange: number;
  } {
    // Calculate expected scores
    const expectedWinner = this.getExpectedScore(winnerRating, loserRating);
    const expectedLoser = this.getExpectedScore(loserRating, winnerRating);

    // Calculate rating changes
    const winnerChange = Math.round(this.K_FACTOR * (1 - expectedWinner));
    const loserChange = Math.round(this.K_FACTOR * (0 - expectedLoser));

    return {
      newWinnerRating: winnerRating + winnerChange,
      newLoserRating: loserRating + loserChange,
      winnerChange,
      loserChange,
    };
  }

  /**
   * Calculate expected score (win probability) for player A against player B
   * @param ratingA Player A's rating
   * @param ratingB Player B's rating
   * @returns Expected score (0-1)
   */
  static getExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calculate win probability percentage
   * @param ratingA Player A's rating
   * @param ratingB Player B's rating
   * @returns Win probability as percentage (0-100)
   */
  static getWinProbability(ratingA: number, ratingB: number): number {
    return Math.round(this.getExpectedScore(ratingA, ratingB) * 100);
  }

  /**
   * Get performance rating based on win rate and opponent strength
   * @param wins Number of wins
   * @param losses Number of losses
   * @param avgOpponentRating Average rating of opponents faced
   * @returns Estimated performance rating
   */
  static getPerformanceRating(
    wins: number,
    losses: number,
    avgOpponentRating: number
  ): number {
    const totalGames = wins + losses;
    if (totalGames === 0) return this.INITIAL_RATING;

    const winRate = wins / totalGames;
    const ratingDiff = 400 * Math.log10(winRate / (1 - winRate));

    return Math.round(avgOpponentRating + ratingDiff);
  }

  /**
   * Calculate rating adjustment for draw (if applicable)
   * @param ratingA Player A's rating
   * @param ratingB Player B's rating
   * @returns Rating changes for both players
   */
  static calculateDrawRatings(
    ratingA: number,
    ratingB: number
  ): {
    changeA: number;
    changeB: number;
    newRatingA: number;
    newRatingB: number;
  } {
    const expectedA = this.getExpectedScore(ratingA, ratingB);
    const expectedB = this.getExpectedScore(ratingB, ratingA);

    const changeA = Math.round(this.K_FACTOR * (0.5 - expectedA));
    const changeB = Math.round(this.K_FACTOR * (0.5 - expectedB));

    return {
      changeA,
      changeB,
      newRatingA: ratingA + changeA,
      newRatingB: ratingB + changeB,
    };
  }

  /**
   * Get rating category based on Elo rating
   * @param rating Current Elo rating
   * @returns Rating category
   */
  static getRatingCategory(rating: number): string {
    if (rating >= 1600) return "Elite";
    if (rating >= 1400) return "Champion";
    if (rating >= 1200) return "Strong";
    if (rating >= 1000) return "Average";
    if (rating >= 800) return "Developing";
    return "Beginner";
  }

  /**
   * Calculate expected Elo for offspring based on parent ratings
   * @param sireRating Sire's Elo rating
   * @param damRating Dam's Elo rating
   * @param variance Genetic variance factor (0-1)
   * @returns Expected offspring rating range
   */
  static calculateOffspringPotential(
    sireRating: number,
    damRating: number,
    variance: number = 0.15
  ): {
    expected: number;
    min: number;
    max: number;
  } {
    const expected = Math.round((sireRating + damRating) / 2);
    const varianceAmount = Math.round(expected * variance);

    return {
      expected,
      min: expected - varianceAmount,
      max: expected + varianceAmount,
    };
  }
}
