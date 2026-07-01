import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { getDashboardStats, type DashboardStats } from "@/lib/admin-stats";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { LedgerList } from "@/components/admin/ledger-list";
import { SubmissionsSparkline, QueueDonut } from "@/components/admin/dashboard-charts";
import { Card } from "@/components/ui/card";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

function SectionCard({
  title,
  action,
  children,
  className,
}: Readonly<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <Card className={className ? `p-5 ${className}` : "p-5"}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </p>
        {action}
      </div>
      {children}
    </Card>
  );
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default async function AdminDashboardPage() {
  const isAuthenticated = await verifyAdminAuth();
  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  let stats: DashboardStats | null = null;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    logError("Failed to load dashboard stats", error);
  }

  const pending = stats ? stats.queue.pending + stats.queue.needsReview : 0;
  const openReports = stats ? stats.reports.todo + stats.reports.inProgress : 0;
  const submissionsTotal = stats ? stats.timeseries.reduce((s, d) => s + d.count, 0) : 0;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Overview"
        title="Command Center"
        subtitle="Everything that needs your attention, right now."
      />

      {!stats ? (
        <Card className="p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Stats unavailable
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Couldn&apos;t reach the database. Refresh to try again.
          </p>
        </Card>
      ) : (
        <>
          {/* Stat band */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              eyebrow="Pending review"
              value={pending.toLocaleString()}
              sub={pending > 0 ? "needs your review" : "all clear"}
              href="/admin/review"
              accent={pending > 0}
            />
            <StatCard
              eyebrow="Approval rate"
              value={stats.approvalRate != null ? pct(stats.approvalRate) : "—"}
              sub="approved of actioned"
            />
            <StatCard
              eyebrow="Total entries"
              value={stats.entriesTotal.count.toLocaleString()}
              sub={`+${stats.entriesTotal.last7d} this week`}
            />
            <StatCard
              eyebrow="Open reports"
              value={openReports.toLocaleString()}
              sub={`${stats.reports.todo} to do`}
              href="/admin/reports"
            />
          </div>

          {/* Submissions + queue */}
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionCard
                title="Submissions · 30d"
                action={
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {submissionsTotal.toLocaleString()} total
                  </span>
                }
              >
                <SubmissionsSparkline data={stats.timeseries} />
              </SectionCard>
            </div>
            <SectionCard title="Queue breakdown">
              <QueueDonut queue={stats.queue} />
            </SectionCard>
          </div>

          {/* Top sectors + countries */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <SectionCard title="Top sectors">
              <LedgerList items={stats.topSectors} />
            </SectionCard>
            <SectionCard title="Top countries">
              <LedgerList items={stats.topCountries} />
            </SectionCard>
          </div>

          {/* Recent reports + benefit adoption */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <SectionCard
              title="Recent reports"
              action={
                <Link
                  href="/admin/reports"
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  View →
                </Link>
              }
            >
              {stats.reports.recent.length > 0 ? (
                <ul className="divide-y divide-border">
                  {stats.reports.recent.map((r) => (
                    <li key={r.id}>
                      <Link
                        href="/admin/reports"
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <span className="min-w-0 truncate text-sm text-foreground">{r.title}</span>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60">
                  No reports yet
                </p>
              )}
            </SectionCard>

            <SectionCard title="Benefit adoption">
              <ul className="space-y-3 pt-1">
                {stats.benefitAdoption.map((b) => (
                  <li key={b.key} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-muted-foreground">{b.key}</span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-brand"
                        style={{ width: pct(b.pct) }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-foreground">
                      {pct(b.pct)}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </>
      )}
    </AdminShell>
  );
}
