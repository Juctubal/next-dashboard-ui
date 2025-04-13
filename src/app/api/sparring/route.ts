import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      gamefowl_1_Id,
      gamefowl_2_Id,
      winnerId,
      loserId,
      winner_elo_change,
      loser_elo_change,
      sparringDate,
      notes,
    } = body;

    // Create the sparring record and update Elo ratings in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the sparring record
      const sparring = await tx.sparring.create({
        data: {
          gamefowl_1_Id,
          gamefowl_2_Id,
          winnerId,
          loserId,
          winner_elo_change,
          loser_elo_change,
          sparringDate,
          notes,
        },
      });

      // Update winner's Elo rating
      await tx.gamefowl.update({
        where: { id: winnerId },
        data: {
          eloRating: {
            increment: winner_elo_change,
          },
        },
      });

      // Update loser's Elo rating
      await tx.gamefowl.update({
        where: { id: loserId },
        data: {
          eloRating: {
            increment: loser_elo_change,
          },
        },
      });

      return sparring;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating sparring record:", error);
    return NextResponse.json(
      { error: "Failed to create sparring record" },
      { status: 500 }
    );
  }
}
