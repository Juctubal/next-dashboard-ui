import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recurrentId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (isNaN(recurrentId)) {
      return NextResponse.json(
        { error: "Invalid recurrent ID" },
        { status: 400 }
      );
    }

    // If date is provided, fetch specific completion record
    if (date) {
      const completionDate = new Date(date);
      completionDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      const completion = await prisma.recurringTaskCompletion.findFirst({
        where: {
          recurrentId: recurrentId,
          date: completionDate,
        },
        include: {
          recurrentSchedule: {
            include: {
              schedule: true,
            },
          },
        },
      });

      if (!completion) {
        return NextResponse.json(
          { error: "Completion record not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(completion);
    }

    // Otherwise, fetch all completion records
    const completions = await prisma.recurringTaskCompletion.findMany({
      where: {
        recurrentId: recurrentId,
      },
      orderBy: {
        date: "desc",
      },
      include: {
        recurrentSchedule: {
          include: {
            schedule: true,
          },
        },
      },
    });

    return NextResponse.json(completions);
  } catch (error) {
    console.error("Error fetching completion records:", error);
    return NextResponse.json(
      { error: "Failed to fetch completion records" },
      { status: 500 }
    );
  }
}
