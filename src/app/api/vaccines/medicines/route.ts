import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get distinct vaccine names that are not null or empty
    const vaccines = await prisma.vaccine.findMany({
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
    const medicineNames = vaccines
      .map((v) => v.name)
      .filter((name) => name && name.trim() !== "")
      .sort();

    return NextResponse.json(medicineNames);
  } catch (error) {
    console.error("Error fetching vaccine medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch vaccine medicines" },
      { status: 500 }
    );
  }
}
