import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";
import { BreedingPairRecommendation } from "@/lib/recommendation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetBloodline, ageCategory } = body;

    const engine = new RecommendationEngine(prisma);
    let recommendations = await engine.recommendBreedingPairs(20);

    // Get additional information for each recommendation
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const sire = await prisma.gamefowl.findUnique({
          where: { id: rec.sireId },
          include: {
            sparring_winner: true,
            sparring_loser: true,
            vaccine: {
              orderBy: { vaccinationDate: "desc" },
              take: 1,
            },
            deworming: {
              orderBy: { dewormDate: "desc" },
              take: 1,
            },
            conditioning: {
              orderBy: { id: "desc" },
              take: 1,
            },
          },
        });
        const dam = await prisma.gamefowl.findUnique({
          where: { id: rec.damId },
          include: {
            sparring_winner: true,
            sparring_loser: true,
            vaccine: {
              orderBy: { vaccinationDate: "desc" },
              take: 1,
            },
            deworming: {
              orderBy: { dewormDate: "desc" },
              take: 1,
            },
            conditioning: {
              orderBy: { id: "desc" },
              take: 1,
            },
          },
        });

        // Calculate sparring track record
        const sireWins = sire?.sparring_winner?.length || 0;
        const sireLosses = sire?.sparring_loser?.length || 0;
        const damWins = dam?.sparring_winner?.length || 0;
        const damLosses = dam?.sparring_loser?.length || 0;

        // Calculate age in months
        const calculateAge = (dateHatched: Date | null) => {
          if (!dateHatched) return null;
          const months = Math.floor(
            (Date.now() - dateHatched.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
          return months;
        };

        // Determine age categories
        const getAgeCategory = (dateHatched: Date | null) => {
          const age = calculateAge(dateHatched);
          if (!age) return null;
          if (age <= 12) return "STAG";
          if (age <= 18) return "BULLSTAG";
          return "COCK";
        };

        return {
          ...rec,
          sireBloodline: sire?.bloodline,
          damBloodline: dam?.bloodline,
          sireAgeCategory: getAgeCategory(sire?.date_hatched || null),
          damAgeCategory: getAgeCategory(dam?.date_hatched || null),
          sireSparringRecord: `${sireWins}-${sireLosses}`,
          damSparringRecord: `${damWins}-${damLosses}`,
          sireVaccine: sire?.vaccine?.[0],
          damVaccine: dam?.vaccine?.[0],
          sireConditioning: !!sire?.conditioning?.[0],
          damConditioning: !!dam?.conditioning?.[0],
          strengthIndicators: rec.strengthIndicators,
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

    if (ageCategory) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) =>
          rec.sireAgeCategory === ageCategory ||
          rec.damAgeCategory === ageCategory
      );
    }

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
