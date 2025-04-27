import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const recurrentSched = await prisma.recurrentSchedules.findUnique({
      where: { id },
      include: {
        schedule: true,
      },
    });

    if (!recurrentSched) {
      return NextResponse.json(
        { error: "Recurrent schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(recurrentSched);
  } catch (error) {
    console.error("Error fetching recurrent schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurrent schedule" },
      { status: 500 }
    );
  }
}
