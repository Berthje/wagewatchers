#!/usr/bin/env tsx
/**
 * Test Reddit Scraping Locally
 *
 * This script helps you test the Reddit scraping functionality
 * without deploying or waiting for cron jobs.
 *
 * Usage:
 *   npx tsx scripts/test-reddit-scraping.ts posts
 *   npx tsx scripts/test-reddit-scraping.ts comments
 */

import { PrismaClient } from "@prisma/client";
import {
    extractPostIdFromUrl,
    fetchCommentsForPost,
    fetchNewPosts,
} from "../src/lib/reddit-scraper";

const prisma = new PrismaClient();

async function testFetchPosts() {
    console.log("🧪 Testing Reddit Post Fetching\n");

    try {
        // Test with BESalary subreddit
        console.log("📡 Fetching posts from r/BESalary...");
        const posts = await fetchNewPosts("BESalary", 5, "week");

        console.log(`✅ Found ${posts.length} posts\n`);

        for (const { submission, parsed } of posts) {
            console.log("📄 Post:");
            console.log(`   Title: ${submission.title}`);
            console.log(`   Author: u/${submission.author.name}`);
            console.log(`   Score: ${submission.score}`);
            console.log(`   URL: https://reddit.com${submission.permalink}`);
            console.log(`   Parsed Job Title: ${parsed.jobTitle || "N/A"}`);
            console.log(
                `   Parsed Salary: €${
                    parsed.grossSalary?.toLocaleString() || "N/A"
                }`,
            );
            console.log("");
        }

        console.log(
            "✨ Test completed! To actually save these to the database,",
        );
        console.log(
            "   call the /api/jobs/fetch-posts endpoint or deploy to Vercel.",
        );
    } catch (error) {
        console.error("❌ Error testing post fetching:", error);
    } finally {
        await prisma.$disconnect();
    }
}

async function testFetchComments() {
    console.log("🧪 Testing Reddit Comment Fetching\n");

    try {
        // Find a Reddit entry to test with
        const entry = await prisma.salaryEntry.findFirst({
            where: {
                isManualEntry: false,
                sourceUrl: {
                    contains: "reddit.com",
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!entry || !entry.sourceUrl) {
            console.log(
                "⚠️  No Reddit entries found in database. Please run the post fetch test first.",
            );
            return;
        }

        console.log(`📄 Testing with entry #${entry.id}:`);
        console.log(`   Job: ${entry.jobTitle}`);
        console.log(`   URL: ${entry.sourceUrl}\n`);

        const postId = extractPostIdFromUrl(entry.sourceUrl);
        if (!postId) {
            console.log("❌ Could not extract post ID from URL");
            return;
        }

        console.log("📡 Fetching comments...");
        const comments = await fetchCommentsForPost(postId);

        console.log(`✅ Found ${comments.length} top-level comments\n`);

        // Display first 3 comments
        for (const comment of comments.slice(0, 3)) {
            console.log(`💬 Comment by u/${comment.author}:`);
            console.log(`   Score: ${comment.score}`);
            console.log(
                `   Body: ${comment.body.substring(0, 80)}${
                    comment.body.length > 80 ? "..." : ""
                }`,
            );
            if (comment.replies && comment.replies.length > 0) {
                console.log(`   Replies: ${comment.replies.length}`);
            }
            console.log("");
        }

        if (comments.length > 3) {
            console.log(`... and ${comments.length - 3} more comments\n`);
        }

        console.log(
            "✨ Test completed! To actually save these to the database,",
        );
        console.log(
            "   call the /api/jobs/fetch-comments endpoint or deploy to Vercel.",
        );
    } catch (error) {
        console.error("❌ Error testing comment fetching:", error);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    const command = process.argv[2];

    if (!command || !["posts", "comments"].includes(command)) {
        console.log("Usage:");
        console.log("  npx tsx scripts/test-reddit-scraping.ts posts");
        console.log("  npx tsx scripts/test-reddit-scraping.ts comments");
        process.exit(1);
    }

    // Check for required environment variables
    if (
        !process.env.REDDIT_CLIENT_ID ||
        !process.env.REDDIT_CLIENT_SECRET ||
        !process.env.REDDIT_USERNAME ||
        !process.env.REDDIT_PASSWORD
    ) {
        console.error("❌ Missing Reddit API credentials!");
        console.error("   Please set the following in your .env.local file:");
        console.error("   - REDDIT_CLIENT_ID");
        console.error("   - REDDIT_CLIENT_SECRET");
        console.error("   - REDDIT_USERNAME");
        console.error("   - REDDIT_PASSWORD");
        process.exit(1);
    }

    if (command === "posts") {
        await testFetchPosts();
    } else if (command === "comments") {
        await testFetchComments();
    }
}

main().catch(console.error);
