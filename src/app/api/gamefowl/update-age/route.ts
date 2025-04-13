import { NextResponse } from "next/server";
import { updateGamefowlAges } from "@/lib/cron";

export async function POST(request: Request) {
  try {
    const result = await updateGamefowlAges();

    if (result.success) {
      return NextResponse.json({
        message: `Updated age for ${result.updatedCount} gamefowls`,
        updatedCount: result.updatedCount,
      });
    } else {
      throw new Error("Failed to update gamefowl ages");
    }
  } catch (error) {
    console.error("Error updating gamefowl ages:", error);
    return NextResponse.json(
      { error: "Failed to update gamefowl ages" },
      { status: 500 }
    );
  }
}
