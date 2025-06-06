import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { gamefowlAge } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ageCategory = searchParams.get("ageCategory");
    const eventId = searchParams.get("eventId");

    if (!ageCategory) {
      return NextResponse.json(
        { error: "Age category is required" },
        { status: 400 }
      );
    }

    // Special handling for "ANY" age category
    if (ageCategory === "ANY") {
      // Get all STAG, BULLSTAG, and COCK gamefowls that are not archived and available
      const gamefowls = await prisma.gamefowl.findMany({
        where: {
          age: {
            in: ["STAG", "BULLSTAG", "COCK"],
          },
          isArchived: false,
          OR: [
            {
              status: {
                notIn: ["BREEDING", "INJURED", "DECEASED", "SOLD", "SICK"],
              },
            },
            // Include gamefowls that are already assigned to this event
            ...(eventId
              ? [
                  {
                    eventGamefowls: {
                      some: {
                        eventId: parseInt(eventId),
                      },
                    },
                  },
                ]
              : []),
          ],
        },
        orderBy: {
          name: "asc",
        },
      });
      return NextResponse.json(gamefowls);
    }

    // Validate that the ageCategory is a valid gamefowlAge
    if (!Object.values(gamefowlAge).includes(ageCategory as gamefowlAge)) {
      return NextResponse.json(
        { error: "Invalid age category" },
        { status: 400 }
      );
    }

    // Get gamefowls that match the age category and are not archived or unavailable
    const gamefowls = await prisma.gamefowl.findMany({
      where: {
        age: ageCategory as gamefowlAge,
        isArchived: false,
        OR: [
          {
            status: {
              notIn: ["BREEDING", "INJURED", "DECEASED", "SOLD", "SICK"],
            },
          },
          // Include gamefowls that are already assigned to this event
          ...(eventId
            ? [
                {
                  eventGamefowls: {
                    some: {
                      eventId: parseInt(eventId),
                    },
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(gamefowls);
  } catch (error) {
    console.error("Error fetching gamefowls:", error);
    return NextResponse.json(
      { error: "Failed to fetch gamefowls" },
      { status: 500 }
    );
  }
}
