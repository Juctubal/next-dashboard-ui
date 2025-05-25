import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test 1: Check if we can connect to database
    const gamefowlCount = await prisma.gamefowl.count({
      where: { isArchived: false },
    });

    // Test 2: Check if we have any male/female gamefowls
    const maleCount = await prisma.gamefowl.count({
      where: { isArchived: false, sex: "MALE" },
    });

    const femaleCount = await prisma.gamefowl.count({
      where: { isArchived: false, sex: "FEMALE" },
    });

    // Test 3: Check breeding eligible gamefowls
    const breedingMales = await prisma.gamefowl.count({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "BREEDING"],
        },
      },
    });

    const breedingFemales = await prisma.gamefowl.count({
      where: {
        isArchived: false,
        sex: "FEMALE",
        status: {
          in: ["IDLE", "BREEDING"],
        },
      },
    });

    // Test 4: Check status distribution
    const statusDistribution = await prisma.gamefowl.groupBy({
      by: ["status", "sex"],
      where: { isArchived: false },
      _count: true,
    });

    // Test 5: Check if we have any conditioning programs
    const programCount = await prisma.conditioningProgram.count();

    // Test 6: Check if gamefowls have required fields
    const sampleGamefowl = await prisma.gamefowl.findFirst({
      where: { isArchived: false },
    });

    // Test 7: Sample breeding eligible gamefowls
    const sampleMale = await prisma.gamefowl.findFirst({
      where: {
        isArchived: false,
        sex: "MALE",
        status: {
          in: ["IDLE", "BREEDING"],
        },
      },
    });

    const sampleFemale = await prisma.gamefowl.findFirst({
      where: {
        isArchived: false,
        sex: "FEMALE",
        status: {
          in: ["IDLE", "BREEDING"],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalGamefowls: gamefowlCount,
        maleGamefowls: maleCount,
        femaleGamefowls: femaleCount,
        breedingEligible: {
          males: breedingMales,
          females: breedingFemales,
        },
        statusDistribution,
        conditioningPrograms: programCount,
        sampleGamefowl: sampleGamefowl
          ? {
              id: sampleGamefowl.id,
              name: sampleGamefowl.name,
              bloodline: sampleGamefowl.bloodline,
              eloRating: sampleGamefowl.eloRating,
              sex: sampleGamefowl.sex,
              status: sampleGamefowl.status,
            }
          : null,
        sampleBreedingPair: {
          male: sampleMale
            ? {
                id: sampleMale.id,
                name: sampleMale.name,
                bloodline: sampleMale.bloodline,
                status: sampleMale.status,
              }
            : null,
          female: sampleFemale
            ? {
                id: sampleFemale.id,
                name: sampleFemale.name,
                bloodline: sampleFemale.bloodline,
                status: sampleFemale.status,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
