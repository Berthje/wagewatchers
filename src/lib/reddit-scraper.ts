/**
 * Reddit Scraper Utility
 *
 * This module handles scraping posts and comments from Reddit using Snoowrap.
 * It's used by background jobs to fetch new salary data and comments.
 */

import Snoowrap, { Comment as RedditComment, Submission } from "snoowrap";
import { BeSalaryTemplate, CommentData } from "./types";

// Initialize Reddit client
let redditClient: Snoowrap | null = null;

/**
 * Get or initialize the Reddit client
 */
export function getRedditClient(): Snoowrap {
    if (!redditClient) {
        if (
            !process.env.REDDIT_CLIENT_ID ||
            !process.env.REDDIT_CLIENT_SECRET ||
            !process.env.REDDIT_USERNAME ||
            !process.env.REDDIT_PASSWORD
        ) {
            throw new Error(
                "Missing Reddit API credentials. Please set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, and REDDIT_PASSWORD in .env",
            );
        }

        redditClient = new Snoowrap({
            userAgent: "WageWatchers/1.0.0 (Salary Data Aggregator)",
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            username: process.env.REDDIT_USERNAME,
            password: process.env.REDDIT_PASSWORD,
        });

        // Configure for better performance
        redditClient.config({ requestDelay: 1000, warnings: false });
    }

    return redditClient;
}

/**
 * Helper function to extract value after a label
 * Handles labels with optional text in parentheses and question marks
 */
function extractValue(text: string, label: string): string | null {
    // Try multiple patterns to handle different label formats
    const patterns = [
        // Label with optional parentheses content, then : or ? followed by value
        new RegExp(
            `${escapeRegex(label)}(?:\\s*\\([^)]+\\))?[:\\?]\\s*([^\\n]+)`,
            "i",
        ),
        // Just label followed by : and value
        new RegExp(`${escapeRegex(label)}:\\s*([^\\n]+)`, "i"),
        // Label followed by whitespace and value
        new RegExp(`${escapeRegex(label)}\\s+([^\\n]+)`, "i"),
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match) {
            return match[1].trim();
        }
    }

    return null;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);
}

/**
 * Helper function to extract number after a label
 */
function extractNumber(text: string, label: string): number | null {
    const value = extractValue(text, label);
    if (!value) return null;
    const match = new RegExp(/(\d+(?:[.,]\d+)?)/).exec(value);
    return match ? Number.parseFloat(match[1].replace(",", ".")) : null;
}

/**
 * Parse BESalary template format
 */
function parseBESalaryTemplate(
    title: string,
    selftext: string,
): Partial<BeSalaryTemplate> {
    const entry: Partial<BeSalaryTemplate> = {};

    // 1. PERSONALIA
    entry.age = extractNumber(selftext, "Age") ?? undefined;
    entry.education = extractValue(selftext, "Education") ?? undefined;
    entry.workExperience = extractNumber(selftext, "Work experience") ??
        undefined;
    entry.civilStatus = extractValue(selftext, "Civil status") ?? undefined;
    entry.dependents = extractNumber(selftext, "Dependent people/children") ??
        undefined;

    // 2. EMPLOYER PROFILE
    entry.sector = extractValue(selftext, "Sector/Industry") ?? undefined;
    const employeeCount = extractValue(selftext, "Amount of employees");
    entry.employeeCount = employeeCount ?? undefined;

    const multinationalText = extractValue(selftext, "Multinational");
    if (multinationalText) {
        const lower = multinationalText.toLowerCase();
        entry.multinational = lower.includes("yes") || lower === "y";
    }

    // 3. CONTRACT & CONDITIONS
    entry.jobTitle = extractValue(selftext, "Current job title") ?? undefined;
    entry.jobDescription = extractValue(selftext, "Job description") ??
        undefined;
    entry.seniority = extractNumber(selftext, "Seniority") ?? undefined;
    entry.officialHours = extractNumber(selftext, "Official hours/week") ??
        undefined;
    entry.averageHours = extractNumber(selftext, "Average real hours/week") ??
        undefined;
    entry.shiftDescription = extractValue(selftext, "Shiftwork or 9 to 5") ??
        undefined;
    entry.onCall = extractValue(selftext, "On-call duty") ?? undefined;
    entry.vacationDays = extractNumber(selftext, "Vacation days/year") ??
        undefined;

    // 4. SALARY
    entry.grossSalary = extractNumber(selftext, "Gross salary/month") ??
        undefined;
    entry.netSalary = extractNumber(selftext, "Net salary/month") ?? undefined;
    entry.netCompensation = extractNumber(selftext, "Netto compensation") ??
        undefined;
    entry.mobility =
        extractValue(selftext, "Car/bike/... or mobility budget") ?? undefined;
    entry.thirteenthMonth = extractValue(selftext, "13th month") ?? undefined;
    entry.mealVouchers = extractNumber(selftext, "Meal vouchers") ?? undefined;
    entry.ecoCheques = extractNumber(selftext, "Ecocheques") ?? undefined;
    entry.groupInsurance = extractValue(selftext, "Group insurance") ??
        undefined;
    entry.otherInsurances = extractValue(selftext, "Other insurances") ??
        undefined;
    entry.otherBenefits = extractValue(selftext, "Other benefits") ?? undefined;

    // 5. MOBILITY
    entry.workCity = extractValue(selftext, "City/region of work") ?? undefined;
    entry.commuteDistance = extractValue(selftext, "Distance home-work") ??
        undefined;
    entry.commuteMethod = extractValue(selftext, "How do you commute?") ??
        undefined;
    entry.commuteCompensation =
        extractValue(selftext, "How is the travel home-work compensated") ??
        undefined;
    entry.teleworkDays = extractNumber(selftext, "Telework days/week") ??
        undefined;

    // 6. OTHER
    entry.dayOffEase =
        extractValue(selftext, "How easily can you plan a day off") ??
        undefined;
    entry.stressLevel = extractValue(selftext, "Is your job stressful?") ??
        undefined;
    entry.reports = extractNumber(selftext, "Responsible for personnel") ??
        undefined;

    return entry;
}

/**
 * Parse a Reddit post into our salary entry format
 * Supports BESalary template and falls back to generic parsing
 */
export function parseRedditPost(
    submission: Submission,
    subreddit: string,
): BeSalaryTemplate | null {
    try {
        const title = submission.title;
        const selftext = submission.selftext || "";

        const salaryEntry: BeSalaryTemplate = {
            subreddit: subreddit,
            source: `Reddit - r/${subreddit}`,
            sourceUrl: `https://reddit.com${submission.permalink}`,
        };

        // Try to extract country from subreddit
        if (subreddit.toLowerCase().includes("be")) {
            salaryEntry.country = "Belgium";
        } else if (subreddit.toLowerCase().includes("nl")) {
            salaryEntry.country = "Netherlands";
        } else if (subreddit.toLowerCase().includes("fr")) {
            salaryEntry.country = "France";
        } else if (subreddit.toLowerCase().includes("de")) {
            salaryEntry.country = "Germany";
        }

        // Check if this looks like a BESalary template post
        if (
            selftext.includes("PERSONALIA") ||
            selftext.includes("EMPLOYER PROFILE") ||
            selftext.includes("Current job title:")
        ) {
            // Parse using BESalary template
            const parsed = parseBESalaryTemplate(title, selftext);
            Object.assign(salaryEntry, parsed);
        } else {
            // Fallback to generic parsing for non-template posts
            const fullText = `${title}\n${selftext}`.toLowerCase();

            // Extract age if mentioned
            const ageMatch = /(?:age|years old)[:\s]+(\d+)/i.exec(fullText);
            if (ageMatch) {
                salaryEntry.age = Number.parseInt(ageMatch[1]);
            }

            // Extract salary figures
            const grossMatch = /gross[:\s]+[€$]?\s*(\d+(?:[.,]\d+)?)\s*k?/i.exec(
                fullText,
            );
            if (grossMatch) {
                let amount = Number.parseFloat(grossMatch[1].replace(",", "."));
                if (grossMatch[0].toLowerCase().includes("k")) {
                    amount *= 1000;
                }
                salaryEntry.grossSalary = Math.round(amount);
            }

            const netMatch = /net[:\s]+[€$]?\s*(\d+(?:[.,]\d+)?)\s*k?/i.exec(
                fullText,
            );
            if (netMatch) {
                let amount = Number.parseFloat(netMatch[1].replace(",", "."));
                if (netMatch[0].toLowerCase().includes("k")) {
                    amount *= 1000;
                }
                salaryEntry.netSalary = amount;
            }

            // Extract job title from title or content
            const jobTitleMatch = /(?:job|position|role|title)[:\s]+([^\n,.]+)/i.exec(
                fullText,
            ) || /^([^-[]+)/.exec(title);
            if (jobTitleMatch) {
                salaryEntry.jobTitle = jobTitleMatch[1].trim();
            }

            // Extract work experience
            const expMatch = /(?:experience|yoe|years)[:\s]+(\d+)/i.exec(
                fullText,
            );
            if (expMatch) {
                salaryEntry.workExperience = Number.parseInt(expMatch[1]);
            }

            // Store the original post content for reference
            salaryEntry.jobDescription = selftext
                ? selftext.substring(0, 500)
                : title;
        }

        // Only return if we have at least a job title or salary
        if (salaryEntry.jobTitle || salaryEntry.grossSalary) {
            return salaryEntry;
        }

        return null;
    } catch (error) {
        console.error("Error parsing Reddit post:", error);
        return null;
    }
}

/**
 * Fetch new posts from a subreddit
 * @param subreddit The name of the subreddit (without r/)
 * @param limit Maximum number of posts to fetch
 * @param timeframe Time period to fetch from (hour, day, week, month, year, all)
 */
export async function fetchNewPosts(
    subreddit: string,
    limit: number = 25,
    timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "week",
): Promise<Array<{ submission: Submission; parsed: BeSalaryTemplate }>> {
    try {
        const reddit = getRedditClient();
        const subredditObj = reddit.getSubreddit(subreddit);

        // Fetch top posts from the specified timeframe
        const submissions = await subredditObj.getTop({
            time: timeframe,
            limit: limit,
        });

        const results: Array<{
            submission: Submission;
            parsed: BeSalaryTemplate;
        }> = [];

        for (const submission of submissions) {
            // Skip if it's a link post (we want text posts with salary data)
            if (submission.is_self) {
                const parsed = parseRedditPost(submission, subreddit);
                if (parsed) {
                    results.push({ submission, parsed });
                }
            }
        }

        return results;
    } catch (error) {
        console.error(`Error fetching posts from r/${subreddit}:`, error);
        throw error;
    }
}

/**
 * Parse Reddit comment tree recursively
 */
function parseCommentTree(
    comment: RedditComment,
    depth: number = 0,
): CommentData {
    const commentData: CommentData = {
        externalId: comment.id,
        body: comment.body || "",
        author: comment.author?.name || "[deleted]",
        score: comment.score || 0,
        createdAt: new Date(comment.created_utc * 1000),
        depth: depth,
        replies: [],
    };

    // Process replies recursively
    if (comment.replies && Array.isArray(comment.replies)) {
        for (const reply of comment.replies) {
            if (reply && typeof reply === "object" && reply.body) {
                commentData.replies!.push(parseCommentTree(reply, depth + 1));
            }
        }
    }

    return commentData;
}

/**
 * Fetch all comments for a specific Reddit post
 * @param postId The Reddit post ID (from the URL)
 * @returns Array of top-level comments with nested replies
 */
export async function fetchCommentsForPost(
    postId: string,
): Promise<CommentData[]> {
    try {
        const reddit = getRedditClient();

        // Fetch the submission and expand replies with type assertion
        const submission: any = reddit.getSubmission(postId);
        await submission.expandReplies({ limit: Infinity, depth: Infinity });

        const comments: CommentData[] = [];

        // Process top-level comments
        if (submission.comments && Array.isArray(submission.comments)) {
            for (const comment of submission.comments) {
                if (
                    comment && typeof comment === "object" && "body" in comment
                ) {
                    comments.push(
                        parseCommentTree(comment as RedditComment, 0),
                    );
                }
            }
        }

        return comments;
    } catch (error) {
        console.error(`Error fetching comments for post ${postId}:`, error);
        throw error;
    }
} /**
 * Extract Reddit post ID from a URL
 * @param url Reddit post URL
 * @returns Post ID or null if not found
 */

export function extractPostIdFromUrl(url: string): string | null {
    // Match various Reddit URL formats
    const patterns = [
        /reddit\.com\/r\/\w+\/comments\/([a-z0-9]+)/i, // Standard format
        /redd\.it\/([a-z0-9]+)/i, // Short format
    ];

    for (const pattern of patterns) {
        const match = new RegExp(pattern).exec(url);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Check if a post ID has already been scraped
 * @param postId Reddit post ID
 * @param existingPosts Array of existing post source URLs or IDs to check against
 */
export function isPostAlreadyScraped(
    postId: string,
    existingPosts: Array<string | null>,
): boolean {
    return existingPosts.some(
        (url) => url && (url.includes(postId) || url === postId),
    );
}
