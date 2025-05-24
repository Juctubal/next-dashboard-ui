import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EloCalculator } from "@/lib/recommendation/elo-calculator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sparringId } = body;

    if (!sparringId) {
      return NextResponse.json(
        {
          success: false,
          error: "sparringId is required",
        },
        { status: 400 }
      );
    }

    // Get the sparring match details
    const sparring = await prisma.sparring.findUnique({
      where: { id: sparringId },
      include: {
        winner: true,
        loser: true,
      },
    });

    if (!sparring) {
      return NextResponse.json(
        {
          success: false,
          error: "Sparring match not found",
        },
        { status: 404 }
      );
    }

    // Check if Elo has already been updated (non-zero changes)
    if (sparring.winner_elo_change !== 0 || sparring.loser_elo_change !== 0) {
      return NextResponse.json({
        success: true,
        message: "Elo ratings already updated",
        data: {
          winner: {
            id: sparring.winner.id,
            name: sparring.winner.name,
            newRating: sparring.winner.eloRating,
            change: sparring.winner_elo_change,
          },
          loser: {
            id: sparring.loser.id,
            name: sparring.loser.name,
            newRating: sparring.loser.eloRating,
            change: sparring.loser_elo_change,
          },
        },
      });
    }

    // Calculate new Elo ratings
    const { newWinnerRating, newLoserRating, winnerChange, loserChange } =
      EloCalculator.calculateNewRatings(
        sparring.winner.eloRating,
        sparring.loser.eloRating
      );

    // Update the database
    await prisma.$transaction([
      // Update winner's Elo
      prisma.gamefowl.update({
        where: { id: sparring.winnerId },
        data: { eloRating: newWinnerRating },
      }),
      // Update loser's Elo
      prisma.gamefowl.update({
        where: { id: sparring.loserId },
        data: { eloRating: newLoserRating },
      }),
      // Update sparring record with Elo changes
      prisma.sparring.update({
        where: { id: sparringId },
        data: {
          winner_elo_change: winnerChange,
          loser_elo_change: loserChange,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Elo ratings updated successfully",
      data: {
        winner: {
          id: sparring.winner.id,
          name: sparring.winner.name,
          previousRating: sparring.winner.eloRating,
          newRating: newWinnerRating,
          change: winnerChange,
          category: EloCalculator.getRatingCategory(newWinnerRating),
        },
        loser: {
          id: sparring.loser.id,
          name: sparring.loser.name,
          previousRating: sparring.loser.eloRating,
          newRating: newLoserRating,
          change: loserChange,
          category: EloCalculator.getRatingCategory(newLoserRating),
        },
      },
    });
  } catch (error) {
    console.error("Error updating Elo ratings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update Elo ratings",
      },
      { status: 500 }
    );
  }
}
