/**
 * Duplicate Entry Detection
 *
 * Detects potential duplicate or reposted salary entries using similarity scoring.
 * Compares new entries against existing ones to identify likely duplicates.
 */

import { distance } from "fastest-levenshtein";
import { db } from "./db";
import { salaryEntries } from "./db/schema";
import { and, eq, ne } from "drizzle-orm";
import type { SalaryEntry } from "./db/schema";

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateEntryId: number | null;
  similarityScore: number; // 0-100, higher = more similar
  matchDetails: string[];
}

interface DuplicateCandidate {
  id: number;
  similarityScore: number;
  matchedFields: string[];
}

// Similarity thresholds
const SIMILARITY_THRESHOLD = 90; // 90% similarity considered a duplicate
const MIN_MATCHING_FIELDS = 5; // Minimum fields that must match

// Field weights for similarity calculation
const FIELD_WEIGHTS = {
  // High weight fields (core identifiers)
  grossSalary: 20,
  jobTitle: 15,
  workCity: 15,
  sector: 10,

  // Medium weight fields
  age: 8,
  education: 7,
  seniority: 7,
  netSalary: 7,

  // Lower weight fields
  workExperience: 5,
  employeeCount: 4,
  officialHours: 3,
  vacationDays: 3,
  teleworkDays: 3,
  mealVouchers: 2,
  ecoCheques: 2,
};

/**
 * Detect if a new entry is a duplicate of existing entries
 */
export async function detectDuplicate(
  entry: Partial<SalaryEntry>,
  excludeEntryId?: number
): Promise<DuplicateDetectionResult> {
  try {
    // Build query to find potential duplicates
    const conditions = [];

    // Must be from same country
    if (entry.country) {
      conditions.push(eq(salaryEntries.country, entry.country));
    }

    // Exclude current entry if editing
    if (excludeEntryId) {
      conditions.push(ne(salaryEntries.id, excludeEntryId));
    }

    // Fetch potential candidates
    const candidates = await db
      .select()
      .from(salaryEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(100); // Limit to recent 100 entries for performance

    if (candidates.length === 0) {
      return {
        isDuplicate: false,
        duplicateEntryId: null,
        similarityScore: 0,
        matchDetails: [],
      };
    }

    // Calculate similarity for each candidate
    const scoredCandidates: DuplicateCandidate[] = candidates
      .map((candidate) => {
        const { score, matchedFields } = calculateSimilarity(entry, candidate);
        return {
          id: candidate.id,
          similarityScore: score,
          matchedFields,
        };
      })
      .filter((candidate) => candidate.matchedFields.length >= MIN_MATCHING_FIELDS)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    // Check if top candidate exceeds threshold
    if (scoredCandidates.length > 0 && scoredCandidates[0].similarityScore >= SIMILARITY_THRESHOLD) {
      const topMatch = scoredCandidates[0];
      return {
        isDuplicate: true,
        duplicateEntryId: topMatch.id,
        similarityScore: topMatch.similarityScore,
        matchDetails: topMatch.matchedFields,
      };
    }

    return {
      isDuplicate: false,
      duplicateEntryId: null,
      similarityScore: scoredCandidates[0]?.similarityScore || 0,
      matchDetails: scoredCandidates[0]?.matchedFields || [],
    };
  } catch (error) {
    console.error("[Duplicate Detector] Error:", error);
    return {
      isDuplicate: false,
      duplicateEntryId: null,
      similarityScore: 0,
      matchDetails: [],
    };
  }
}

/**
 * Calculate similarity score between two entries
 */
function calculateSimilarity(
  entry1: Partial<SalaryEntry>,
  entry2: Partial<SalaryEntry>
): { score: number; matchedFields: string[] } {
  let totalWeight = 0;
  let matchedWeight = 0;
  const matchedFields: string[] = [];

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const key = field as keyof typeof entry1;

    // Skip if either entry doesn't have this field
    if (entry1[key] === null || entry1[key] === undefined) continue;
    if (entry2[key] === null || entry2[key] === undefined) continue;

    totalWeight += weight;

    // Check if fields match based on type
    if (isFieldMatch(entry1[key], entry2[key], key)) {
      matchedWeight += weight;
      matchedFields.push(field);
    }
  }

  // Calculate percentage similarity
  const score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  return { score, matchedFields };
}

/**
 * Check if two field values match
 */
function isFieldMatch(value1: any, value2: any, fieldName: string): boolean {
  // Numeric fields - allow small variance
  if (typeof value1 === "number" && typeof value2 === "number") {
    if (fieldName === "grossSalary" || fieldName === "netSalary" || fieldName === "netCompensation") {
      // Allow 5% variance for salaries
      const variance = Math.abs(value1 - value2) / Math.max(value1, value2);
      return variance <= 0.05;
    }
    // Exact match for other numbers
    return value1 === value2;
  }

  // String fields - case-insensitive comparison with trimming
  if (typeof value1 === "string" && typeof value2 === "string") {
    const normalized1 = value1.trim().toLowerCase();
    const normalized2 = value2.trim().toLowerCase();

    // Exact match for most fields
    if (normalized1 === normalized2) return true;

    // Fuzzy match for job titles and education (allow similar but not exact)
    if (fieldName === "jobTitle" || fieldName === "education") {
      return calculateStringSimilarity(normalized1, normalized2) > 0.8;
    }

    return false;
  }

  // Boolean fields - exact match
  if (typeof value1 === "boolean" && typeof value2 === "boolean") {
    return value1 === value2;
  }

  // Default: no match
  return false;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const levenshteinDistance = distance(longer, shorter);
  return (longer.length - levenshteinDistance) / longer.length;
}

/**
 * Find all potential duplicates for a given entry
 */
export async function findAllDuplicates(
  entry: Partial<SalaryEntry>
): Promise<DuplicateCandidate[]> {
  const conditions = [];

  if (entry.country) {
    conditions.push(eq(salaryEntries.country, entry.country));
  }

  const candidates = await db
    .select()
    .from(salaryEntries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(100);

  return candidates
    .map((candidate) => {
      const { score, matchedFields } = calculateSimilarity(entry, candidate);
      return {
        id: candidate.id,
        similarityScore: score,
        matchedFields,
      };
    })
    .filter((candidate) => candidate.similarityScore >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarityScore - a.similarityScore);
}
