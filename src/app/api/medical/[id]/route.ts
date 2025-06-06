import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid medical record ID" },
        { status: 400 }
      );
    }

    // Check if it's a vaccine or deworming record
    const vaccine = await prisma.vaccine.findUnique({
      where: { id },
    });

    if (vaccine) {
      // Format the vaccine response
      const response = {
        id: vaccine.id,
        title: `Vaccination: ${vaccine.name || "Unnamed"}`,
        medicalType: "Vaccination",
        name: vaccine.name,
        vaccinationDate: vaccine.vaccinationDate,
        notes: vaccine.notes,
      };

      return NextResponse.json(response);
    }

    // Check if it's a deworming record
    const deworming = await prisma.deworming.findUnique({
      where: { id },
    });

    if (deworming) {
      // Format the deworming response
      const response = {
        id: deworming.id,
        title: `Deworming: ${deworming.name || "Unnamed"}`,
        medicalType: "Deworming",
        name: deworming.name,
        dewormDate: deworming.dewormDate,
        notes: deworming.notes,
      };

      return NextResponse.json(response);
    }

    // Check if it's a vitamin record
    const vitamin = await prisma.vitamin.findUnique({
      where: { id },
    });

    if (vitamin) {
      // Format the vitamin response
      const response = {
        id: vitamin.id,
        title: `Vitamin: ${vitamin.name || "Unnamed"}`,
        medicalType: "Vitamin",
        name: vitamin.name,
        administeredDate: vitamin.administeredDate,
        notes: vitamin.notes,
      };

      return NextResponse.json(response);
    }

    // Check if it's a medicine record
    const medicine = await prisma.medicine.findUnique({
      where: { id },
    });

    if (medicine) {
      // Format the medicine response
      const response = {
        id: medicine.id,
        title: `Medicine: ${medicine.name || "Unnamed"}`,
        medicalType: "Medicine",
        name: medicine.name,
        administeredDate: medicine.administeredDate,
        notes: medicine.notes,
      };

      return NextResponse.json(response);
    }

    // If no medical record is found
    return NextResponse.json(
      { error: "Medical record not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching medical record:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical record" },
      { status: 500 }
    );
  }
}
