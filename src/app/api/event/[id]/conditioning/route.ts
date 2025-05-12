import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const conditioning = await prisma.conditioning.findMany({
      where: { eventId: parseInt(id) },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json(conditioning);
  } catch (error) {
    console.error("Error fetching conditioning records:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditioning records" },
      { status: 500 }
    );
  }
}
