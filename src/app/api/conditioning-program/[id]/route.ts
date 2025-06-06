import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid conditioning program ID" },
        { status: 400 }
      );
    }

    const program = await prisma.conditioningProgram.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: "Conditioning program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Error fetching conditioning program:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditioning program" },
      { status: 500 }
    );
  }
}
