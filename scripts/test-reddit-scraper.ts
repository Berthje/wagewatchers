/**
 * Test Script for Reddit Scraper
 *
 * Tests the Reddit scraping functionality without saving to database.
 * Run with: npm run test:scrape:posts
 */

import "dotenv/config";
import { scrapeSubredditPosts } from "../src/lib/reddit-scraper";

async function testRedditScraper() {
  console.log("🚀 Testing Reddit Scraper\n");
  console.log("=" .repeat(30));

  try {
    // Test scraping BESalary
    console.log("\n📋 Testing BESalary subreddit scraping...\n");

    const result = await scrapeSubredditPosts("BESalary", 10);

    console.log("\n✅ Scraping completed!\n");
    console.log("Results:");
    console.log(`  - Posts processed: ${result.postsProcessed}`);
    console.log(`  - Posts saved: ${result.postsSaved}`);
    console.log(`  - Posts skipped: ${result.postsSkipped}`);
    console.log(`  - Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\n⚠️  Errors:");
      let index = 0;
      for (const error of result.errors) {
        console.log(`  ${index + 1}. ${error}`);
        index++;
      }
    }

    console.log("\n" + "=".repeat(30));
    console.log(
      result.success
        ? "✅ Test completed successfully!"
        : "❌ Test completed with errors"
    );
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }

  process.exit(0);
}

testRedditScraper();
