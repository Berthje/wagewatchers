"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, MapPin, Briefcase, Loader2, Check, XCircle, Eye } from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntryDetailModal } from "@/components/admin-entry-detail-modal";
import { RiskChip, StatusBadge, formatCurrency } from "@/components/admin/entry-helpers";
import type { SalaryEntry as FullSalaryEntry } from "@/lib/db/schema";
import { logError } from "@/lib/logger";

interface ReportedEntry {
  id: number;
  jobTitle: string | null;
  country: string | null;
  sector: string | null;
  grossSalary: number | null;
  currency: string | null;
  anomalyScore: number | null;
  reviewStatus: string;
  reportCount: number;
  createdAt: string;
}

interface ReportedItem {
  entry: ReportedEntry;
  reports: { reason: string | null; createdAt: string }[];
}

export default function ReportedEntriesPage() {
  const [items, setItems] = useState<ReportedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  const [detailEntryId, setDetailEntryId] = useState<number | null>(null);
  const [detailEntry, setDetailEntry] = useState<FullSalaryEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reported-entries");
      if (res.ok) setItems(await res.json());
    } catch (error) {
      logError("Failed to fetch reported entries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resolve = async (entryId: number, action: "dismiss" | "reject") => {
    setProcessing((prev) => new Set(prev).add(entryId));
    try {
      const res = await fetch("/api/admin/reported-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, action }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((it) => it.entry.id !== entryId));
    } catch (error) {
      logError(`Failed to ${action} reported entry`, error, { entryId });
    } finally {
      setProcessing((prev) => {
        const n = new Set(prev);
        n.delete(entryId);
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
      if (!res.ok) throw new Error("Failed to fetch entry");
      setDetailEntry(await res.json());
    } catch (error) {
      logError("Failed to fetch entry details", error, { entryId });
      setDetailEntryId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminAuthGuard>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Moderation / Reports"
          title="Reported entries"
          subtitle="Entries flagged by users — the highest-signal moderation queue. Dismiss to keep, or reject to hide."
        />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <Card className="lp-ledger p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Nothing reported
            </p>
            <p className="mt-2 font-display text-xl font-semibold">All clear</p>
            <p className="mt-1 text-sm text-muted-foreground">No entries currently have user reports.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map(({ entry, reports }) => {
              const busy = processing.has(entry.id);
              return (
                <Card key={entry.id} className="border-border p-4 md:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {entry.jobTitle || "Untitled position"}
                    </h3>
                    <span className="flex items-center gap-1 rounded-md border border-destructive/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      {entry.reportCount} report{entry.reportCount !== 1 ? "s" : ""}
                    </span>
                    <RiskChip score={entry.anomalyScore} />
                    <StatusBadge status={entry.reviewStatus} />
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
                    <span className="text-foreground">
                      {formatCurrency(entry.grossSalary, entry.currency)}
                    </span>
                  </p>

                  {/* Report reasons */}
                  <div className="mt-3 space-y-2">
                    {reports.length > 0 ? (
                      reports.map((r, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span>Report {i + 1}</span>
                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground">
                            {r.reason || (
                              <span className="italic text-muted-foreground">No reason given</span>
                            )}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="font-mono text-xs text-muted-foreground">No report details.</p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDetail(entry.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolve(entry.id, "reject")}
                      disabled={busy}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => resolve(entry.id, "dismiss")} disabled={busy}>
                      <Check className="mr-2 h-4 w-4" />
                      Dismiss reports
                    </Button>
                  </div>
                </Card>
              );
            })}
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
