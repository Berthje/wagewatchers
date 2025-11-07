/**
 * Quick script to inspect a Reddit post format
 */

import Snoowrap from "snoowrap";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  const r = new Snoowrap({
    userAgent: 'WageWatchers:v1.0.0',
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
  });

  const postId = process.argv[2] || '1oq5oe6';

  console.log(`\n🔍 Inspecting post: ${postId}\n`);

  const post = await r.getSubmission(postId).fetch();

  console.log('Title:', post.title);
  console.log('\nAuthor:', post.author.name);
  console.log('Created:', new Date(post.created_utc * 1000).toISOString());
  console.log('\nBody:\n');
  console.log('─'.repeat(80));
  console.log(post.selftext);
  console.log('─'.repeat(80));
}

main();
