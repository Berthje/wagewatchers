"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  Eye,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntryDetailModal } from "@/components/admin-entry-detail-modal";
import { RiskChip, StatusBadge, formatCurrency } from "@/components/admin/entry-helpers";
import type { SalaryEntry as FullSalaryEntry } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/logger";

interface EntryRow {
  id: number;
  jobTitle: string | null;
  country: string | null;
  sector: string | null;
  grossSalary: number | null;
  currency: string | null;
  reviewStatus: string;
  anomalyScore: number | null;
  workerType: string | null;
  createdAt: string;
}

const PAGE_SIZE = 50;

export default function EntriesBrowserPage() {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [workerType, setWorkerType] = useState("all");
  const [offset, setOffset] = useState(0);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [detailEntryId, setDetailEntryId] = useState<number | null>(null);
  const [detailEntry, setDetailEntry] = useState<FullSalaryEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      if (workerType !== "all") params.set("workerType", workerType);
      const res = await fetch(`/api/admin/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows);
        setTotal(data.total);
      }
    } catch (error) {
      logError("Failed to browse entries", error);
    } finally {
      setLoading(false);
    }
  }, [q, status, workerType, offset]);

  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Reset to the first page whenever a filter changes.
  const onFilter = (fn: () => void) => {
    setOffset(0);
    setConfirmDeleteId(null);
    fn();
  };

  const rerun = async (id: number) => {
    setProcessing((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/entries/${id}/rerun`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { entry } = await res.json();
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, reviewStatus: entry.reviewStatus, anomalyScore: entry.anomalyScore }
            : r
        )
      );
    } catch (error) {
      logError("Failed to re-run anomaly", error, { id });
    } finally {
      setProcessing((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  const remove = async (id: number) => {
    setProcessing((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (error) {
      logError("Failed to delete entry", error, { id });
    } finally {
      setConfirmDeleteId(null);
      setProcessing((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  const openDetail = async (id: number) => {
    setDetailEntryId(id);
    setDetailLoading(true);
    setDetailEntry(null);
    try {
      const res = await fetch(`/api/entries/${id}`);
      if (!res.ok) throw new Error("Failed to fetch entry");
      setDetailEntry(await res.json());
    } catch (error) {
      logError("Failed to fetch entry details", error, { id });
      setDetailEntryId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);

  return (
    <AdminAuthGuard>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Moderation / Corpus"
          title="All entries"
          subtitle="Browse, search, and manage every entry — not just the review queue."
        />

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search job title, sector, country…"
              value={q}
              onChange={(e) => onFilter(() => setQ(e.target.value))}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={(v) => onFilter(() => setStatus(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="NEEDS_REVIEW">Needs review</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={workerType} onValueChange={(v) => onFilter(() => setWorkerType(v))}>
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
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {["Entry", "Location", "Sector", "Gross", "Status", "Score", ""].map((h, i) => (
                    <TableHead
                      key={i}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-16 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className="py-16 text-center font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60"
                    >
                      No entries match
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const busy = processing.has(r.id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{r.jobTitle || "—"}</p>
                          <p className="font-mono text-[11px] text-muted-foreground/70">
                            #{r.id}
                            {r.workerType ? ` · ${r.workerType}` : ""}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.country || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.sector || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm tabular-nums text-foreground">
                          {formatCurrency(r.grossSalary, r.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.reviewStatus} />
                        </TableCell>
                        <TableCell>
                          <RiskChip score={r.anomalyScore} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Details"
                              onClick={() => openDetail(r.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Re-run anomaly detection"
                              disabled={busy}
                              onClick={() => rerun(r.id)}
                            >
                              <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
                            </Button>
                            {confirmDeleteId === r.id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy}
                                onClick={() => remove(r.id)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                Confirm
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete"
                                onClick={() => setConfirmDeleteId(r.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0 || loading}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total || loading}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

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
