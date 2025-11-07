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
          // Apply field normalization for text fields
          // This transforms human-written values like "Prof Bachelor energy" → "bachelor"
          const normalizedValue = normalizeFieldValue(fieldName, value);
          extractedData[fieldName] = normalizedValue;
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
        const submission = await reddit.getSubmission(postId);

        await submission.expandReplies({
          limit: Infinity,
          depth: 10
        });

        // Process all comments recursively
        const commentsList = Array.isArray(submission.comments) ? submission.comments : [];

        if (commentsList.length === 0) {
          console.log(`[Comment Fetcher] No comments found for post ${postId}`);
          continue;
        }

        const commentCount = await processCommentTree(
          commentsList,
          entry.id,
          null
        );

        result.commentsAdded += commentCount;

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
    // Skip "More Comments" objects and deleted comments
    if (!comment.body || comment.body === "[deleted]" || comment.body === "[removed]") {
      continue;
    }

    try {
      // Check if comment already exists
      const existing = await db
        .select()
        .from(comments)
        .where(eq(comments.externalId, comment.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing comment (score might have changed)
        await db
          .update(comments)
          .set({
            score: comment.score,
            body: comment.body,
          })
          .where(eq(comments.externalId, comment.id));
      } else {
        // Insert new comment
        const inserted = await db
          .insert(comments)
          .values({
            externalId: comment.id,
            body: comment.body,
            author: comment.author.name,
            score: comment.score,
            depth,
            parentId,
            salaryEntryId,
            createdAt: new Date(comment.created_utc * 1000),
          })
          .returning();

        count++;

        // Process replies recursively
        if (comment.replies && comment.replies.length > 0) {
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
