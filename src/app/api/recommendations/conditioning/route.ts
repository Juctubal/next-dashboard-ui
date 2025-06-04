import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecommendationEngine } from "@/lib/recommendation/recommendation-engine";
import { ConditioningRecommendation } from "@/lib/recommendation/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, bloodline, timeToEvent, targetType } = body;

    // Build where clause for gamefowls
    let gamefowlWhere: any = {
      isArchived: false,
      sex: "MALE",
      status: {
        in: ["IDLE", "CONDITIONING", "COMPETING"],
      },
      ...(bloodline && { bloodline }),
    };

    // If specific event is selected, only show gamefowls registered for that event
    if (targetType === "specific_event" && eventId) {
      const eventIdInt = parseInt(eventId);

      gamefowlWhere.eventGamefowls = {
        some: {
          eventId: eventIdInt,
        },
      };
    }

    // Get gamefowls based on filters
    const gamefowls = await prisma.gamefowl.findMany({
      where: gamefowlWhere,
      include: {
        eventGamefowls: {
          where: eventId ? { eventId: parseInt(eventId) } : undefined,
        },
      },
      take: 10, // Limit to 10 gamefowls
    });

    const engine = new RecommendationEngine(prisma);
    const allRecommendations: ConditioningRecommendation[] = [];

    // Get recommendations for each gamefowl
    for (const gamefowl of gamefowls) {
      const recommendations = await engine.recommendConditioningPrograms(
        gamefowl.id,
        timeToEvent,
        targetType
      );

      // Add the best recommendation for this gamefowl
      if (recommendations.length > 0) {
        allRecommendations.push(recommendations[0]);
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
    const timeToEvent = searchParams.get("timeToEvent");
    const targetType = searchParams.get("targetType");

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
      parseInt(gamefowlId),
      timeToEvent ? parseInt(timeToEvent) : undefined,
      targetType as
        | "general"
        | "brooding"
        | "breeding"
        | "derby"
        | "specific_event"
        | undefined
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
