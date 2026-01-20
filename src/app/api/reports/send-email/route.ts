import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import type { Report } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { report, emailType = "confirmation" } = (await request.json()) as {
      report: Report;
      emailType?: "confirmation" | "status_update";
    };

    if (!report.email) {
      return NextResponse.json({ error: "No email address provided" }, { status: 400 });
    }

    let emailSubject: string;
    let emailBody: string;

    if (emailType === "status_update") {
      emailSubject = `WageWatchers Report Update - ${report.trackingId}`;
      emailBody = generateStatusUpdateEmailHTML(report, request.nextUrl.origin);
    } else {
      emailSubject = `WageWatchers Report Confirmation - ${report.trackingId}`;
      emailBody = generateEmailHTML(report, request.nextUrl.origin);
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      // Fall back to console logging in development
      console.log("=== RESEND_API_KEY NOT CONFIGURED ===");
      console.log("To enable email sending:");
      console.log("1. Sign up at https://resend.com");
      console.log("2. Get your API key from https://resend.com/api-keys");
      console.log("3. Add RESEND_API_KEY to your .env.local file");
      console.log("4. Configure your domain at https://resend.com/domains");
      console.log("\n=== EMAIL WOULD BE SENT ===");
      console.log("To:", report.email);
      console.log("Subject:", emailSubject);
      console.log("===========================\n");

      return NextResponse.json({
        success: true,
        message: "Email logging (Resend not configured)",
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email using Resend
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "WageWatchers <onboarding@resend.dev>",
      to: report.email,
      subject: emailSubject,
      html: emailBody,
    });

    console.log("Email sent successfully:", data);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      data: data.data,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

function generateStatusUpdateEmailHTML(report: Report, baseUrl: string): string {
  const statusUrl = `${baseUrl}/en/status?trackingId=${report.trackingId}`;

  const typeLabels: Record<string, string> = {
    BUG: "Bug Report",
    FEATURE: "Feature Request",
    IMPROVEMENT: "Improvement Suggestion",
  };

  const priorityLabels: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };

  const statusLabels: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Completed",
    CANCELLED: "Cancelled",
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Status Update</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #1c1917;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1c1917;
        }
        .status-update {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .status-update strong {
            font-size: 18px;
            color: #065f46;
        }
        .tracking-id {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .tracking-id strong {
            font-size: 20px;
            color: #92400e;
            font-family: monospace;
        }
        .report-details {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .detail-row {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: 600;
            color: #4b5563;
        }
        .button {
            display: inline-block;
            background-color: #1c1917;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔍 WageWatchers</div>
        </div>

        <h1 style="color: #1c1917; margin-top: 0;">Report Status Update</h1>

        <div class="status-update">
            <p style="margin: 0 0 8px 0;"><strong>Great news!</strong></p>
            <p style="margin: 0;">Your ${
              typeLabels[report.type] || report.type
            } has been marked as <strong>${
              statusLabels[report.status] || report.status
            }</strong>.</p>
        </div>

        <div class="tracking-id">
            <p style="margin: 0 0 8px 0;"><strong>Your Tracking ID:</strong></p>
            <strong>${report.trackingId}</strong>
        </div>

        <div class="report-details">
            <h3 style="margin-top: 0; color: #1c1917;">Report Details</h3>
            <div class="detail-row">
                <span class="detail-label">Type:</span> ${typeLabels[report.type] || report.type}
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority:</span> ${
                  priorityLabels[report.priority] || report.priority
                }
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span> ${
                  statusLabels[report.status] || report.status
                }
            </div>
            <div class="detail-row">
                <span class="detail-label">Title:</span> ${report.title}
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span><br>
                ${report.description.replace(/\n/g, "<br>")}
            </div>
            <div class="detail-row">
                <span class="detail-label">Submitted:</span> ${new Date(
                  report.createdAt
                ).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
            </div>
        </div>

        <a href="${statusUrl}" class="button">View Full Status</a>

        <p>Thank you for helping us improve WageWatchers! Your feedback is invaluable to us.</p>

        <div class="footer">
            <p>If you have any questions or need further assistance, feel free to submit another report or contact us through the feedback form.</p>
            <p style="margin-top: 20px;">
                <em>This is an automated message. Please do not reply to this email.</em>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

function generateEmailHTML(report: Report, baseUrl: string): string {
  const statusUrl = `${baseUrl}/en/status?trackingId=${report.trackingId}`;

  const typeLabels: Record<string, string> = {
    BUG: "Bug Report",
    FEATURE: "Feature Request",
    IMPROVEMENT: "Improvement Suggestion",
  };

  const priorityLabels: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Confirmation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #1c1917;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1c1917;
        }
        .tracking-id {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .tracking-id strong {
            font-size: 20px;
            color: #92400e;
            font-family: monospace;
        }
        .report-details {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .detail-row {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: 600;
            color: #4b5563;
        }
        .button {
            display: inline-block;
            background-color: #1c1917;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔍 WageWatchers</div>
        </div>

        <h1 style="color: #1c1917; margin-top: 0;">Thank You for Your Feedback!</h1>

        <p>We've received your ${
          typeLabels[report.type] || report.type
        } and appreciate you taking the time to help us improve WageWatchers.</p>

        <div class="tracking-id">
            <p style="margin: 0 0 8px 0;"><strong>Your Tracking ID:</strong></p>
            <strong>${report.trackingId}</strong>
            <p style="margin: 12px 0 0 0; font-size: 14px;">Save this ID to check the status of your report at any time.</p>
        </div>

        <div class="report-details">
            <h3 style="margin-top: 0; color: #1c1917;">Report Details</h3>
            <div class="detail-row">
                <span class="detail-label">Type:</span> ${typeLabels[report.type] || report.type}
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority:</span> ${
                  priorityLabels[report.priority] || report.priority
                }
            </div>
            <div class="detail-row">
                <span class="detail-label">Title:</span> ${report.title}
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span><br>
                ${report.description.replace(/\n/g, "<br>")}
            </div>
            <div class="detail-row">
                <span class="detail-label">Submitted:</span> ${new Date(
                  report.createdAt
                ).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
            </div>
        </div>

        <a href="${statusUrl}" class="button">Check Report Status</a>

        <p>You can use your tracking ID (<strong>${report.trackingId}</strong>) or this email address to look up your report's status at any time.</p>

        <div class="footer">
            <p><strong>What happens next?</strong></p>
            <p>Our team will review your submission and update its status as we work on it. You'll be able to track progress using the link above.</p>
            <p style="margin-top: 20px;">
                If you have any questions, feel free to submit another report or contact us through the feedback form.
            </p>
            <p style="margin-top: 20px;">
                <em>This is an automated message. Please do not reply to this email.</em>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}
