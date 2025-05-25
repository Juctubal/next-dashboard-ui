import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";
import { ConditioningRecommendation } from "@/lib/recommendation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, bloodline, timeToEvent, intensity } = body;

    // Get gamefowls based on filters
    const gamefowls = await prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "CONDITIONING"],
        },
        ...(bloodline && { bloodline }),
      },
      take: 10, // Limit to 10 gamefowls
    });

    const engine = new RecommendationEngine(prisma);
    const allRecommendations: ConditioningRecommendation[] = [];

    // Get recommendations for each gamefowl
    for (const gamefowl of gamefowls) {
      const recommendations = await engine.recommendConditioningPrograms(
        gamefowl.id
      );

      // Apply intensity filter if provided
      let filteredRecs = recommendations;
      if (intensity) {
        filteredRecs = recommendations.filter(
          (rec) => rec.customizations.intensity === intensity
        );
      }

      // Add the best recommendation for this gamefowl
      if (filteredRecs.length > 0) {
        allRecommendations.push(filteredRecs[0]);
      }
    }

    return NextResponse.json({
      success: true,
      data: allRecommendations,
    });
  } catch (error) {
    console.error("Error generating conditioning recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate conditioning recommendations",
      },
      { status: 500 }
    );
  }
}

// Keep GET for backward compatibility
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gamefowlId = searchParams.get("gamefowlId");

    if (!gamefowlId) {
      return NextResponse.json(
        {
          success: false,
          error: "gamefowlId is required",
        },
        { status: 400 }
      );
    }

    const engine = new RecommendationEngine(prisma);
    const recommendations = await engine.recommendConditioningPrograms(
      parseInt(gamefowlId)
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating conditioning recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate conditioning recommendations",
      },
      { status: 500 }
    );
  }
}
