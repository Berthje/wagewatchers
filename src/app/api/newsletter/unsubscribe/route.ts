import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { newsletterSubscribers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/newsletter/unsubscribe
 * Handles newsletter unsubscribe requests
 * Shows a confirmation page and processes the unsubscribe
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return new Response(
                `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - WageWatchers</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .error { color: #dc2626; background: #fef2f2; padding: 15px; border-radius: 6px; border: 1px solid #fecaca; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .btn:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ Invalid Unsubscribe Link</h1>
        <div class="error">
            <p><strong>Error:</strong> No email address provided in the unsubscribe link.</p>
        </div>
        <p>Please check your email for a valid unsubscribe link, or <a href="/en">visit WageWatchers</a> to manage your subscription.</p>
    </div>
</body>
</html>
                `,
                {
                    status: 400,
                    headers: { 'Content-Type': 'text/html' },
                }
            );
        }

        // Check if the email exists in our database
        const existingSubscriber = await db
            .select()
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.email, email))
            .limit(1);

        if (existingSubscriber.length === 0) {
            return new Response(
                `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - WageWatchers</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #059669; background: #ecfdf5; padding: 15px; border-radius: 6px; border: 1px solid #a7f3d0; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .btn:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Already Unsubscribed</h1>
        <div class="success">
            <p><strong>${email}</strong> is not currently subscribed to WageWatchers newsletters.</p>
        </div>
        <p>If you believe this is an error, you can <a href="/en/newsletter">subscribe again</a> or <a href="/en">visit our website</a>.</p>
    </div>
</body>
</html>
                `,
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' },
                }
            );
        }

        const subscriber = existingSubscriber[0];

        // If already inactive, show already unsubscribed message
        if (!subscriber.isActive) {
            return new Response(
                `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - WageWatchers</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #059669; background: #ecfdf5; padding: 15px; border-radius: 6px; border: 1px solid #a7f3d0; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .btn:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Already Unsubscribed</h1>
        <div class="success">
            <p><strong>${email}</strong> has already been unsubscribed from WageWatchers newsletters.</p>
        </div>
        <p>If you change your mind, you can <a href="/en/newsletter">subscribe again</a> or <a href="/en">visit our website</a>.</p>
    </div>
</body>
</html>
                `,
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' },
                }
            );
        }

        // Check if this is a confirmation request
        const confirm = searchParams.get('confirm');

        if (confirm === 'yes') {
            // Process the unsubscribe
            await db
                .update(newsletterSubscribers)
                .set({ isActive: false })
                .where(eq(newsletterSubscribers.email, email));

            return new Response(
                `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - WageWatchers</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #059669; background: #ecfdf5; padding: 15px; border-radius: 6px; border: 1px solid #a7f3d0; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .btn:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Successfully Unsubscribed</h1>
        <div class="success">
            <p><strong>${email}</strong> has been successfully unsubscribed from WageWatchers newsletters.</p>
        </div>
        <p>We're sorry to see you go! You can <a href="/en/newsletter">subscribe again</a> anytime or <a href="/en">continue using WageWatchers</a> without newsletters.</p>
        <p style="margin-top: 20px;">
            <a href="/en" class="btn">Visit WageWatchers</a>
        </p>
    </div>
</body>
</html>
                `,
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' },
                }
            );
        }

        // Show confirmation page
        return new Response(
            `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - WageWatchers</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .warning { color: #d97706; background: #fffbeb; padding: 15px; border-radius: 6px; border: 1px solid #fcd34d; }
        .btn { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 5px; }
        .btn:hover { background: #b91c1c; }
        .btn-secondary { background: #6b7280; }
        .btn-secondary:hover { background: #4b5563; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Unsubscribe from WageWatchers</h1>
        <div class="warning">
            <p>Are you sure you want to unsubscribe <strong>${email}</strong> from WageWatchers newsletters?</p>
            <p>You will no longer receive weekly updates about new features and improvements.</p>
        </div>
        <p style="text-align: center; margin-top: 30px;">
            <a href="?email=${encodeURIComponent(email)}&confirm=yes" class="btn">Yes, Unsubscribe</a>
            <a href="/en" class="btn btn-secondary">Keep Subscription</a>
        </p>
        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">
            Changed your mind? You can <a href="/en/newsletter">manage your subscription</a> anytime.
        </p>
    </div>
</body>
</html>
            `,
            {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
            }
        );

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return new Response(
            `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - WageWatchers</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .error { color: #dc2626; background: #fef2f2; padding: 15px; border-radius: 6px; border: 1px solid #fecaca; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .btn:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ Something Went Wrong</h1>
        <div class="error">
            <p><strong>Error:</strong> We encountered an issue processing your unsubscribe request.</p>
        </div>
        <p>Please try again later, or <a href="mailto:support@wagewatchers.com">contact support</a> if the problem persists.</p>
        <p style="margin-top: 20px;">
            <a href="/en" class="btn">Visit WageWatchers</a>
        </p>
    </div>
</body>
</html>
            `,
            {
                status: 500,
                headers: { 'Content-Type': 'text/html' },
            }
        );
    }
}