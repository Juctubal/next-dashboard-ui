import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EloToleranceCalculator } from "@/lib/recommendation/elo-tolerance-calculator";

export async function GET(request: NextRequest) {
  try {
    const calculator = new EloToleranceCalculator(prisma);

    // Get tolerance recommendation with full analysis
    const recommendation = await calculator.getToleranceRecommendation();

    // Get ELO distribution
    const distribution = await calculator.getEloDistribution();

    return NextResponse.json({
      success: true,
      data: {
        tolerance: recommendation.tolerance,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning,
        analysis: recommendation.analysis,
        distribution,
      },
    });
  } catch (error) {
    console.error("Error calculating ELO tolerance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate ELO tolerance",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gamefowlElo } = body;

    const calculator = new EloToleranceCalculator(prisma);

    if (gamefowlElo !== undefined) {
      // Calculate dynamic tolerance for specific ELO
      const tolerance = await calculator.calculateDynamicTolerance(gamefowlElo);
      const distribution = await calculator.getEloDistribution();

      return NextResponse.json({
        success: true,
        data: {
          tolerance,
          gamefowlElo,
          distribution,
          message: `Dynamic tolerance calculated for ELO ${gamefowlElo}`,
        },
      });
    } else {
      // Return general tolerance analysis
      const analysis = await calculator.calculateOptimalTolerance();

      return NextResponse.json({
        success: true,
        data: analysis,
      });
    }
  } catch (error) {
    console.error("Error calculating ELO tolerance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate ELO tolerance",
      },
      { status: 500 }
    );
  }
}
