import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";
import { SparringMatchRecommendation } from "@/lib/recommendation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxEloGap, minMatchBalance, bloodline } = body;

    const engine = new RecommendationEngine(prisma);
    let recommendations = await engine.recommendSparringMatches(20);

    // Get bloodline information for each recommendation
    const enrichedRecommendations: (SparringMatchRecommendation & {
      gamefowl1Bloodline?: string;
      gamefowl2Bloodline?: string;
    })[] = await Promise.all(
      recommendations.map(async (rec) => {
        const gamefowl1 = await prisma.gamefowl.findUnique({
          where: { id: rec.gamefowl1Id },
          select: { bloodline: true },
        });
        const gamefowl2 = await prisma.gamefowl.findUnique({
          where: { id: rec.gamefowl2Id },
          select: { bloodline: true },
        });
        return {
          ...rec,
          gamefowl1Bloodline: gamefowl1?.bloodline,
          gamefowl2Bloodline: gamefowl2?.bloodline,
        };
      })
    );

    // Apply filters
    let filteredRecommendations = enrichedRecommendations;

    if (maxEloGap) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) => rec.eloGap <= maxEloGap
      );
    }

    if (minMatchBalance) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) => rec.matchBalance >= minMatchBalance
      );
    }

    if (bloodline) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) =>
          rec.gamefowl1Bloodline === bloodline ||
          rec.gamefowl2Bloodline === bloodline
      );
    }

    // Return top 10 after filtering
    filteredRecommendations = filteredRecommendations.slice(0, 10);

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

    const engine = new RecommendationEngine(prisma);
    const recommendations = await engine.recommendSparringMatches(limit);

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
