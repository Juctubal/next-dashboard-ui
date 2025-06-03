import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const gamefowls = await prisma.gamefowl.findMany({
      where: {
        isArchived: false,
        sex: "MALE",
        age: {
          not: "CHICK",
        },
        status: {
          in: ["IDLE", "CONDITIONING"],
        },
      },
      select: {
        id: true,
        name: true,
        bloodline: true,
        age: true,
        sex: true,
        status: true,
        eloRating: true,
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
