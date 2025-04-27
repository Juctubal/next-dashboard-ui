import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { notes } = body;

    // Update the sparring record
    const sparring = await prisma.sparring.update({
      where: { id: parseInt(id) },
      data: {
        notes,
      },
    });

    return NextResponse.json(sparring);
  } catch (error) {
    console.error("Error updating sparring record:", error);
    return NextResponse.json(
      { error: "Failed to update sparring record" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid sparring ID" },
        { status: 400 }
      );
    }

    // Fetch the sparring match with related data
    const sparringMatch = await prisma.sparring.findUnique({
      where: { id },
      include: {
        gamefowl1: {
          select: {
            id: true,
            name: true,
            img: true,
          },
        },
        gamefowl2: {
          select: {
            id: true,
            name: true,
            img: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
          },
        },
        loser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sparringMatch) {
      return NextResponse.json(
        { error: "Sparring match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sparringMatch);
  } catch (error) {
    console.error("Error fetching sparring match:", error);
    return NextResponse.json(
      { error: "Failed to fetch sparring match" },
      { status: 500 }
    );
  }
}
