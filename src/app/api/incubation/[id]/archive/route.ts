import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { isArchived } = body;

    const incubation = await prisma.incubation.update({
      where: { id: parseInt(id) },
      data: { isArchived },
    });

    return NextResponse.json(incubation);
  } catch (error) {
    console.error("Error updating incubation archive status:", error);
    return NextResponse.json(
      { error: "Failed to update incubation archive status" },
      { status: 500 }
    );
  }
}
