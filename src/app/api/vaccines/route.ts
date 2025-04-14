import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gamefowlId, name, notes, date } = body;

    const vaccine = await prisma.vaccine.create({
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        vaccinationDate: new Date(date),
      },
    });

    return NextResponse.json(vaccine);
  } catch (error) {
    console.error("Error creating vaccine record:", error);
    return NextResponse.json(
      { error: "Failed to create vaccine record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, gamefowlId, name, notes, date } = body;

    const vaccine = await prisma.vaccine.update({
      where: { id: parseInt(id) },
      data: {
        gamefowlId: parseInt(gamefowlId),
        name,
        notes,
        vaccinationDate: new Date(date),
      },
    });

    return NextResponse.json(vaccine);
  } catch (error) {
    console.error("Error updating vaccine record:", error);
    return NextResponse.json(
      { error: "Failed to update vaccine record" },
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
        { error: "Vaccine ID is required" },
        { status: 400 }
      );
    }

    await prisma.vaccine.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Vaccine record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vaccine record:", error);
    return NextResponse.json(
      { error: "Failed to delete vaccine record" },
      { status: 500 }
    );
  }
}
