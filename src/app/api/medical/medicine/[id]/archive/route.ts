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
        { error: "Unauthorized. Only admins can archive medicine records." },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Check if medicine record exists
    const medicine = await prisma.medicine.findUnique({
      where: { id: parseInt(id) },
    });

    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine record not found" },
        { status: 404 }
      );
    }

    // Update the medicine record's archive status
    await prisma.medicine.update({
      where: { id: parseInt(id) },
      data: { isArchived },
    });

    return NextResponse.json(
      {
        message: `Medicine record ${
          isArchived ? "archived" : "unarchived"
        } successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving medicine record:", error);
    return NextResponse.json(
      { error: "Failed to update medicine record archive status" },
      { status: 500 }
    );
  }
}
