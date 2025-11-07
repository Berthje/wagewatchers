/**
 * Reddit Post Scraping Cron Job
 *
 * Runs once per day to fetch new salary posts from configured subreddits.
 * Protected by CRON_SECRET for security.
 */

import { NextRequest, NextResponse } from "next/server";
import { scrapeAllSubreddits } from "@/lib/reddit-scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron - Fetch Posts] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron - Fetch Posts] Starting Reddit post scraping job");

    // Scrape all configured subreddits
    const results = await scrapeAllSubreddits();

    // Compile summary
    const summary = {
      timestamp: new Date().toISOString(),
      success: results.success,
      subreddits: Object.entries(results.results).map(([name, result]) => ({
        name,
        success: result.success,
        postsProcessed: result.postsProcessed,
        postsSkipped: result.postsSkipped,
        postsSaved: result.postsSaved,
        errors: result.errors,
      })),
      totalPostsProcessed: Object.values(results.results).reduce(
        (sum, r) => sum + r.postsProcessed,
        0
      ),
      totalPostsSaved: Object.values(results.results).reduce(
        (sum, r) => sum + r.postsSaved,
        0
      ),
      totalPostsSkipped: Object.values(results.results).reduce(
        (sum, r) => sum + r.postsSkipped,
        0
      ),
    };

    console.log("[Cron - Fetch Posts] Job completed:", summary);

    return NextResponse.json({
      success: true,
      message: "Reddit post scraping completed",
      summary,
    });
  } catch (error) {
    console.error("[Cron - Fetch Posts] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to scrape Reddit posts",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
