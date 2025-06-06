import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { NextResponse } from "next/server";

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Add cache control headers to prevent caching
function addNoCacheHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const tab = searchParams.get("tab") || "events";
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const eventType = searchParams.get("eventType");
  const ageCategory = searchParams.get("ageCategory");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  // Parse the showArchived parameter - default to false if not explicitly set to "true"
  const showArchivedParam = searchParams.get("showArchived");
  const showArchived = showArchivedParam === "true";
  console.log("showArchived parameter:", {
    showArchivedParam,
    parsed: showArchived,
  });

  // URL PARAMS CONDITION
  const eventQuery: any = {};
  const conditioningProgramQuery: any = {};
  const conditioningQuery: any = {};

  // Handle archived/non-archived filtering
  if (showArchived) {
    // When showing archived items, ONLY show archived items
    console.log("SHOWING ARCHIVED mode active - showing only archived items");

    // Use explicit boolean true condition
    eventQuery.isArchived = true;
    conditioningProgramQuery.isArchived = true;
    conditioningQuery.isArchived = true;

    console.log("Filtering to show only archived items:", {
      eventQuery,
      conditioningProgramQuery,
      conditioningQuery,
    });
  } else {
    // When NOT showing archived items, explicitly filter to only show non-archived items
    console.log(
      "HIDING ARCHIVED mode active - showing only non-archived items"
    );

    // Using a direct equals:false condition
    eventQuery.isArchived = false;
    conditioningProgramQuery.isArchived = false;
    conditioningQuery.isArchived = false;

    console.log("Filtering with explicit equals condition:", {
      eventQuery,
      conditioningProgramQuery,
      conditioningQuery,
    });
  }

  // Handle event filters
  if (eventType && eventType !== "all") {
    eventQuery.eventType = eventType;
  }

  if (ageCategory && ageCategory !== "all") {
    eventQuery.ageCategory = ageCategory;
  }

  if (status && status !== "all") {
    eventQuery.status = status;
  }

  // --- SEARCH FILTERS ---
  if (searchParams.get("search")) {
    const searchValue = searchParams.get("search")!.trim();
    if (searchValue.length > 0) {
      if (tab === "events") {
        eventQuery.OR = [
          { eventName: { contains: searchValue, mode: "insensitive" } },
          { description: { contains: searchValue, mode: "insensitive" } },
        ];
      } else if (tab === "conditioningPrograms") {
        conditioningProgramQuery.OR = [
          { programName: { contains: searchValue, mode: "insensitive" } },
          { description: { contains: searchValue, mode: "insensitive" } },
        ];
      } else if (tab === "conditioning") {
        conditioningQuery.OR = [
          { status: { contains: searchValue, mode: "insensitive" } },
          {
            conProg: {
              programName: { contains: searchValue, mode: "insensitive" },
            },
          },
          {
            event: {
              eventName: { contains: searchValue, mode: "insensitive" },
            },
          },
          {
            handler: {
              first_name: { contains: searchValue, mode: "insensitive" },
            },
          },
          {
            handler: {
              last_name: { contains: searchValue, mode: "insensitive" },
            },
          },
        ];
      }
    }
  }

  // Handle conditioning filters
  if (tab === "conditioning") {
    if (status && status !== "all") {
      conditioningQuery.status = status;
    }

    if (startDate) {
      conditioningQuery.startDate = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      conditioningQuery.endDate = {
        lte: new Date(endDate),
      };
    }
  }

  try {
    let data: any[] = [];
    let count = 0;

    if (tab === "events") {
      [data, count] = await prisma.$transaction([
        prisma.event.findMany({
          where: eventQuery,
          include: {
            gamefowl: {
              include: {
                gamefowl: true,
              },
            },
            conditioning: {
              include: {
                gamefowls: {
                  include: {
                    gamefowl: true,
                  },
                },
              },
            },
          },
          orderBy: sortBy
            ? {
                [sortBy]: sortOrder,
              }
            : {
                eventDate: "desc",
              },
          take: ITEM_PER_PAGE,
          skip: ITEM_PER_PAGE * (page - 1),
        }),
        prisma.event.count({ where: eventQuery }),
      ]);
    } else if (tab === "conditioningPrograms") {
      [data, count] = await prisma.$transaction([
        prisma.conditioningProgram.findMany({
          where: conditioningProgramQuery,
          orderBy: sortBy
            ? {
                [sortBy]: sortOrder,
              }
            : {
                programName: "asc",
              },
          take: ITEM_PER_PAGE,
          skip: ITEM_PER_PAGE * (page - 1),
        }),
        prisma.conditioningProgram.count({ where: conditioningProgramQuery }),
      ]);
    } else if (tab === "conditioning") {
      [data, count] = await prisma.$transaction([
        prisma.conditioning.findMany({
          where: conditioningQuery,
          include: {
            conProg: {
              select: {
                id: true,
                programName: true,
              },
            },
            event: {
              select: {
                id: true,
                eventName: true,
              },
            },
            handler: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
            gamefowls: {
              include: {
                gamefowl: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: sortBy
            ? {
                [sortBy]: sortOrder,
              }
            : {
                startDate: "desc",
              },
          take: ITEM_PER_PAGE,
          skip: ITEM_PER_PAGE * (page - 1),
        }),
        prisma.conditioning.count({ where: conditioningQuery }),
      ]);
    }

    const response = NextResponse.json({ data, count });
    return addNoCacheHeaders(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
