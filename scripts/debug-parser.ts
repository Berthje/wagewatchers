/**
 * Debug parser for Reddit posts
 */

import "dotenv/config";
import Snoowrap from "snoowrap";
import { SUBREDDIT_CONFIGS } from "../src/lib/salary-config";

async function main() {
  const r = new Snoowrap({
    userAgent: 'WageWatchers:v1.0.0',
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
  });

  const postId = process.argv[2] || '1oq8gwl';
  const config = SUBREDDIT_CONFIGS.BESalary;

  console.log(`\n🔍 Debug parsing post: ${postId}\n`);

  const post = await r.getSubmission(postId).fetch();
  const content = post.selftext;

  console.log("Testing required fields:\n");

  // Test jobTitle
  const jobTitleMatch = /Current job title:\s*(.+?)(?=\n)/is.exec(content);
  console.log("jobTitle pattern test:");
  console.log("  Match:", jobTitleMatch?.[1] || "NO MATCH");
  console.log("  Cleaned:", jobTitleMatch?.[1]?.replaceAll(/\*\*/g, "").trim() || "NO MATCH");

  // Test grossSalary
  const grossMatch = /Gross salary\/month:\s*([\d.,]+)/i.exec(content);
  console.log("\ngrossSalary pattern test:");
  console.log("  Match:", grossMatch?.[1] || "NO MATCH");

  // Check what's actually in the content around "Gross salary"
  const salarySection = content.match(/Gross salary\/month:[^\n]+/i);
  console.log("  Actual line:", salarySection?.[0] || "LINE NOT FOUND");

  // Test workCity
  const cityMatch = /City\/region of work:\s*(.+?)(?=\n)/is.exec(content);
  console.log("\nworkCity pattern test:");
  console.log("  Match:", cityMatch?.[1] || "NO MATCH");
  console.log("  Cleaned:", cityMatch?.[1]?.replaceAll(/\*\*/g, "").trim() || "NO MATCH");

  console.log("\n" + "─".repeat(60));
  console.log("Full content sample (first 500 chars):\n");
  console.log(content.substring(0, 500));
}

main();
