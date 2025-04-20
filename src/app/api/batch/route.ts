import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const batchRecords = await prisma.batch.findMany({
      include: {
        incubation: true,
      },
    });

    return NextResponse.json(batchRecords);
  } catch (error) {
    console.error("Error fetching batch records:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dateHatched, hatchRate, incubate_id, maleChicks, femaleChicks } =
      body;

    // Create the data object
    const createData: any = {
      dateHatched: new Date(dateHatched),
      hatchRate: parseFloat(hatchRate),
      incubate_id: parseInt(incubate_id),
    };

    // Create the batch record
    const batch = await prisma.batch.create({
      data: createData,
    });

    // Get the incubation record with breeding information
    const incubation = await prisma.incubation.findUnique({
      where: { id: parseInt(incubate_id) },
      include: {
        breeding: {
          include: {
            sire: true,
            dam: true,
          },
        },
      },
    });

    // If incubation has breeding information, create gamefowl records
    if (incubation?.breeding) {
      const { sire, dam } = incubation.breeding;

      // Determine bloodline based on sire and dam
      let bloodline = "";
      if (sire.bloodline === dam.bloodline) {
        bloodline = sire.bloodline;
      } else {
        bloodline = `1/2 ${sire.bloodline} 1/2 ${dam.bloodline}`;
      }

      // Create male gamefowl records
      for (let i = 1; i <= maleChicks; i++) {
        await prisma.gamefowl.create({
          data: {
            name: `Batch${batch.id} - #${i}`,
            bloodline: bloodline,
            date_hatched: new Date(dateHatched),
            age: "CHICK",
            sex: "MALE",
            sireId: sire.id,
            damId: dam.id,
            batchId: batch.id,
          },
        });
      }

      // Create female gamefowl records
      for (let i = maleChicks + 1; i <= maleChicks + femaleChicks; i++) {
        await prisma.gamefowl.create({
          data: {
            name: `Batch${batch.id} - #${i}`,
            bloodline: bloodline,
            date_hatched: new Date(dateHatched),
            age: "CHICK",
            sex: "FEMALE",
            sireId: sire.id,
            damId: dam.id,
            batchId: batch.id,
          },
        });
      }
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error creating batch record:", error);
    return NextResponse.json(
      { error: "Failed to create batch record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, dateHatched, hatchRate, incubate_id } = body;

    // Create the update data object
    const updateData: any = {};

    if (dateHatched) {
      updateData.dateHatched = new Date(dateHatched);
    }

    if (hatchRate) {
      updateData.hatchRate = parseFloat(hatchRate);
    }

    if (incubate_id) {
      updateData.incubate_id = parseInt(incubate_id);
    }

    const batch = await prisma.batch.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error updating batch record:", error);
    return NextResponse.json(
      { error: "Failed to update batch record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      );
    }

    await prisma.batch.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Batch record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting batch record:", error);
    return NextResponse.json(
      { error: "Failed to delete batch record" },
      { status: 500 }
    );
  }
}
