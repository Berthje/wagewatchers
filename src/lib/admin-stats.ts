import { db } from "@/lib/db";
import { salaryEntries, reports } from "@/lib/db/schema";
import { sql, desc, isNotNull } from "drizzle-orm";
import { getAnomalyStats } from "@/lib/anomaly-detector";

export interface RecentReport {
  id: number;
  title: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  queue: {
    approved: number;
    pending: number;
    needsReview: number;
    rejected: number;
    total: number;
  };
  /** approved / (approved + rejected); null when nothing has been actioned. */
  approvalRate: number | null;
  entriesTotal: { count: number; last7d: number };
  timeseries: { date: string; count: number }[];
  topSectors: { label: string; count: number }[];
  topCountries: { label: string; count: number }[];
  reports: { todo: number; inProgress: number; recent: RecentReport[] };
  benefitAdoption: { key: string; pct: number }[];
}

/**
 * Read-only aggregation powering the admin Command Center. Every query is a
 * simple count/group-by over indexed columns.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const queue = await getAnomalyStats();

  const [last7Row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salaryEntries)
    .where(sql`${salaryEntries.createdAt} >= now() - interval '7 days'`);

  const series = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${salaryEntries.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`,
    })
    .from(salaryEntries)
    .where(sql`${salaryEntries.createdAt} >= now() - interval '29 days'`)
    .groupBy(sql`date_trunc('day', ${salaryEntries.createdAt})`)
    .orderBy(sql`date_trunc('day', ${salaryEntries.createdAt})`);

  const topSectors = await db
    .select({ label: salaryEntries.sector, count: sql<number>`count(*)` })
    .from(salaryEntries)
    .where(isNotNull(salaryEntries.sector))
    .groupBy(salaryEntries.sector)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const topCountries = await db
    .select({ label: salaryEntries.country, count: sql<number>`count(*)` })
    .from(salaryEntries)
    .where(isNotNull(salaryEntries.country))
    .groupBy(salaryEntries.country)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const reportStatusRows = await db
    .select({ status: reports.status, count: sql<number>`count(*)` })
    .from(reports)
    .groupBy(reports.status);
  const reportCounts: Record<string, number> = Object.fromEntries(
    reportStatusRows.map((r) => [r.status, Number(r.count)])
  );

  const recentReports = await db
    .select({
      id: reports.id,
      title: reports.title,
      type: reports.type,
      priority: reports.priority,
      status: reports.status,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt))
    .limit(5);

  const [adoption] = await db
    .select({
      total: sql<number>`count(*)`,
      companyCar: sql<number>`count(*) filter (where ${salaryEntries.hasCompanyCar})`,
      equity: sql<number>`count(*) filter (where ${salaryEntries.hasEquity})`,
      mealVouchers: sql<number>`count(*) filter (where ${salaryEntries.mealVouchers} is not null and ${salaryEntries.mealVouchers} > 0)`,
      thirteenthMonth: sql<number>`count(*) filter (where ${salaryEntries.thirteenthMonth} is not null and ${salaryEntries.thirteenthMonth} <> '')`,
    })
    .from(salaryEntries);

  const adoptionTotal = Number(adoption?.total ?? 0);
  const pct = (n: number | undefined | null) =>
    adoptionTotal > 0 ? Number(n ?? 0) / adoptionTotal : 0;

  const approvedRejected = queue.approved + queue.rejected;

  return {
    queue,
    approvalRate: approvedRejected > 0 ? queue.approved / approvedRejected : null,
    entriesTotal: { count: queue.total, last7d: Number(last7Row?.count ?? 0) },
    timeseries: series.map((s) => ({ date: s.date, count: Number(s.count) })),
    topSectors: topSectors.map((s) => ({ label: s.label ?? "—", count: Number(s.count) })),
    topCountries: topCountries.map((s) => ({ label: s.label ?? "—", count: Number(s.count) })),
    reports: {
      todo: reportCounts.TODO ?? 0,
      inProgress: reportCounts.IN_PROGRESS ?? 0,
      recent: recentReports.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    },
    benefitAdoption: [
      { key: "Company car", pct: pct(adoption?.companyCar) },
      { key: "Equity", pct: pct(adoption?.equity) },
      { key: "Meal vouchers", pct: pct(adoption?.mealVouchers) },
      { key: "13th month", pct: pct(adoption?.thirteenthMonth) },
    ],
  };
}
