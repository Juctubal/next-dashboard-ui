import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get distinct deworming names that are not null or empty
    const dewormings = await prisma.deworming.findMany({
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
    const medicineNames = dewormings
      .map((d) => d.name)
      .filter((name) => name && name.trim() !== "")
      .sort();

    return NextResponse.json(medicineNames);
  } catch (error) {
    console.error("Error fetching deworming medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch deworming medicines" },
      { status: 500 }
    );
  }
}
