/**
 * Reddit Scraper Service
 *
 * Automated Reddit data scraping system using Snoowrap.
 * Fetches and parses structured salary data from designated subreddits.
 * Only processes posts that match their assigned template structure exactly.
 */

import Snoowrap from "snoowrap";
import { db } from "./db";
import { salaryEntries, comments } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SUBREDDIT_CONFIGS } from "./salary-config";
import type { SalaryEntry } from "./db/schema";
import { normalizeFieldValue } from "./field-normalizers";

// Initialize Reddit client
let redditClient: Snoowrap | null = null;

function getRedditClient(): Snoowrap {
  if (redditClient) return redditClient;

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const refreshToken = process.env.REDDIT_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Reddit API credentials are not configured. Required environment variables:\n" +
      "  - REDDIT_CLIENT_ID\n" +
      "  - REDDIT_CLIENT_SECRET\n" +
      "  - REDDIT_REFRESH_TOKEN\n\n"
    );
  }

  console.log("✓ Using Reddit OAuth with refresh token");

  redditClient = new Snoowrap({
    userAgent: "WageWatchers:v1.0.0 (by /u/wagewatchers)",
    clientId,
    clientSecret,
    refreshToken,
  });

  return redditClient;
}

interface ScrapingResult {
  success: boolean;
  postsProcessed: number;
  postsSkipped: number;
  postsSaved: number;
  errors: string[];
}

interface ParsedPostData extends Partial<SalaryEntry> {
  isValid: boolean;
  missingFields?: string[];
  malformedSections?: string[];
}

/**
 * Main function to scrape posts from configured subreddits
 */
export async function scrapeSubredditPosts(
  subredditName: string,
  limit: number = 50
): Promise<ScrapingResult> {
  const result: ScrapingResult = {
    success: true,
    postsProcessed: 0,
    postsSkipped: 0,
    postsSaved: 0,
    errors: [],
  };

  try {
    const reddit = getRedditClient();
    const config = SUBREDDIT_CONFIGS[subredditName];

    if (!config) {
      throw new Error(`No configuration found for subreddit: ${subredditName}`);
    }

    // Fetch new posts from subreddit
    const subreddit = reddit.getSubreddit(subredditName);
    const posts = await subreddit.getNew({ limit });

    console.log(`[Reddit Scraper] Fetched ${posts.length} posts from r/${subredditName}`);

    for (const post of posts) {
      result.postsProcessed++;

      try {
        // Filter: Only process posts with "salary" flair
        const postFlair = post.link_flair_text?.toLowerCase() || '';
        if (!postFlair.includes('salary')) {
          result.postsSkipped++;
          console.log(`[Reddit Scraper] Skipping post without salary flair: ${post.id} (flair: "${post.link_flair_text || 'none'}")`);
          continue;
        }

        const sourceUrl = `https://reddit.com${post.permalink}`;

        // Check if post already exists in database
        const existingEntry = await db
          .select()
          .from(salaryEntries)
          .where(eq(salaryEntries.sourceUrl, sourceUrl))
          .limit(1);

        if (existingEntry.length > 0) {
          result.postsSkipped++;
          console.log(`[Reddit Scraper] Post already exists: ${post.id}`);
          continue;
        }

        // Parse and validate post content
        const parsedData = parseRedditPost(post.selftext, config, subredditName);

        if (!parsedData.isValid) {
          result.postsSkipped++;
          console.log(
            `[Reddit Scraper] Invalid post structure: ${post.id}`,
            parsedData.missingFields,
            parsedData.malformedSections
          );
          continue;
        }

        // Store valid post in database
        await db.insert(salaryEntries).values({
          ...parsedData,
          country: config.country,
          subreddit: subredditName,
          source: "reddit",
          sourceUrl,
          isManualEntry: false,
          reviewStatus: "PENDING", // Reddit posts require review
          createdAt: new Date(post.created_utc * 1000),
        });

        result.postsSaved++;
        console.log(`[Reddit Scraper] Saved post: ${post.id} from r/${subredditName}`);
      } catch (error) {
        result.errors.push(`Error processing post ${post.id}: ${error}`);
        console.error(`[Reddit Scraper] Error processing post ${post.id}:`, error);
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Fatal error scraping r/${subredditName}: ${error}`);
    console.error(`[Reddit Scraper] Fatal error:`, error);
  }

  return result;
}

/**
 * Parse Reddit post content according to template structure
 */
function parseRedditPost(
  content: string,
  config: any,
  subredditName: string
): ParsedPostData {
  // Route to specific parser based on subreddit
  if (subredditName === "BESalary") {
    return parseBESalaryTemplate(content, config);
  }

  // Add more parsers for other subreddits as needed
  return {
    isValid: false,
    malformedSections: ["Unsupported subreddit template"],
  };
}

/**
 * Parse BESalary template structure
 * Must match exact sections and fields as defined in requirements
 */
function parseBESalaryTemplate(content: string, config: any): ParsedPostData {
  const result: ParsedPostData = {
    isValid: true,
    missingFields: [],
    malformedSections: [],
  };

  // Normalize content: remove all Unicode control/formatting characters and normalize whitespace
  const normalizedContent = content
    .replaceAll(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, '') // Remove all control chars, zero-width spaces, etc.
    .replaceAll(/\s+/g, ' ') // Normalize whitespace to single spaces
    .trim();

  // Validate all required sections are present (flexible matching)
  const missingSections = config.templateSections.filter((section: string) => {
    // Normalize the section text the same way
    const normalizedSection = section.replaceAll(/\s+/g, ' ').trim();

    // Try exact match
    if (normalizedContent.includes(normalizedSection)) return false;

    // Try with # markdown headers (e.g., "# 1. PERSONALIA")
    if (normalizedContent.includes(`# ${normalizedSection}`)) return false;

    // Try with ** bold (e.g., "**1. PERSONALIA**")
    if (normalizedContent.includes(`**${normalizedSection}**`)) return false;

    return true; // Section not found
  });

  if (missingSections.length > 0) {
    result.isValid = false;
    result.malformedSections = missingSections;
    return result;
  }

  // Extract fields using regex patterns from config
  const extractedData: Record<string, any> = {};  // Use the field mappings from config with type information
  for (const [fieldName, fieldMappingUnknown] of Object.entries(config.fieldMappings)) {
    const fieldMapping = fieldMappingUnknown as { pattern: RegExp; type: string; required?: boolean };
    // Use original content for extraction (preserves newlines for regex lookaheads)
    const value = extractField(content, fieldMapping.pattern);

    if (value) {
      // Parse value based on field type from config
      switch (fieldMapping.type) {
        case 'boolean': {
          extractedData[fieldName] = value.toUpperCase() === "YES";
          break;
        }

        case 'currency': {
          const numericValue = value.replaceAll(/[,\s]/g, "");
          const parsed = Number.parseInt(numericValue, 10);
          extractedData[fieldName] = Number.isNaN(parsed) ? null : parsed;
          break;
        }

        case 'integer': {
          const parsed = Number.parseInt(value, 10);
          extractedData[fieldName] = Number.isNaN(parsed) ? null : parsed;
          break;
        }

        case 'text':
        default: {
          // Special handling for commuteDistance: extract distance value intelligently
          if (fieldName === 'commuteDistance') {
            extractedData[fieldName] = parseCommuteDistance(value);
          } else {
            // Apply field normalization for text fields
            // This transforms human-written values like "Prof Bachelor energy" → "bachelor"
            const normalizedValue = normalizeFieldValue(fieldName, value);
            extractedData[fieldName] = normalizedValue;
          }
          break;
        }
      }
    } else {
      extractedData[fieldName] = null;
    }
  }

  // Check for critical missing fields (fields marked as required in config)
  const missingCritical = Object.entries(config.fieldMappings)
    .filter(([, fieldMappingUnknown]) => {
      const fieldMapping = fieldMappingUnknown as { required?: boolean };
      return fieldMapping.required;
    })
    .map(([fieldName]) => fieldName)
    .filter(fieldName => !extractedData[fieldName]);

  if (missingCritical.length > 0) {
    result.isValid = false;
    result.missingFields = missingCritical;
  }

  if (missingCritical.length > 0) {
    result.isValid = false;
    result.missingFields = missingCritical;
  }

  // Merge extracted data into result
  Object.assign(result, extractedData);

  return result;
}

/**
 * Parse commute distance from various formats
 * Examples:
 * - "18km 25min" → "18"
 * - "25 kilometers" → "25"
 * - "30 km, 45 minutes" → "30"
 * - "15" → "15"
 * - "20-30 km" → "20-30"
 */
function parseCommuteDistance(value: string): string | null {
  if (!value) return null;

  const lowerValue = value.toLowerCase().trim();

  // Distance keywords in multiple languages
  const distanceKeywords = [
    'km',
    'kilometer',
    'kilometers',
    'kilometre',
    'kilometres',
    'miles',
    'mile',
  ];

  // Time keywords to ignore
  const timeKeywords = [
    'min',
    'mins',
    'minute',
    'minutes',
    'hour',
    'hours',
    'h',
  ];

  // Check if value contains distance keywords
  const hasDistanceKeyword = distanceKeywords.some(keyword => lowerValue.includes(keyword));

  if (hasDistanceKeyword) {
    // Extract number(s) before distance keyword
    // Matches patterns like "18km", "25 kilometers", "20-30 km"
    const distancePattern = /(\d+(?:-\d+)?(?:\.\d+)?)\s*(?:km|kilometer|kilometers|kilometre|kilometres|miles|mile)/i;
    const match = distancePattern.exec(value);

    if (match) {
      return match[1];
    }
  }

  // If no distance keyword but has time keyword, try to extract distance part
  const hasTimeKeyword = timeKeywords.some(keyword => lowerValue.includes(keyword));

  if (hasTimeKeyword) {
    // Try to find a number that's NOT followed by time keywords
    // Pattern: number followed by distance unit or standalone number before time
    const beforeTimePattern = /(\d+(?:-\d+)?(?:\.\d+)?)\s*(?:km|kilometer|kilometers|kilometre|kilometres)?(?=.*(?:min|minute|hour|h))/i;
    const match = beforeTimePattern.exec(value);

    if (match) {
      return match[1];
    }
  }

  // If no keywords found, check if it's just a number or range
  const simpleNumberPattern = /^(\d+(?:-\d+)?(?:\.\d+)?)$/;
  const match = simpleNumberPattern.exec(lowerValue);

  if (match) {
    return match[1];
  }

  // Last resort: extract first number found
  const anyNumberPattern = /(\d+(?:-\d+)?(?:\.\d+)?)/;
  const anyMatch = anyNumberPattern.exec(value);

  return anyMatch ? anyMatch[1] : null;
}

/**
 * Extract a single field using regex
 * Strips markdown formatting (bold, italic, etc.) and currency symbols from captured values
 */
function extractField(content: string, pattern: RegExp): string | null {
  const match = new RegExp(pattern).exec(content);
  if (!match?.[1]) return null;

  let value = match[1].trim();

  // Strip markdown formatting
  value = value
    .replaceAll('**', '')  // Bold
    .replaceAll('__', '')  // Bold (alternative)
    .replaceAll('*', '')   // Italic
    .replaceAll('_', '')   // Italic (alternative)
    .replaceAll(/[€$£¥]/g, '')  // Currency symbols
    .trim();

  return value === "" || value === "-" || value === "N/A" || value === "/" ? null : value;
}

/**
 * Fetch comments for recent Reddit posts
 * Only updates posts that are ≤4 days old
 */
export async function fetchCommentsForRecentPosts(): Promise<{
  success: boolean;
  entriesProcessed: number;
  commentsAdded: number;
  errors: Array<string>;
}> {
  const result = {
    success: true,
    entriesProcessed: 0,
    commentsAdded: 0,
    errors: [] as Array<string>,
  };

  try {
    const reddit = getRedditClient();

    // Calculate cutoff date (4 days ago)
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    // Find entries that need comment updates
    const entriesToUpdate = await db
      .select()
      .from(salaryEntries)
      .where(
        and(
          eq(salaryEntries.source, "reddit"),
          eq(salaryEntries.isManualEntry, false),
          sql`${salaryEntries.createdAt} >= ${fourDaysAgo.toISOString()}`
        )
      );

    console.log(`[Comment Fetcher] Found ${entriesToUpdate.length} entries to update`);

    for (const entry of entriesToUpdate) {
      result.entriesProcessed++;

      try {
        if (!entry.sourceUrl) continue;

        // Extract post ID from URL
        const postIdPattern = /comments\/([a-z0-9]+)\//i;
        const postIdMatch = postIdPattern.exec(entry.sourceUrl);
        if (!postIdMatch) continue;

        const postId = postIdMatch[1];

        // Fetch submission with comments
        // @ts-expect-error Snoowrap has circular type references
        let submission = await reddit.getSubmission(postId);

        // Expand all comment replies with infinite depth to get all comments
        // expandReplies returns the submission with expanded comments
        submission = await submission.expandReplies({
          limit: Infinity,
          depth: Infinity
        });

        // Process all comments recursively
        const commentsList = Array.isArray(submission.comments) ? submission.comments : [];

        if (commentsList.length === 0) {
          console.log(`[Comment Fetcher] No comments found for post ${postId}`);

          // Mark all existing comments for this entry as deleted (they were removed from Reddit)
          await markMissingCommentsAsDeleted(entry.id, []);
          continue;
        }

        console.log(`[Comment Fetcher] Processing ${commentsList.length} top-level comments for post ${postId}`);

        // Collect all comment IDs from Reddit's response
        const redditCommentIds = new Set<string>();
        collectCommentIds(commentsList, redditCommentIds);

        const commentCount = await processCommentTree(
          commentsList,
          entry.id,
          null
        );

        result.commentsAdded += commentCount;

        // Mark comments that are in DB but not in Reddit's response as deleted
        await markMissingCommentsAsDeleted(entry.id, Array.from(redditCommentIds));

        // Update last fetch timestamp
        await db
          .update(salaryEntries)
          .set({ lastCommentsFetch: new Date() })
          .where(eq(salaryEntries.id, entry.id));

        console.log(
          `[Comment Fetcher] Processed ${commentCount} comments for entry ${entry.id}`
        );
      } catch (error) {
        const errorMessage = `Error fetching comments for entry ${entry.id}: ${error}`;
        result.errors.push(errorMessage);
        console.error(`[Comment Fetcher] Error for entry ${entry.id}:`, error);
      }
    }
  } catch (error) {
    result.success = false;
    const errorMessage = `Fatal error fetching comments: ${error}`;
    result.errors.push(errorMessage);
    console.error(`[Comment Fetcher] Fatal error:`, error);
  }

  return result;
}

/**
 * Recursively process comment tree
 */
async function processCommentTree(
  commentList: any[],
  salaryEntryId: number,
  parentId: number | null,
  depth: number = 0
): Promise<number> {
  let count = 0;

  for (const comment of commentList) {
    // Skip "More Comments" objects but process deleted/removed comments
    if (!comment.body) {
      continue;
    }

    try {
      // Check if this is a deleted comment (body shows [deleted] or [removed])
      const isBodyDeleted = comment.body === "[deleted]" || comment.body === "[removed]";

      // Check if author is deleted (Reddit sets author to [deleted] when user deletes but keeps body for replies)
      const isAuthorDeleted = !comment.author || !comment.author.name || comment.author.name === "[deleted]";

      const authorName = comment.author?.name || "[deleted]";

      // Debug logging for deleted comments
      if (isBodyDeleted || isAuthorDeleted) {
        console.log(`[Comment Fetcher] Found deleted comment ${comment.id}, author: ${authorName}, body: ${isBodyDeleted ? "[deleted]" : "preserved"}`);
      }

      // Check if comment already exists
      const existing = await db
        .select()
        .from(comments)
        .where(eq(comments.externalId, comment.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing comment (score, body, or deletion status might have changed)
        const wasDeleted = existing[0].body === "[deleted]" || existing[0].body === "[removed]";
        const nowDeleted = isBodyDeleted;
        const authorChanged = existing[0].author !== authorName;

        if (wasDeleted !== nowDeleted || existing[0].body !== comment.body || existing[0].score !== comment.score || authorChanged) {
          await db
            .update(comments)
            .set({
              score: comment.score,
              // Keep the body if Reddit kept it (author deleted but has replies)
              body: comment.body,
              // Update author to [deleted] if Reddit marked it as deleted
              author: isAuthorDeleted ? "[deleted]" : authorName,
            })
            .where(eq(comments.externalId, comment.id));

          if ((nowDeleted || isAuthorDeleted) && !wasDeleted) {
            console.log(`[Comment Fetcher] Updated comment ${comment.id} to deleted status (author: ${existing[0].author} -> [deleted], body: ${nowDeleted ? "deleted" : "preserved"})`);
          }
        }

        // Process replies recursively even for existing comments (but not for fully deleted comments)
        if (!isBodyDeleted && comment.replies && comment.replies.length > 0) {
          const replyCount = await processCommentTree(
            comment.replies,
            salaryEntryId,
            existing[0].id,
            depth + 1
          );
          count += replyCount;
        }
      } else {
        // Insert new comment
        const inserted = await db
          .insert(comments)
          .values({
            externalId: comment.id,
            body: comment.body,
            author: isAuthorDeleted ? "[deleted]" : authorName,
            score: comment.score,
            depth,
            parentId,
            salaryEntryId,
            createdAt: new Date(comment.created_utc * 1000),
          })
          .returning();

        count++;

        // Process replies recursively for new comments (but not for fully deleted comments)
        if (!isBodyDeleted && comment.replies && comment.replies.length > 0) {
          const replyCount = await processCommentTree(
            comment.replies,
            salaryEntryId,
            inserted[0].id,
            depth + 1
          );
          count += replyCount;
        }
      }
    } catch (error) {
      console.error(`[Comment Fetcher] Error processing comment ${comment.id}:`, error);
    }
  }

  return count;
}

/**
 * Recursively collect all comment IDs from Reddit's response
 */
function collectCommentIds(commentList: any[], idSet: Set<string>): void {
  for (const comment of commentList) {
    if (comment.id) {
      idSet.add(comment.id);
    }

    // Recursively collect from replies
    if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
      collectCommentIds(comment.replies, idSet);
    }
  }
}

/**
 * Mark comments that exist in DB but not in Reddit's response as deleted
 * This respects user privacy when they delete their comments on Reddit
 */
async function markMissingCommentsAsDeleted(
  salaryEntryId: number,
  redditCommentIds: string[]
): Promise<void> {
  try {
    // Get all comments from DB for this entry
    const dbComments = await db
      .select()
      .from(comments)
      .where(eq(comments.salaryEntryId, salaryEntryId));

    // Find comments that are in DB but not in Reddit's response
    const missingComments = dbComments.filter(
      (dbComment) => dbComment.externalId && !redditCommentIds.includes(dbComment.externalId)
    );

    if (missingComments.length > 0) {
      console.log(
        `[Comment Fetcher] Found ${missingComments.length} deleted comments for entry ${salaryEntryId}`
      );

      // Update each missing comment to mark as deleted
      for (const comment of missingComments) {
        // Only update if not already marked as deleted
        if (comment.body !== "[deleted]" && comment.body !== "[removed]") {
          await db
            .update(comments)
            .set({
              body: "[deleted]",
              author: "[deleted]",
            })
            .where(eq(comments.id, comment.id));

          console.log(
            `[Comment Fetcher] Marked comment ${comment.externalId} as deleted (was by ${comment.author})`
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `[Comment Fetcher] Error marking missing comments as deleted:`,
      error
    );
  }
}

/**
 * Scrape all configured subreddits
 */
export async function scrapeAllSubreddits(): Promise<{
  success: boolean;
  results: Record<string, ScrapingResult>;
}> {
  const results: Record<string, ScrapingResult> = {};
  let allSuccessful = true;

  for (const subredditName of Object.keys(SUBREDDIT_CONFIGS)) {
    console.log(`[Reddit Scraper] Starting scrape for r/${subredditName}`);
    const result = await scrapeSubredditPosts(subredditName);
    results[subredditName] = result;

    if (!result.success) {
      allSuccessful = false;
    }
  }

  return {
    success: allSuccessful,
    results,
  };
}
