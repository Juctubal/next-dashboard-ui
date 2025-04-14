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
        { error: "Unauthorized. Only admins can archive vaccine records." },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Check if vaccine record exists
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vaccine) {
      return NextResponse.json(
        { error: "Vaccine record not found" },
        { status: 404 }
      );
    }

    // Update the vaccine record's archive status
    await prisma.vaccine.update({
      where: { id: parseInt(id) },
      data: { isArchived },
    });

    return NextResponse.json(
      {
        message: `Vaccine record ${
          isArchived ? "archived" : "unarchived"
        } successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving vaccine record:", error);
    return NextResponse.json(
      { error: "Failed to update vaccine record archive status" },
      { status: 500 }
    );
  }
}
