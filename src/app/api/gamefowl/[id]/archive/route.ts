import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();

    // Check if user is admin, handler, or breeder
    const allowedRoles = ["admin", "handler", "breeder"];
    if (!allowedRoles.includes(user?.publicMetadata?.role as string)) {
      return NextResponse.json(
        { error: "Unauthorized. Only admins, handlers, or breeders can archive gamefowl." },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Check if gamefowl exists
    const gamefowl = await prisma.gamefowl.findUnique({
      where: { id: parseInt(id) },
    });

    if (!gamefowl) {
      return NextResponse.json(
        { error: "Gamefowl not found" },
        { status: 404 }
      );
    }

    // Update the gamefowl's archive status
    await prisma.gamefowl.update({
      where: { id: parseInt(id) },
      data: { isArchived },
    });

    return NextResponse.json(
      {
        message: `Gamefowl ${
          isArchived ? "archived" : "unarchived"
        } successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving gamefowl:", error);
    return NextResponse.json(
      { error: "Failed to update gamefowl archive status" },
      { status: 500 }
    );
  }
}
