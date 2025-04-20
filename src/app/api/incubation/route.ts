import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const incubationRecords = await prisma.incubation.findMany({
      include: {
        batch: true,
      },
    });

    return NextResponse.json(incubationRecords);
  } catch (error) {
    console.error("Error fetching incubation records:", error);
    return NextResponse.json(
      { error: "Failed to fetch incubation records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { incStart, eggCount, status, breedingId } = body;

    // Calculate incEnd (incStart + 21 days)
    const startDate = new Date(incStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 21);

    // Create the data object
    const createData: any = {
      incStart: startDate,
      incEnd: endDate,
      eggCount: parseInt(eggCount),
      status: status || "ONGOING",
    };

    // Add breedingId if provided
    if (breedingId) {
      createData.breedingId = parseInt(breedingId);
    }

    const incubation = await prisma.incubation.create({
      data: createData,
    });

    return NextResponse.json(incubation);
  } catch (error) {
    console.error("Error creating incubation record:", error);
    return NextResponse.json(
      { error: "Failed to create incubation record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, incStart, incEnd, eggCount, status } = body;

    // Create the update data object
    const updateData: any = {};

    if (incStart) {
      updateData.incStart = new Date(incStart);
    }

    if (incEnd) {
      updateData.incEnd = new Date(incEnd);
    }

    if (eggCount) {
      updateData.eggCount = parseInt(eggCount);
    }

    if (status) {
      updateData.status = status;
    }

    const incubation = await prisma.incubation.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(incubation);
  } catch (error) {
    console.error("Error updating incubation record:", error);
    return NextResponse.json(
      { error: "Failed to update incubation record" },
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
        { error: "Incubation ID is required" },
        { status: 400 }
      );
    }

    await prisma.incubation.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Incubation record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting incubation record:", error);
    return NextResponse.json(
      { error: "Failed to delete incubation record" },
      { status: 500 }
    );
  }
}
