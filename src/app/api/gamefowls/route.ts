import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const gamefowls = await prisma.gamefowl.findMany({
      select: {
        id: true,
        name: true,
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
