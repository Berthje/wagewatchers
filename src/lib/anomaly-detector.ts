/**
 * Anomaly Detection Service
 *
 * Identifies and flags unrealistic salary entries using statistical analysis.
 * Compares new entries against similar entries based on contextual attributes
 * like sector, role, age, experience, and region.
 */

import { db } from "./db";
import { salaryEntries, type SalaryEntry } from "./db/schema";
import { and, eq, sql, ne, isNotNull } from "drizzle-orm";

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number; // 0-100, higher = more anomalous
  reason: string;
  reviewStatus: "APPROVED" | "PENDING" | "NEEDS_REVIEW" | "REJECTED";
  comparisonGroup: string;
  sampleSize: number;
}

interface StatisticalProfile {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  count: number;
}

// Configuration constants
const THRESHOLDS = {
  // Z-score thresholds (standard deviations from mean)
  EXTREME_Z_SCORE: 4, // Very extreme outliers
  SIGNIFICANT_Z_SCORE: 3, // Significant outliers
  MODERATE_Z_SCORE: 2.5, // Moderate outliers

  // IQR multipliers for outlier detection
  EXTREME_IQR_MULTIPLIER: 3.5, // Very extreme outliers
  SIGNIFICANT_IQR_MULTIPLIER: 3, // Significant outliers

  // Minimum sample sizes for reliable detection
  MIN_SAMPLE_SIZE_STRICT: 30, // For strict comparisons
  MIN_SAMPLE_SIZE_MODERATE: 15, // For moderate comparisons
  MIN_SAMPLE_SIZE_LOOSE: 5, // For loose comparisons

  // Percentile thresholds
  EXTREME_PERCENTILE: 0.001, // 0.1% outlier (1 in 1000)
  SIGNIFICANT_PERCENTILE: 0.005, // 0.5% outlier (1 in 200)

  // Anomaly score thresholds
  AUTO_APPROVE_THRESHOLD: 30, // Below this, auto-approve
  NEEDS_REVIEW_THRESHOLD: 70, // Above this, needs manual review
};

/**
 * Main entry point for anomaly detection
 * Analyzes a new salary entry and determines if it's anomalous
 */
export async function detectAnomaly(entry: Partial<SalaryEntry>): Promise<AnomalyDetectionResult> {
  // Try progressively broader comparison groups
  let result = await analyzeWithContextualComparison(entry, "strict");

  if (result.sampleSize < THRESHOLDS.MIN_SAMPLE_SIZE_STRICT) {
    result = await analyzeWithContextualComparison(entry, "moderate");
  }

  if (result.sampleSize < THRESHOLDS.MIN_SAMPLE_SIZE_MODERATE) {
    result = await analyzeWithContextualComparison(entry, "loose");
  }

  if (result.sampleSize < THRESHOLDS.MIN_SAMPLE_SIZE_LOOSE) {
    // Not enough data for reliable comparison
    return {
      isAnomaly: false,
      anomalyScore: 0,
      reason: "Insufficient comparable data for analysis",
      reviewStatus: "NEEDS_REVIEW",
      comparisonGroup: result.comparisonGroup,
      sampleSize: result.sampleSize,
    };
  }

  return result;
}

/**
 * Analyzes entry with contextual comparison at different specificity levels
 */
async function analyzeWithContextualComparison(
  entry: Partial<SalaryEntry>,
  level: "strict" | "moderate" | "loose"
): Promise<AnomalyDetectionResult> {
  const filters = buildComparisonFilters(entry, level);
  const comparisonEntries = await fetchComparisonEntries(filters, entry.id);

  if (comparisonEntries.length === 0) {
    return {
      isAnomaly: false,
      anomalyScore: 0,
      reason: "No comparable entries found",
      reviewStatus: "NEEDS_REVIEW",
      comparisonGroup: filters.description,
      sampleSize: 0,
    };
  }

  const salaries = comparisonEntries
    .map((e) => e.grossSalary)
    .filter((s): s is number => s !== null);

  if (salaries.length === 0) {
    return {
      isAnomaly: false,
      anomalyScore: 0,
      reason: "No salary data in comparison group",
      reviewStatus: "NEEDS_REVIEW",
      comparisonGroup: filters.description,
      sampleSize: 0,
    };
  }

  const profile = calculateStatisticalProfile(salaries);
  const anomalyAnalysis = analyzeAnomalyScore(entry.grossSalary!, profile);

  // Determine review status based on anomaly score
  let reviewStatus: "APPROVED" | "PENDING" | "NEEDS_REVIEW";
  if (anomalyAnalysis.score < THRESHOLDS.AUTO_APPROVE_THRESHOLD) {
    reviewStatus = "APPROVED";
  } else if (anomalyAnalysis.score >= THRESHOLDS.NEEDS_REVIEW_THRESHOLD) {
    reviewStatus = "NEEDS_REVIEW";
  } else {
    reviewStatus = "PENDING";
  }

  return {
    isAnomaly: anomalyAnalysis.isAnomaly,
    anomalyScore: anomalyAnalysis.score,
    reason: anomalyAnalysis.reason,
    reviewStatus,
    comparisonGroup: filters.description,
    sampleSize: profile.count,
  };
}

/**
 * Builds database filters based on comparison level
 */
function buildComparisonFilters(
  entry: Partial<SalaryEntry>,
  level: "strict" | "moderate" | "loose"
) {
  const conditions: any[] = [
    eq(salaryEntries.reviewStatus, "APPROVED"), // Only compare against approved entries
    isNotNull(salaryEntries.grossSalary),
  ];

  let description = "";

  // Always filter by country if available
  if (entry.country) {
    conditions.push(eq(salaryEntries.country, entry.country));
    description = `Country: ${entry.country}`;
  }

  if (level === "strict") {
    applyStrictFilters(entry, conditions, description);
  } else if (level === "moderate") {
    applyModerateFilters(entry, conditions, description);
  } else {
    description += ", National average";
  }

  return {
    conditions,
    description: description || "General comparison",
  };
}

/**
 * Apply strict comparison filters
 */
function applyStrictFilters(
  entry: Partial<SalaryEntry>,
  conditions: any[],
  description: string
): string {
  let desc = description;

  if (entry.sector) {
    conditions.push(eq(salaryEntries.sector, entry.sector));
    desc += `, Sector: ${entry.sector}`;
  }

  if (entry.workExperience !== null && entry.workExperience !== undefined) {
    const expRange = 3;
    conditions.push(
      sql`${salaryEntries.workExperience} BETWEEN ${entry.workExperience - expRange} AND ${entry.workExperience + expRange}`
    );
    desc += `, Experience: ${entry.workExperience}±${expRange}yrs`;
  }

  if (entry.age !== null && entry.age !== undefined) {
    const ageRange = 5;
    conditions.push(
      sql`${salaryEntries.age} BETWEEN ${entry.age - ageRange} AND ${entry.age + ageRange}`
    );
    desc += `, Age: ${entry.age}±${ageRange}yrs`;
  }

  return desc;
}

/**
 * Apply moderate comparison filters
 */
function applyModerateFilters(
  entry: Partial<SalaryEntry>,
  conditions: any[],
  description: string
): string {
  let desc = description;

  if (entry.sector) {
    conditions.push(eq(salaryEntries.sector, entry.sector));
    desc += `, Sector: ${entry.sector}`;
  } else if (entry.workExperience !== null && entry.workExperience !== undefined) {
    const expRange = 5;
    conditions.push(
      sql`${salaryEntries.workExperience} BETWEEN ${entry.workExperience - expRange} AND ${entry.workExperience + expRange}`
    );
    desc += `, Experience: ${entry.workExperience}±${expRange}yrs`;
  }

  return desc;
}

/**
 * Fetches comparable entries from database
 */
async function fetchComparisonEntries(
  filters: { conditions: any[]; description: string },
  excludeId?: number
): Promise<SalaryEntry[]> {
  const conditions = filters.conditions;

  // Exclude the current entry if it exists
  if (excludeId) {
    conditions.push(ne(salaryEntries.id, excludeId));
  }

  const entries = await db
    .select()
    .from(salaryEntries)
    .where(and(...conditions))
    .limit(1000); // Reasonable limit for performance

  return entries;
}

/**
 * Calculates comprehensive statistical profile of salary data
 */
function calculateStatisticalProfile(salaries: number[]): StatisticalProfile {
  const sorted = [...salaries].sort((a, b) => a - b);
  const count = sorted.length;

  // Mean
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  // Median
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];

  // Standard deviation
  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const std = Math.sqrt(variance);

  // Quartiles
  const q1Index = Math.floor(count * 0.25);
  const q3Index = Math.floor(count * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  return {
    mean,
    median,
    std,
    min: sorted[0],
    max: sorted[count - 1],
    q1,
    q3,
    iqr,
    count,
  };
}

/**
 * Analyzes how anomalous a salary is compared to statistical profile
 * Returns a score from 0-100 and detailed reasoning
 */
function analyzeAnomalyScore(
  salary: number,
  profile: StatisticalProfile
): {
  isAnomaly: boolean;
  score: number;
  reason: string;
} {
  const reasons: string[] = [];
  let maxScore = 0;

  // 1. Z-Score Analysis (distance from mean in standard deviations)
  const zScore = profile.std > 0 ? Math.abs((salary - profile.mean) / profile.std) : 0;

  if (zScore >= THRESHOLDS.EXTREME_Z_SCORE) {
    maxScore = Math.max(maxScore, 95);
    reasons.push(`Extremely high Z-score (${zScore.toFixed(2)}σ from mean)`);
  } else if (zScore >= THRESHOLDS.SIGNIFICANT_Z_SCORE) {
    maxScore = Math.max(maxScore, 75);
    reasons.push(`Significant Z-score (${zScore.toFixed(2)}σ from mean)`);
  } else if (zScore >= THRESHOLDS.MODERATE_Z_SCORE) {
    maxScore = Math.max(maxScore, 50);
    reasons.push(`Moderate Z-score (${zScore.toFixed(2)}σ from mean)`);
  }

  // 2. IQR Analysis (Tukey's fences method)
  const lowerFence = profile.q1 - THRESHOLDS.SIGNIFICANT_IQR_MULTIPLIER * profile.iqr;
  const upperFence = profile.q3 + THRESHOLDS.SIGNIFICANT_IQR_MULTIPLIER * profile.iqr;
  const extremeLowerFence = profile.q1 - THRESHOLDS.EXTREME_IQR_MULTIPLIER * profile.iqr;
  const extremeUpperFence = profile.q3 + THRESHOLDS.EXTREME_IQR_MULTIPLIER * profile.iqr;

  if (salary < extremeLowerFence || salary > extremeUpperFence) {
    maxScore = Math.max(maxScore, 90);
    reasons.push(
      `Outside extreme IQR fences (${extremeLowerFence.toFixed(0)}-${extremeUpperFence.toFixed(0)})`
    );
  } else if (salary < lowerFence || salary > upperFence) {
    maxScore = Math.max(maxScore, 60);
    reasons.push(`Outside IQR fences (${lowerFence.toFixed(0)}-${upperFence.toFixed(0)})`);
  }

  // 3. Percentile Analysis
  const percentileFromMedian = Math.abs(salary - profile.median) / profile.median;

  if (percentileFromMedian > 3) {
    // 300% difference from median
    maxScore = Math.max(maxScore, 85);
    reasons.push(`${(percentileFromMedian * 100).toFixed(0)}% difference from median`);
  } else if (percentileFromMedian > 2) {
    // 200% difference
    maxScore = Math.max(maxScore, 55);
    reasons.push(`${(percentileFromMedian * 100).toFixed(0)}% difference from median`);
  }

  // 4. Absolute range check (suspicious values)
  if (salary < 1000) {
    maxScore = Math.max(maxScore, 80);
    reasons.push("Suspiciously low salary (<1,000)");
  } else if (salary > 1000000) {
    maxScore = Math.max(maxScore, 85);
    reasons.push("Suspiciously high salary (>1,000,000)");
  }

  // 5. Ratio to mean/median
  const ratioToMean = salary / profile.mean;
  const ratioToMedian = salary / profile.median;

  if (ratioToMean > 5 || ratioToMean < 0.2) {
    maxScore = Math.max(maxScore, 70);
    reasons.push(`Extreme ratio to mean (${ratioToMean.toFixed(2)}x)`);
  }

  if (ratioToMedian > 4 || ratioToMedian < 0.25) {
    maxScore = Math.max(maxScore, 65);
    reasons.push(`Extreme ratio to median (${ratioToMedian.toFixed(2)}x)`);
  }

  // Compile final result
  const isAnomaly = maxScore >= THRESHOLDS.AUTO_APPROVE_THRESHOLD;
  const finalReason =
    reasons.length > 0
      ? reasons.join("; ")
      : `Normal entry (Mean: €${profile.mean.toFixed(0)}, Median: €${profile.median.toFixed(0)}, Z-score: ${zScore.toFixed(2)})`;

  return {
    isAnomaly,
    score: maxScore,
    reason: finalReason,
  };
}

/**
 * Batch analysis for existing entries (for migration or recalculation)
 */
export async function batchAnalyzeEntries(limit = 100): Promise<void> {
  const entries = await db
    .select()
    .from(salaryEntries)
    .where(eq(salaryEntries.reviewStatus, "APPROVED"))
    .limit(limit);

  for (const entry of entries) {
    const result = await detectAnomaly(entry);

    // Only flag if it would have been flagged
    if (result.reviewStatus !== "APPROVED") {
      await db
        .update(salaryEntries)
        .set({
          reviewStatus: result.reviewStatus,
          anomalyScore: result.anomalyScore,
          anomalyReason: result.reason,
        })
        .where(eq(salaryEntries.id, entry.id));
    }
  }
}

/**
 * Gets statistics about anomaly detection performance
 */
export async function getAnomalyStats() {
  const approved = await db
    .select({ count: sql<number>`count(*)` })
    .from(salaryEntries)
    .where(eq(salaryEntries.reviewStatus, "APPROVED"));

  const pending = await db
    .select({ count: sql<number>`count(*)` })
    .from(salaryEntries)
    .where(eq(salaryEntries.reviewStatus, "PENDING"));

  const needsReview = await db
    .select({ count: sql<number>`count(*)` })
    .from(salaryEntries)
    .where(eq(salaryEntries.reviewStatus, "NEEDS_REVIEW"));

  const rejected = await db
    .select({ count: sql<number>`count(*)` })
    .from(salaryEntries)
    .where(eq(salaryEntries.reviewStatus, "REJECTED"));

  return {
    approved: Number(approved[0]?.count || 0),
    pending: Number(pending[0]?.count || 0),
    needsReview: Number(needsReview[0]?.count || 0),
    rejected: Number(rejected[0]?.count || 0),
    total:
      Number(approved[0]?.count || 0) +
      Number(pending[0]?.count || 0) +
      Number(needsReview[0]?.count || 0) +
      Number(rejected[0]?.count || 0),
  };
}
