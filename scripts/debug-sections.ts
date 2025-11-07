/**
 * Debug section detection
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

  const postId = process.argv[2] || '1op3aea';
  const config = SUBREDDIT_CONFIGS.BESalary;

  console.log(`\n🔍 Debug sections for post: ${postId}\n`);

  const post = await r.getSubmission(postId).fetch();
  const content = post.selftext;

  // Show original vs normalized
  const normalizedContent = content
    .replaceAll(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .replaceAll(/\s+/g, ' '); // Normalize whitespace

  console.log("Template sections to find:");
  for (const section of config.templateSections) {
    console.log(`\n  "${section}"`);
    console.log(`    Exact match: ${content.includes(section)}`);
    console.log(`    Normalized: ${normalizedContent.includes(section)}`);
    console.log(`    With #: ${normalizedContent.includes(`# ${section}`)}`);
    console.log(`    With **: ${normalizedContent.includes(`**${section}**`)}`);

    // Show what's actually there
    const regex = new RegExp(`[#*\\s]*(${section.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    const match = regex.exec(content);
    console.log(`    Found in content: ${match ? 'YES' : 'NO'}`);
    if (match) {
      const start = Math.max(0, match.index - 10);
      const end = Math.min(content.length, match.index + section.length + 10);
      console.log(`    Context: "${content.substring(start, end).replaceAll('\n', '↵')}"`);
    }
  }
}

main();
