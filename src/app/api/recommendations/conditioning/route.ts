import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";

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
