/**
 * Reddit Comment Fetching Cron Job
 *
 * Runs once per day to fetch comments for recent Reddit posts (≤4 days old).
 * Protected by CRON_SECRET for security.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchCommentsForRecentPosts } from "@/lib/reddit-scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron - Fetch Comments] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron - Fetch Comments] Starting Reddit comment fetching job");

    // Fetch comments for recent posts
    const result = await fetchCommentsForRecentPosts();

    const summary = {
      timestamp: new Date().toISOString(),
      success: result.success,
      entriesProcessed: result.entriesProcessed,
      commentsAdded: result.commentsAdded,
      errors: result.errors,
    };

    console.log("[Cron - Fetch Comments] Job completed:", summary);

    return NextResponse.json({
      success: true,
      message: "Reddit comment fetching completed",
      summary,
    });
  } catch (error) {
    console.error("[Cron - Fetch Comments] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Reddit comments",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
