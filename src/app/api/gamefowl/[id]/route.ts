import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch the gamefowl with all related data
    const gamefowl = await prisma.gamefowl.findUnique({
      where: { id: parseInt(id) },
      include: {
        // Include Elo rating
        gamefowl: true,
        // Include conditioning data
        conditioning: {
          include: {
            conProg: true,
            event: true,
            handler: true,
          },
        },
        // Include sparring data
        sparring_1: true,
        sparring_2: true,
        sparring_winner: true,
        sparring_loser: true,
        // Include medical records
        vaccine: true,
        deworming: true,
        // Include breeding data
        damBreeding: true,
        sireBreeding: true,
        // Include parent data
        dam: true,
        sire: true,
      },
    });

    if (!gamefowl) {
      return NextResponse.json(
        { error: "Gamefowl not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(gamefowl);
  } catch (error) {
    console.error("Error fetching gamefowl:", error);
    return NextResponse.json(
      { error: "Failed to fetch gamefowl" },
      { status: 500 }
    );
  }
}
