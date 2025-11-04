/**
 * Test script for sending changelog newsletter
 * 
 * Usage:
 * 1. Make sure you have RESEND_API_KEY and RESEND_FROM_EMAIL in your .env
 * 2. Run: npx tsx scripts/test-changelog-newsletter.ts
 * 
 * This will test the email generation and optionally send a test email
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function testChangelogNewsletter() {
    console.log('🧪 Testing Changelog Newsletter...\n');

    // Check environment variables
    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not found in environment variables');
        return;
    }

    if (!process.env.CRON_SECRET) {
        console.error('❌ CRON_SECRET not found in environment variables');
        return;
    }

    console.log('✅ Environment variables found');
    console.log(`📧 From email: ${process.env.RESEND_FROM_EMAIL || 'Not set (will use default)'}\n`);

    // Test the API endpoint
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/newsletter/send-changelog`
        : 'http://localhost:3000/api/newsletter/send-changelog';

    console.log(`📡 Calling API: ${apiUrl}\n`);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        console.log('📊 Response Status:', response.status);
        console.log('📦 Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Newsletter test completed successfully!');

            if (data.details) {
                console.log('\n📈 Summary:');
                console.log(`   • Changelog entries found: ${data.details.entriesFound}`);
                console.log(`   • Versions: ${data.details.versions?.join(', ') || 'None'}`);
                console.log(`   • Total subscribers: ${data.details.totalSubscribers || 0}`);
                console.log(`   • Successfully sent: ${data.details.sent || 0}`);
                console.log(`   • Failed: ${data.details.failed || 0}`);

                if (data.details.errors && data.details.errors.length > 0) {
                    console.log('\n⚠️ Errors:');
                    for (const error of data.details.errors) {
                        console.log(`   • ${error}`);
                    }
                }
            }
        } else {
            console.error('\n❌ Newsletter test failed!');
        }
    } catch (error) {
        console.error('\n❌ Error calling API:', error);
    }
}

// Run the test
(async () => {
    try {
        await testChangelogNewsletter();
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
})();
