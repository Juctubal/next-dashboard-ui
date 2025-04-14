import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const { id, isArchived } = await request.json();

    const updatedVaccine = await prisma.vaccine.update({
      where: { id },
      data: { isArchived },
    });

    return NextResponse.json(updatedVaccine);
  } catch (error) {
    console.error("Error updating vaccine archive status:", error);
    return NextResponse.json(
      { error: "Failed to update vaccine archive status" },
      { status: 500 }
    );
  }
}
