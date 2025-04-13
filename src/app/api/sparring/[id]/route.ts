import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
