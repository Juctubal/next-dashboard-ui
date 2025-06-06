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
        { error: "Unauthorized. Only admins can archive vitamin records." },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Check if vitamin record exists
    const vitamin = await prisma.vitamin.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vitamin) {
      return NextResponse.json(
        { error: "Vitamin record not found" },
        { status: 404 }
      );
    }

    // Update the vitamin record's archive status
    await prisma.vitamin.update({
      where: { id: parseInt(id) },
      data: { isArchived },
    });

    return NextResponse.json(
      {
        message: `Vitamin record ${
          isArchived ? "archived" : "unarchived"
        } successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving vitamin record:", error);
    return NextResponse.json(
      { error: "Failed to update vitamin record archive status" },
      { status: 500 }
    );
  }
}
