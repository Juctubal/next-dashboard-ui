import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { NextResponse } from "next/server";

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

  // URL PARAMS CONDITION
  const eventQuery: any = {};
  const conditioningProgramQuery: any = {};
  const conditioningQuery: any = {};

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

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
