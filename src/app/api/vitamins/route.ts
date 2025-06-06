import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gamefowlId, name, notes, date } = body;

    const vitamin = await prisma.vitamin.create({
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        administeredDate: new Date(date),
        isArchived: false,
      },
    });

    return NextResponse.json(vitamin);
  } catch (error) {
    console.error("Error creating vitamin record:", error);
    return NextResponse.json(
      { error: "Failed to create vitamin record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, gamefowlId, name, notes, date } = body;

    const vitamin = await prisma.vitamin.update({
      where: { id: parseInt(id) },
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        administeredDate: new Date(date),
      },
    });

    return NextResponse.json(vitamin);
  } catch (error) {
    console.error("Error updating vitamin record:", error);
    return NextResponse.json(
      { error: "Failed to update vitamin record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Vitamin ID is required" },
        { status: 400 }
      );
    }

    await prisma.vitamin.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Vitamin record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vitamin record:", error);
    return NextResponse.json(
      { error: "Failed to delete vitamin record" },
      { status: 500 }
    );
  }
}
