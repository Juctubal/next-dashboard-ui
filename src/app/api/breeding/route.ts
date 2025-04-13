import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const breedingRecords = await prisma.breeding.findMany({
      include: {
        sire: true,
        dam: true,
      },
    });

    return NextResponse.json(breedingRecords);
  } catch (error) {
    console.error("Error fetching breeding records:", error);
    return NextResponse.json(
      { error: "Failed to fetch breeding records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sireId, damId, notes, status, startDate, endDate } = body;

    // Create the data object
    const createData: any = {
      sireId: parseInt(sireId),
      damId: parseInt(damId),
      notes,
      status: status || "ONGOING",
    };

    // Only include date fields if they are provided
    if (startDate) {
      createData.startDate = new Date(startDate);
    } else {
      createData.startDate = new Date(); // Default to current date
    }

    if (endDate) {
      createData.endDate = new Date(endDate);
    } else if (endDate === null) {
      createData.endDate = null;
    }

    const breeding = await prisma.breeding.create({
      data: createData,
    });

    return NextResponse.json(breeding);
  } catch (error) {
    console.error("Error creating breeding record:", error);
    return NextResponse.json(
      { error: "Failed to create breeding record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, sireId, damId, notes, status, startDate, endDate } = body;

    // Create the update data object
    const updateData: any = {
      sireId: parseInt(sireId),
      damId: parseInt(damId),
      notes,
      status,
    };

    // Only include date fields if they are provided
    if (startDate) {
      updateData.startDate = new Date(startDate);
    }

    if (endDate) {
      updateData.endDate = new Date(endDate);
    } else if (endDate === null) {
      updateData.endDate = null;
    }

    const breeding = await prisma.breeding.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(breeding);
  } catch (error) {
    console.error("Error updating breeding record:", error);
    return NextResponse.json(
      { error: "Failed to update breeding record" },
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
        { error: "Breeding ID is required" },
        { status: 400 }
      );
    }

    await prisma.breeding.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Breeding record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting breeding record:", error);
    return NextResponse.json(
      { error: "Failed to delete breeding record" },
      { status: 500 }
    );
  }
}
