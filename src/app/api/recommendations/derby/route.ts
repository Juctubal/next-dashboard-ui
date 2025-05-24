import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";
import { RecommendationContext } from "@/lib/recommendation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventType,
      ageCategory,
      opponentStrength,
      timeToEvent,
      limit = 10,
    } = body;

    const context: RecommendationContext = {
      eventType,
      ageCategory,
      opponentStrength,
      timeToEvent,
    };

    const engine = new RecommendationEngine(prisma);
    const recommendations = await engine.recommendForDerby(context, limit);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating derby recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate recommendations",
      },
      { status: 500 }
    );
  }
}
