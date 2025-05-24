import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";

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
