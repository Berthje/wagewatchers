import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { changelogEntries } from "@/lib/changelog-data";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Get changelog entries from the past week
 * @param daysBack - Number of days to look back (default: 7)
 */
function getRecentChangelog(daysBack: number = 7) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  return changelogEntries.filter((entry) => {
    // Parse the date string (assuming format like "2024-01-15" or "January 15, 2024")
    const entryDate = new Date(entry.date);
    return entryDate >= cutoffDate && entryDate <= now;
  });
}

/**
 * Generate HTML email template for changelog updates
 */
function generateChangelogEmail(entries: typeof changelogEntries, subscriberEmail: string) {
  if (entries.length === 0) {
    return null;
  }

  const changesHtml = entries
    .map(
      (entry) => `
        <div style="margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; color: #111827; font-size: 24px;">Version ${entry.version}</h2>
                <span style="color: #6b7280; font-size: 14px;">${entry.date}</span>
            </div>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
                ${entry.changes.map((change) => `<li style="margin-bottom: 8px;">${change}</li>`).join("")}
            </ul>
        </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WageWatchers Weekly Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1f2937; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 32px;">WageWatchers</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; color: #d1d5db;">Weekly Changelog Update</p>
    </div>
    
    <div style="background-color: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #374151; margin-top: 0;">
            Hi there! 👋
        </p>
        <p style="font-size: 16px; color: #374151;">
            Here's what's new at WageWatchers this week:
        </p>
        
        ${changesHtml}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
                Want to explore the platform? 
                <a href="https://wagewatchers.com/en/dashboard" style="color: #10b981; text-decoration: none; font-weight: 600;">Visit Dashboard</a>
            </p>
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
                View full changelog: 
                <a href="https://wagewatchers.com/en/changelog" style="color: #10b981; text-decoration: none; font-weight: 600;">See All Updates</a>
            </p>
        </div>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 5px 0;">
            You're receiving this email because you subscribed to WageWatchers updates.
        </p>
        <p style="margin: 5px 0;">
            <a href="https://wagewatchers.com/en" style="color: #10b981; text-decoration: none;">Visit Website</a> | 
            <a href="https://wagewatchers.com/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
        </p>
    </div>
</body>
</html>
    `;
}

/**
 * GET /api/newsletter/send-changelog
 * Sends weekly changelog updates to all active subscribers (for Vercel cron jobs)
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  // Vercel cron jobs make GET requests, so we handle them the same as POST
  return POST(request);
}

/**
 * POST /api/newsletter/send-changelog
 * Sends weekly changelog updates to all active subscribers
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    // Get recent changelog entries (past 7 days)
    const recentEntries = getRecentChangelog(7);

    if (recentEntries.length === 0) {
      return NextResponse.json(
        {
          message: "No recent changelog entries to send",
          entriesFound: 0,
        },
        { status: 200 }
      );
    }

    // Get all active newsletter subscribers
    const subscribers = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true));

    if (subscribers.length === 0) {
      return NextResponse.json(
        {
          message: "No active subscribers found",
          entriesFound: recentEntries.length,
        },
        { status: 200 }
      );
    }

    // Generate email HTML
    const emailHtml = generateChangelogEmail(recentEntries, "placeholder@example.com");
    if (!emailHtml) {
      return NextResponse.json({ error: "Failed to generate email template" }, { status: 500 });
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const sendPromises = batch.map(async (subscriber) => {
        try {
          // Generate personalized email for each subscriber
          const personalizedEmailHtml = generateChangelogEmail(recentEntries, subscriber.email);
          if (!personalizedEmailHtml) {
            results.failed++;
            results.errors.push(`Failed to generate email for ${subscriber.email}`);
            return;
          }

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "WageWatchers <updates@wagewatchers.com>",
            to: subscriber.email,
            subject: `WageWatchers Weekly Update - ${recentEntries.length} New ${recentEntries.length === 1 ? "Change" : "Changes"}`,
            html: personalizedEmailHtml,
          });
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to send to ${subscriber.email}: ${error}`);
          console.error(`Failed to send email to ${subscriber.email}:`, error);
        }
      });

      await Promise.all(sendPromises);

      // Add a small delay between batches to avoid overwhelming the email service
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: "Newsletter sent successfully",
      details: {
        entriesFound: recentEntries.length,
        versions: recentEntries.map((e) => e.version),
        totalSubscribers: subscribers.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });
  } catch (error) {
    console.error("Newsletter sending error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
