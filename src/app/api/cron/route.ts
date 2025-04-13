import { NextResponse } from "next/server";
import { updateGamefowlAges } from "@/lib/cron";

// This is a simple cron-like endpoint that can be called by an external scheduler
// You can set up a service like Vercel Cron Jobs, GitHub Actions, or a traditional cron job
// to call this endpoint at regular intervals (e.g., daily)

export async function GET(request: Request) {
  try {
    // Check for a secret key to ensure only authorized calls can trigger the cron job
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get("key");

    // Replace 'your-secret-key' with a secure secret key
    if (secretKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the age update
    const result = await updateGamefowlAges();

    if (result.success) {
      return NextResponse.json({
        message: `Cron job completed successfully. Updated age for ${result.updatedCount} gamefowls`,
        updatedCount: result.updatedCount,
      });
    } else {
      throw new Error("Failed to update gamefowl ages");
    }
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
