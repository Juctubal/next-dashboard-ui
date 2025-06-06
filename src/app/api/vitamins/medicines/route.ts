import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get distinct vitamin names that are not null or empty
    const vitamins = await prisma.vitamin.findMany({
      where: {
        name: {
          not: null,
        },
      },
      select: {
        name: true,
      },
      distinct: ["name"],
      orderBy: {
        name: "asc",
      },
    });

    // Filter out null/empty names and return just the names
    const vitaminNames = vitamins
      .map((v) => v.name)
      .filter((name) => name && name.trim() !== "")
      .sort();

    return NextResponse.json(vitaminNames);
  } catch (error) {
    console.error("Error fetching vitamin medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch vitamin medicines" },
      { status: 500 }
    );
  }
}
