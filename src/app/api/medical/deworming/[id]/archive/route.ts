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
        { error: "Unauthorized. Only admins can archive deworming records." },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Check if deworming record exists
    const deworming = await prisma.deworming.findUnique({
      where: { id: parseInt(id) },
    });

    if (!deworming) {
      return NextResponse.json(
        { error: "Deworming record not found" },
        { status: 404 }
      );
    }

    // Update the deworming record's archive status
    await prisma.deworming.update({
      where: { id: parseInt(id) },
      data: { isArchived },
    });

    return NextResponse.json(
      {
        message: `Deworming record ${
          isArchived ? "archived" : "unarchived"
        } successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving deworming record:", error);
    return NextResponse.json(
      { error: "Failed to update deworming record archive status" },
      { status: 500 }
    );
  }
}
