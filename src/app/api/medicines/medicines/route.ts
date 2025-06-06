import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get distinct medicine names that are not null or empty
    const medicines = await prisma.medicine.findMany({
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
    const medicineNames = medicines
      .map((m) => m.name)
      .filter((name) => name && name.trim() !== "")
      .sort();

    return NextResponse.json(medicineNames);
  } catch (error) {
    console.error("Error fetching medicine medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicine medicines" },
      { status: 500 }
    );
  }
}
