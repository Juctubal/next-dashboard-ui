import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GamefowlStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const gamefowlId = parseInt(params.id);

    // Validate status
    if (!Object.values(GamefowlStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update gamefowl status
    const updatedGamefowl = await prisma.gamefowl.update({
      where: { id: gamefowlId },
      data: { status },
    });

    return NextResponse.json(updatedGamefowl);
  } catch (error) {
    console.error("Error updating gamefowl status:", error);
    return NextResponse.json(
      { error: "Failed to update gamefowl status" },
      { status: 500 }
    );
  }
}
