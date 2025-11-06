import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

// Function to create the report schema with translated messages
async function createReportSchema(locale: string = "en") {
  const t = await getTranslations({
    locale,
    namespace: "feedback.validation",
  });

  return z.object({
    title: z.string().min(1, t("titleRequired")).max(200, t("titleTooLong")),
    description: z.string().min(1, t("descriptionRequired")).max(2000, t("descriptionTooLong")),
    type: z.enum(["BUG", "FEATURE", "IMPROVEMENT"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    email: z.email().optional(),
  });
}

// Generate a unique tracking ID
function generateTrackingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TRK-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += "-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/reports - List all reports (for admin kanban board) or search by trackingId/email (for public status page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const trackingId = searchParams.get("trackingId");
    const email = searchParams.get("email");

    // Public search by tracking ID or email
    if (trackingId) {
      const report = await db
        .select()
        .from(reports)
        .where(eq(reports.trackingId, trackingId.toUpperCase()))
        .limit(1);
      return NextResponse.json(report);
    } else if (email) {
      const reportList = await db
        .select()
        .from(reports)
        .where(eq(reports.email, email))
        .orderBy(desc(reports.createdAt));
      return NextResponse.json(reportList);
    } else {
      // Admin filters
      const conditions = [];
      if (status) conditions.push(eq(reports.status, status as any));
      if (type) conditions.push(eq(reports.type, type as any));
      if (priority) conditions.push(eq(reports.priority, priority as any));

      const reportList = await db
        .select()
        .from(reports)
        .where(and(...conditions))
        .orderBy(desc(reports.createdAt));
      return NextResponse.json(reportList);
    }
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = checkRateLimit(clientIP, 5); // 5 submissions per day

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: rateLimitResult.message,
          remaining: 0,
          resetAt: rateLimitResult.resetAt.toISOString(),
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    const body = await request.json();

    // Get locale from query parameter or default to 'en'
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";

    // Create schema with translated messages
    const reportSchema = await createReportSchema(locale);

    // Validate the request body
    const validatedData = reportSchema.parse(body);

    // Generate unique tracking ID
    let trackingId = generateTrackingId();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure tracking ID is unique
    while (attempts < maxAttempts) {
      const existing = await db
        .select()
        .from(reports)
        .where(eq(reports.trackingId, trackingId))
        .limit(1);
      if (!existing[0]) break;
      trackingId = generateTrackingId();
      attempts++;
    }

    const report = await db
      .insert(reports)
      .values({
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        priority: validatedData.priority || "MEDIUM",
        trackingId,
        email: validatedData.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // If email was provided, send confirmation email
    if (validatedData.email) {
      try {
        await fetch(`${request.nextUrl.origin}/api/reports/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report: report[0] }),
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json(
      {
        ...report[0],
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed. Check the types or you may have used bad words / URLS.",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

// PATCH /api/reports - Update a report (for admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    // Get the current report to check if status is changing to DONE
    const currentReport = await db
      .select()
      .from(reports)
      .where(eq(reports.id, Number.parseInt(id)))
      .limit(1);

    if (!currentReport[0]) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const report = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, Number.parseInt(id)))
      .returning();

    // If status was changed to DONE and report has an email, send update email
    if (status === "DONE" && currentReport[0].status !== "DONE" && report[0].email) {
      try {
        await fetch(`${request.nextUrl.origin}/api/reports/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report: report[0],
            emailType: "status_update",
          }),
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json(report[0]);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

// DELETE /api/reports - Delete a report (for admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    await db.delete(reports).where(eq(reports.id, Number.parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
