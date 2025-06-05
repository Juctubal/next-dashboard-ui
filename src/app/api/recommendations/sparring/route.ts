import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";
import { SparringMatchRecommendation } from "@/lib/recommendation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      maxEloGap = 200,
      minMatchBalance = 0.7, // 0.9=Excellent, 0.7=Balanced, 0.5=Competitive, 0.0=All
      bloodline,
      eloTolerance,
      targetGamefowlId,
      useAutoTolerance = true, // Default to automatic tolerance
    } = body;

    console.log("Request body:", body); // Debug log

    const engine = new RecommendationEngine(prisma);
    let recommendations;

    // Use automatic tolerance if not provided and useAutoTolerance is true
    const toleranceParam =
      !useAutoTolerance && eloTolerance !== undefined
        ? eloTolerance
        : undefined;

    console.log("Tolerance param:", toleranceParam); // Debug log

    if (targetGamefowlId) {
      recommendations = await engine.recommendSparringPartnersForGamefowl(
        parseInt(targetGamefowlId),
        20,
        toleranceParam
      );
    } else {
      recommendations = await engine.recommendSparringMatches(
        20,
        toleranceParam
      );
    }

    console.log("Initial recommendations count:", recommendations.length); // Debug log

    // Get additional information for each recommendation
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const gamefowl1 = await prisma.gamefowl.findUnique({
          where: { id: rec.gamefowl1Id },
          include: {
            sparring_winner: true,
            sparring_loser: true,
            conditioning: {
              orderBy: { id: "desc" },
              take: 1,
            },
          },
        });
        const gamefowl2 = await prisma.gamefowl.findUnique({
          where: { id: rec.gamefowl2Id },
          include: {
            sparring_winner: true,
            sparring_loser: true,
            conditioning: {
              orderBy: { id: "desc" },
              take: 1,
            },
          },
        });

        return {
          ...rec,
          gamefowl1Bloodline: gamefowl1?.bloodline,
          gamefowl2Bloodline: gamefowl2?.bloodline,
          gamefowl1Conditioning: !!gamefowl1?.conditioning?.[0],
          gamefowl2Conditioning: !!gamefowl2?.conditioning?.[0],
        };
      })
    );

    // Apply filters
    let filteredRecommendations = enrichedRecommendations;

    if (maxEloGap) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) => rec.eloGap <= maxEloGap
      );
      console.log("After maxEloGap filter:", filteredRecommendations.length); // Debug log
    }

    if (minMatchBalance) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) => rec.matchBalance >= minMatchBalance
      );
      console.log(
        "After minMatchBalance filter:",
        filteredRecommendations.length
      ); // Debug log
    }

    if (bloodline) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) =>
          rec.gamefowl1Bloodline === bloodline ||
          rec.gamefowl2Bloodline === bloodline
      );
      console.log("After bloodline filter:", filteredRecommendations.length); // Debug log
    }

    // Return top 10 after filtering
    filteredRecommendations = filteredRecommendations.slice(0, 10);

    console.log("Final recommendations count:", filteredRecommendations.length); // Debug log

    return NextResponse.json({
      success: true,
      data: filteredRecommendations,
    });
  } catch (error) {
    console.error("Error generating sparring recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate sparring recommendations",
      },
      { status: 500 }
    );
  }
}

// Keep GET for backward compatibility
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const eloTolerance = searchParams.get("eloTolerance");

    const engine = new RecommendationEngine(prisma);
    // Use automatic tolerance if not provided
    const recommendations = await engine.recommendSparringMatches(
      limit,
      eloTolerance ? parseInt(eloTolerance) : undefined
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating sparring recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate sparring recommendations",
      },
      { status: 500 }
    );
  }
}
