import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, bloodline, date_hatched, age, sireId, damId, batchId } = body;

    const gamefowl = await prisma.gamefowl.create({
      data: {
        name,
        bloodline,
        date_hatched: date_hatched ? new Date(date_hatched) : null,
        age,
        sireId: sireId ? parseInt(sireId) : null,
        damId: damId ? parseInt(damId) : null,
        batchId: batchId ? parseInt(batchId) : null,
      },
    });

    return NextResponse.json(gamefowl);
  } catch (error) {
    console.error("Error creating gamefowl:", error);
    return NextResponse.json(
      { error: "Failed to create gamefowl" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, bloodline, date_hatched, age, sireId, damId, batchId } =
      body;

    const gamefowl = await prisma.gamefowl.update({
      where: { id: parseInt(id) },
      data: {
        name,
        bloodline,
        date_hatched: date_hatched ? new Date(date_hatched) : null,
        age,
        sireId: sireId ? parseInt(sireId) : null,
        damId: damId ? parseInt(damId) : null,
        batchId: batchId ? parseInt(batchId) : null,
      },
    });

    return NextResponse.json(gamefowl);
  } catch (error) {
    console.error("Error updating gamefowl:", error);
    return NextResponse.json(
      { error: "Failed to update gamefowl" },
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
        { error: "Gamefowl ID is required" },
        { status: 400 }
      );
    }

    await prisma.gamefowl.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Gamefowl deleted successfully" });
  } catch (error) {
    console.error("Error deleting gamefowl:", error);
    return NextResponse.json(
      { error: "Failed to delete gamefowl" },
      { status: 500 }
    );
  }
}
