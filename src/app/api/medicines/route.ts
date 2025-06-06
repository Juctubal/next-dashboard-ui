import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gamefowlId, name, notes, date } = body;

    const medicine = await prisma.medicine.create({
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        administeredDate: new Date(date),
        isArchived: false,
      },
    });

    return NextResponse.json(medicine);
  } catch (error) {
    console.error("Error creating medicine record:", error);
    return NextResponse.json(
      { error: "Failed to create medicine record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, gamefowlId, name, notes, date } = body;

    const medicine = await prisma.medicine.update({
      where: { id: parseInt(id) },
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        administeredDate: new Date(date),
      },
    });

    return NextResponse.json(medicine);
  } catch (error) {
    console.error("Error updating medicine record:", error);
    return NextResponse.json(
      { error: "Failed to update medicine record" },
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
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    await prisma.medicine.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Medicine record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting medicine record:", error);
    return NextResponse.json(
      { error: "Failed to delete medicine record" },
      { status: 500 }
    );
  }
}
