import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gamefowlId, name, notes, date } = body;

    const deworming = await prisma.deworming.create({
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        dewormDate: new Date(date),
      },
    });

    return NextResponse.json(deworming);
  } catch (error) {
    console.error("Error creating deworming record:", error);
    return NextResponse.json(
      { error: "Failed to create deworming record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, gamefowlId, name, notes, date } = body;

    const deworming = await prisma.deworming.update({
      where: { id: parseInt(id) },
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        dewormDate: new Date(date),
      },
    });

    return NextResponse.json(deworming);
  } catch (error) {
    console.error("Error updating deworming record:", error);
    return NextResponse.json(
      { error: "Failed to update deworming record" },
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
        { error: "Deworming ID is required" },
        { status: 400 }
      );
    }

    await prisma.deworming.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Deworming record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting deworming record:", error);
    return NextResponse.json(
      { error: "Failed to delete deworming record" },
      { status: 500 }
    );
  }
}
