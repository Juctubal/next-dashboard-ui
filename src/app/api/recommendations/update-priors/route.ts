import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BayesianAnalyzer } from "@/lib/recommendation/bayesian-analyzer";
import { BayesianUpdater } from "@/lib/recommendation/bayesian-updater";

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected in production
    // Only admin users should be able to trigger prior updates

    const analyzer = new BayesianAnalyzer();
    const updater = new BayesianUpdater(prisma, analyzer);

    // Update all priors based on historical data
    await updater.updateAllPriors();

    // Get summary of updated priors
    const summary = analyzer.getPriorsSummary();

    return NextResponse.json({
      success: true,
      message: "Bayesian priors updated successfully",
      data: {
        summary,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating Bayesian priors:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update Bayesian priors",
      },
      { status: 500 }
    );
  }
}
