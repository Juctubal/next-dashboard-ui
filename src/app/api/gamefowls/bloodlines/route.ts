import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all unique bloodlines from gamefowls
    const gamefowls = await prisma.gamefowl.findMany({
      select: {
        bloodline: true,
      },
      distinct: ["bloodline"],
      orderBy: {
        bloodline: "asc",
      },
    });

    const bloodlines = gamefowls.map((g) => g.bloodline);

    return NextResponse.json(bloodlines);
  } catch (error) {
    console.error("Error fetching bloodlines:", error);
    return NextResponse.json(
      { error: "Failed to fetch bloodlines" },
      { status: 500 }
    );
  }
}
