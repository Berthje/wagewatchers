"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  MapPin,
  Briefcase,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnomalyDossier } from "@/components/admin/anomaly-dossier";
import { RedactedFigure } from "@/components/admin/redacted-figure";
import { AdminEntryDetailModal } from "@/components/admin-entry-detail-modal";
import type { SalaryEntry as FullSalaryEntry } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/logger";

interface ReviewEntry {
  id: number;
  createdAt: string;
  country: string | null;
  sector: string | null;
  jobTitle: string | null;
  workExperience: number | null;
  age: number | null;
  grossSalary: number | null;
  currency: string | null;
  reviewStatus: string;
  anomalyScore: number | null;
  anomalyReason: string | null;
  reportCount: number;
  workerType: string | null;
}

interface AnomalyStats {
  approved: number;
  pending: number;
  needsReview: number;
  rejected: number;
  total: number;
}

const CHECKBOX_TOKENS =
  "border-input ring-offset-background data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground focus-visible:ring-ring";

function formatCurrency(amount: number | null, currency: string | null = "EUR") {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function RiskChip({ score }: Readonly<{ score: number | null }>) {
  if (score == null) return null;
  const label = score >= 70 ? "HIGH" : score >= 30 ? "MED" : "LOW";
  const cls =
    score >= 70
      ? "border-brand text-brand bg-brand/10"
      : score >= 30
        ? "border-border text-foreground"
        : "border-transparent text-muted-foreground";
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider tabular-nums",
        cls
      )}
    >
      {label} · {Math.round(score)}
    </span>
  );
}

function Metric({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-sm text-foreground">{children}</p>
    </div>
  );
}

export default function ReviewPage() {
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [stats, setStats] = useState<AnomalyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    status: "queue",
    workerType: "all",
    riskBand: "all",
    reportedOnly: false,
    q: "",
  });

  // Detail modal
  const [detailEntryId, setDetailEntryId] = useState<number | null>(null);
  const [detailEntry, setDetailEntry] = useState<FullSalaryEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", filters.status);
      if (filters.workerType !== "all") params.set("workerType", filters.workerType);
      if (filters.reportedOnly) params.set("reportedOnly", "true");
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.riskBand === "high") params.set("minScore", "70");
      else if (filters.riskBand === "medium") {
        params.set("minScore", "30");
        params.set("maxScore", "69.999");
      } else if (filters.riskBand === "low") params.set("maxScore", "29.999");

      const [entriesRes, statsRes] = await Promise.all([
        fetch(`/api/admin/review?${params}`),
        fetch("/api/admin/anomaly-stats"),
      ]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      logError("Failed to fetch review data", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced refetch on any filter change (covers search typing too).
  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  const act = async (ids: number[], action: "approve" | "reject") => {
    if (ids.length === 0) return;
    setProcessing((prev) => new Set([...prev, ...ids]));
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          ids.length === 1 ? { entryId: ids[0], action } : { entryIds: ids, action }
        ),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSelectedIds((prev) => {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      });
      await fetchData();
    } catch (error) {
      logError(`Failed to ${action} entries`, error, { ids });
    } finally {
      setProcessing((prev) => {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      });
    }
  };

  const openDetail = async (entryId: number) => {
    setDetailEntryId(entryId);
    setDetailLoading(true);
    setDetailEntry(null);
    try {
      const res = await fetch(`/api/entries/${entryId}`);
      if (!res.ok) throw new Error("Failed to fetch entry details");
      setDetailEntry(await res.json());
    } catch (error) {
      logError("Failed to fetch entry details", error, { entryId });
      setDetailEntryId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const allVisibleSelected = entries.length > 0 && entries.every((e) => selectedIds.has(e.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (entries.every((e) => prev.has(e.id))) return new Set();
      return new Set(entries.map((e) => e.id));
    });
  };

  const statCells: { label: string; value: number; dot?: boolean }[] = stats
    ? [
        { label: "Total", value: stats.total },
        { label: "Approved", value: stats.approved },
        { label: "Pending", value: stats.pending, dot: stats.pending > 0 },
        { label: "Needs review", value: stats.needsReview, dot: stats.needsReview > 0 },
        { label: "Rejected", value: stats.rejected },
      ]
    : [];

  return (
    <AdminAuthGuard>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Moderation / Queue"
          title="Review Queue"
          subtitle="Flagged entries, most anomalous first. Approve or reject — or open the dossier to see why the formula flagged it."
        />

        {/* Status strip */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 divide-border rounded-xl border border-border bg-card md:grid-cols-5 md:divide-x">
            {statCells.map((cell) => (
              <div key={cell.label} className="p-4">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {cell.dot && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  {cell.label}
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
                  {cell.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search job title…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="queue">Review queue</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="NEEDS_REVIEW">Needs review</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.workerType}
            onValueChange={(v) => setFilters((f) => ({ ...f, workerType: v }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Worker type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workers</SelectItem>
              <SelectItem value="whiteCollar">White collar</SelectItem>
              <SelectItem value="blueCollar">Blue collar</SelectItem>
              <SelectItem value="freelancer">Freelancer</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
              <SelectItem value="phdResearcher">PhD researcher</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.riskBand}
            onValueChange={(v) => setFilters((f) => ({ ...f, riskBand: v }))}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any risk</SelectItem>
              <SelectItem value="high">High (≥70)</SelectItem>
              <SelectItem value="medium">Medium (30–69)</SelectItem>
              <SelectItem value="low">Low (&lt;30)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={filters.reportedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters((f) => ({ ...f, reportedOnly: !f.reportedOnly }))}
          >
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Reported
          </Button>
        </div>

        {/* Select-all row */}
        {entries.length > 0 && (
          <div className="mb-3 flex items-center gap-3 px-1">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={toggleSelectAll}
              className={CHECKBOX_TOKENS}
              aria-label="Select all"
            />
            <span className="font-mono text-xs text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${entries.length} entries`}
            </span>
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="lp-ledger p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Queue empty
            </p>
            <p className="mt-2 font-display text-xl font-semibold">All clear</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing matches these filters right now.
            </p>
          </Card>
        ) : (
          <div className="space-y-4 pb-24">
            {entries.map((entry, i) => {
              const busy = processing.has(entry.id);
              const flagged = (entry.anomalyScore ?? 0) >= 30;
              return (
                <Card key={entry.id} className="border-border p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(entry.id)}
                      onCheckedChange={() => toggleSelect(entry.id)}
                      className={cn("mt-1.5", CHECKBOX_TOKENS)}
                      aria-label={`Select entry ${entry.id}`}
                    />
                    <div className="min-w-0 flex-1">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {entry.jobTitle || "Untitled position"}
                        </h3>
                        <RiskChip score={entry.anomalyScore} />
                        {entry.reportCount > 0 && (
                          <span className="flex items-center gap-1 rounded-md border border-destructive/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {entry.reportCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                        {entry.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {entry.country}
                          </span>
                        )}
                        {entry.sector && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {entry.sector}
                          </span>
                        )}
                      </p>

                      {/* Metrics */}
                      <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-4">
                        <Metric label="Gross">
                          <RedactedFigure
                            value={formatCurrency(entry.grossSalary, entry.currency)}
                            redact={flagged}
                            delay={0.1 + Math.min(i, 6) * 0.05}
                          />
                        </Metric>
                        <Metric label="Location">{entry.country || "—"}</Metric>
                        <Metric label="Sector">{entry.sector || "—"}</Metric>
                        <Metric label="Experience">
                          {entry.workExperience == null ? "—" : `${entry.workExperience} yrs`}
                        </Metric>
                      </div>

                      {/* Anomaly note */}
                      {entry.anomalyReason && (
                        <div className="mt-3 border-l-2 border-brand pl-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Anomaly
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {entry.anomalyReason}
                          </p>
                        </div>
                      )}

                      {/* Dossier toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId((prev) => (prev === entry.id ? null : entry.id))
                        }
                        className="mt-3 flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            expandedId === entry.id && "rotate-180"
                          )}
                        />
                        Why flagged?
                      </button>
                      {expandedId === entry.id && (
                        <div className="mt-3 rounded-lg border border-border bg-background/50 p-4">
                          <AnomalyDossier entryId={entry.id} />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetail(entry.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => act([entry.id], "reject")}
                          disabled={busy}
                          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => act([entry.id], "approve")} disabled={busy}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sticky bulk bar */}
        {selectedIds.size > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-40 lg:pl-64">
            <div className="mx-auto mb-5 flex w-fit items-center gap-4 rounded-full border border-border bg-card px-5 py-2.5 shadow-xl">
              <span className="font-mono text-sm tabular-nums text-foreground">
                {selectedIds.size} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => act([...selectedIds], "reject")}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => act([...selectedIds], "approve")}>
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        )}

        {detailEntryId && (
          <AdminEntryDetailModal
            entryId={detailEntryId}
            entry={detailEntry}
            isLoading={detailLoading}
            onClose={() => {
              setDetailEntryId(null);
              setDetailEntry(null);
            }}
          />
        )}
      </AdminShell>
    </AdminAuthGuard>
  );
}
