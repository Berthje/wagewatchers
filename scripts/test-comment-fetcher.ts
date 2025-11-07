/**
 * Test Script for Reddit Comment Fetching
 *
 * Tests the Reddit comment fetching functionality.
 * Run with: npm run test:scrape:comments
 */

import "dotenv/config";
import { fetchCommentsForRecentPosts } from "../src/lib/reddit-scraper";

async function testCommentFetching() {
  console.log("🚀 Testing Reddit Comment Fetcher\n");
  console.log("=".repeat(30));

  try {
    console.log("\n💬 Fetching comments for recent posts...\n");

    const result = await fetchCommentsForRecentPosts();

    console.log("\n✅ Comment fetching completed!\n");
    console.log("Results:");
    console.log(`  - Entries processed: ${result.entriesProcessed}`);
    console.log(`  - Comments added: ${result.commentsAdded}`);
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

testCommentFetching();
