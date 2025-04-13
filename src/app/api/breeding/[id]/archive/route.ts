import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();

    // Check if user is admin
    if (user?.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can archive breeding records." },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Check if breeding record exists
    const breeding = await prisma.breeding.findUnique({
      where: { id: parseInt(id) },
    });

    if (!breeding) {
      return NextResponse.json(
        { error: "Breeding record not found" },
        { status: 404 }
      );
    }

    // Update the breeding record's archive status
    await prisma.breeding.update({
      where: { id: parseInt(id) },
      data: { isArchived },
    });

    return NextResponse.json(
      {
        message: `Breeding record ${
          isArchived ? "archived" : "unarchived"
        } successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving breeding record:", error);
    return NextResponse.json(
      { error: "Failed to update breeding record archive status" },
      { status: 500 }
    );
  }
}
