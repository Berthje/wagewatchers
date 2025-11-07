/**
 * Inspect comments in the database to see the full tree structure
 */

import { db } from "../src/lib/db";
import { comments, salaryEntries } from "../src/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function inspectComments() {
  console.log("\n🔍 Inspecting Comments in Database\n");
  console.log("=".repeat(80));

  try {
    // Get all entries with comments
    const entries = await db
      .select({
        id: salaryEntries.id,
        jobTitle: salaryEntries.jobTitle,
        sourceUrl: salaryEntries.sourceUrl,
        source: salaryEntries.source,
      })
      .from(salaryEntries)
      .where(eq(salaryEntries.isManualEntry, false))
      .orderBy(desc(salaryEntries.createdAt))
      .limit(10);

    for (const entry of entries) {
      const entryComments = await db
        .select()
        .from(comments)
        .where(eq(comments.salaryEntryId, entry.id))
        .orderBy(desc(comments.createdAt));

      if (entryComments.length === 0) continue;

      console.log(`\n📝 Entry #${entry.id}: ${entry.jobTitle || "Unknown"}`);
      console.log(`   Source: ${entry.sourceUrl || entry.source || "Unknown"}`);
      console.log(`   Total comments: ${entryComments.length}`);
      console.log("-".repeat(80));

      // Group comments by parent
      const topLevel = entryComments.filter((c) => c.parentId === null);
      const replies = entryComments.filter((c) => c.parentId !== null);

      console.log(`\n   Top-level comments: ${topLevel.length}`);
      console.log(`   Replies: ${replies.length}\n`);

      // Display comment tree
      for (const comment of topLevel) {
        displayComment(comment, entryComments, 0);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Inspection complete!\n");
  } catch (error) {
    console.error("❌ Error inspecting comments:", error);
    process.exit(1);
  }

  process.exit(0);
}

function displayComment(
  comment: any,
  allComments: any[],
  depth: number
): void {
  const indent = "  ".repeat(depth + 1);
  const prefix = depth === 0 ? "💬" : "↳";
  const status = comment.body === "[deleted]" || comment.body === "[removed]" ? " [DELETED]" : "";
  const bodyPreview = comment.body.length > 100
    ? comment.body.slice(0, 100) + "..."
    : comment.body;

  console.log(`${indent}${prefix} ${comment.author} (score: ${comment.score})${status}`);
  console.log(`${indent}   "${bodyPreview}"`);

  // Find and display replies
  const childComments = allComments.filter((c) => c.parentId === comment.id);
  for (const child of childComments) {
    displayComment(child, allComments, depth + 1);
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void inspectComments();
