import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const incubation = await prisma.incubation.findUnique({
      where: { id: parseInt(id) },
      include: {
        batch: true,
      },
    });

    if (!incubation) {
      return NextResponse.json(
        { error: "Incubation record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(incubation);
  } catch (error) {
    console.error("Error fetching incubation record:", error);
    return NextResponse.json(
      { error: "Failed to fetch incubation record" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { incStart, incEnd, eggCount, status } = body;

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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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
