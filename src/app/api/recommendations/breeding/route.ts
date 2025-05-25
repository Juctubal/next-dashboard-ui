import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";
import { BreedingPairRecommendation } from "@/lib/recommendation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetBloodline, minElo, maxAge } = body;

    const engine = new RecommendationEngine(prisma);
    let recommendations = await engine.recommendBreedingPairs(20);

    // Get bloodline information for each recommendation
    const enrichedRecommendations: (BreedingPairRecommendation & {
      sireBloodline?: string;
      damBloodline?: string;
    })[] = await Promise.all(
      recommendations.map(async (rec) => {
        const sire = await prisma.gamefowl.findUnique({
          where: { id: rec.sireId },
          select: { bloodline: true },
        });
        const dam = await prisma.gamefowl.findUnique({
          where: { id: rec.damId },
          select: { bloodline: true },
        });
        return {
          ...rec,
          sireBloodline: sire?.bloodline,
          damBloodline: dam?.bloodline,
        };
      })
    );

    // Apply filters
    let filteredRecommendations = enrichedRecommendations;

    if (targetBloodline) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) =>
          rec.sireBloodline === targetBloodline ||
          rec.damBloodline === targetBloodline
      );
    }

    if (minElo) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) => rec.expectedOffspringElo >= minElo
      );
    }

    // TODO: Add age filtering once age is available in the recommendation data

    // Return top 10 after filtering
    filteredRecommendations = filteredRecommendations.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: filteredRecommendations,
    });
  } catch (error) {
    console.error("Error generating breeding recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate breeding recommendations",
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
    const recommendations = await engine.recommendBreedingPairs(limit);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating breeding recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate breeding recommendations",
      },
      { status: 500 }
    );
  }
}
