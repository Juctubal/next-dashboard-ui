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
        { error: "Unauthorized. Only admins can archive staff." },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isArchived } = await request.json();

    // Check if staff exists and determine if it's a handler or breeder
    const handler = await prisma.handler.findUnique({
      where: { id },
    });

    const breeder = await prisma.breeder.findUnique({
      where: { id },
    });

    if (!handler && !breeder) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Update the staff member based on their type using raw SQL
    if (handler) {
      await prisma.$executeRaw`
        UPDATE "Handler" 
        SET "isArchived" = ${isArchived} 
        WHERE id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "Breeder" 
        SET "isArchived" = ${isArchived} 
        WHERE id = ${id}
      `;
    }

    return NextResponse.json(
      {
        message: `Staff ${isArchived ? "archived" : "unarchived"} successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff archive status" },
      { status: 500 }
    );
  }
}
