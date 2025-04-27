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

    const oneTimeSched = await prisma.oneTimeSched.findUnique({
      where: { id },
      include: {
        schedule: true,
      },
    });

    if (!oneTimeSched) {
      return NextResponse.json(
        { error: "One-time schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(oneTimeSched);
  } catch (error) {
    console.error("Error fetching one-time schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch one-time schedule" },
      { status: 500 }
    );
  }
}
