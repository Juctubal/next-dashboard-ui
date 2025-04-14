import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const { id, isArchived } = await request.json();

    const updatedDeworming = await prisma.deworming.update({
      where: { id },
      data: { isArchived },
    });

    return NextResponse.json(updatedDeworming);
  } catch (error) {
    console.error("Error updating deworming archive status:", error);
    return NextResponse.json(
      { error: "Failed to update deworming archive status" },
      { status: 500 }
    );
  }
}
