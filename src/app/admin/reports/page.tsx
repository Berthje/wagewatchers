"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bug, Lightbulb, TrendingUp, X, Calendar, Mail, Hash, GripVertical, Search, Loader2 } from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { logError, logWarning } from "@/lib/logger";

interface Report {
  id: number;
  title: string;
  description: string;
  type: "BUG" | "FEATURE" | "IMPROVEMENT";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  updatedAt: string;
  trackingId: string;
  email?: string;
}

type Status = Report["status"];

const statusColumns: Status[] = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
const statusLabels: Record<Status, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

// Restrained priority scale: brand for what's urgent, destructive only for
// critical, muted otherwise — no rainbow of semantic colors.
const priorityBadgeClass: Record<Report["priority"], string> = {
  LOW: "border-border text-muted-foreground",
  MEDIUM: "border-border text-foreground",
  HIGH: "border-brand/40 text-brand",
  CRITICAL: "border-destructive/40 text-destructive",
};

const typeIcons = {
  BUG: Bug,
  FEATURE: Lightbulb,
  IMPROVEMENT: TrendingUp,
};

function PriorityBadge({ priority }: Readonly<{ priority: Report["priority"] }>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        priorityBadgeClass[priority]
      )}
    >
      {priority}
    </Badge>
  );
}

// Droppable column
function DroppableColumn({
  status,
  children,
  count,
}: Readonly<{ status: Status; children: React.ReactNode; count: number }>) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card transition-colors",
        isOver ? "border-brand bg-brand/5" : "border-border"
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {statusLabels[status]}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className="max-h-[calc(100vh-320px)] flex-1 overflow-y-auto p-3 scrollbar-thin"
      >
        {children}
      </div>
    </div>
  );
}

// Sortable card — drag lives on the grip handle only, so a click on the body
// unambiguously opens the detail sheet.
function SortableReportCard({
  report,
  onSelect,
  pending,
}: Readonly<{ report: Report; onSelect: (id: number) => void; pending: boolean }>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: report.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const TypeIcon = typeIcons[report.type];

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onSelect(report.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(report.id);
          }
        }}
        className="cursor-pointer border-border bg-card p-3.5 transition-colors hover:border-brand/50 focus-visible:border-brand focus-visible:outline-none"
      >
        <div className="mb-2 flex items-start gap-2">
          <button
            type="button"
            aria-label="Drag to move"
            className="mt-0.5 cursor-grab touch-none text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <TypeIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {report.title}
          </p>
        </div>
        <p className="mb-2.5 line-clamp-2 pl-6 text-sm leading-relaxed text-muted-foreground">
          {report.description}
        </p>
        <div className="flex items-center justify-between gap-2 pl-6">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={report.priority} />
            <span className="font-mono text-[11px] text-muted-foreground/70">#{report.id}</span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70">
            {pending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                saving
              </>
            ) : (
              new Date(report.createdAt).toLocaleDateString()
            )}
          </span>
        </div>
      </Card>
    </div>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; type?: string; priority?: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  // Mirror latest reports into a ref so the optimistic updater can read the
  // pre-image without closing over a stale array (the source of the old race).
  const reportsRef = useRef<Report[]>([]);
  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.type) params.append("type", filter.type);
      if (filter.priority) params.append("priority", filter.priority);

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        setReports(await response.json());
      }
    } catch (error) {
      logError("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Optimistic status change with rollback. Applies locally first, reconciles
  // with the server response, and reverts just this report on failure.
  const applyStatus = useCallback((id: number, status: Status) => {
    const prev = reportsRef.current.find((r) => r.id === id);
    if (!prev || prev.status === status) return; // same column / unknown → no-op

    setReports((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
    );
    setPendingIds((p) => new Set(p).add(id));

    fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const server = (await res.json()) as Report;
        setReports((rs) => rs.map((r) => (r.id === id ? server : r)));
      })
      .catch((error) => {
        logWarning("Failed to update report status; rolling back", { id, status });
        logError("Error updating report status", error, { id, status });
        setReports((rs) => rs.map((r) => (r.id === id ? prev : r)));
      })
      .finally(() => {
        setPendingIds((p) => {
          const next = new Set(p);
          next.delete(id);
          return next;
        });
      });
  }, []);

  // Group + search in one memoized pass instead of re-filtering per column per render.
  const byStatus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matches = (r: Report) =>
      q === "" ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.id.toString().includes(q);
    const groups: Record<Status, Report[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      CANCELLED: [],
    };
    for (const r of reports) {
      if (matches(r)) groups[r.status].push(r);
    }
    return groups;
  }, [reports, searchQuery]);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as number);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeReport = reportsRef.current.find((r) => r.id === active.id);
    if (!activeReport) return;

    const overId = over.id;
    // Dropped on a column, or on a card — resolve the target status either way.
    const targetStatus = statusColumns.includes(overId as Status)
      ? (overId as Status)
      : reportsRef.current.find((r) => r.id === overId)?.status;

    if (targetStatus) applyStatus(activeReport.id, targetStatus);
  };

  const selectedReport =
    selectedReportId != null ? reports.find((r) => r.id === selectedReportId) ?? null : null;
  const activeReport = activeId != null ? reports.find((r) => r.id === activeId) ?? null : null;
  const ActiveIcon = activeReport ? typeIcons[activeReport.type] : null;
  const hasFilters = Boolean(searchQuery || filter.status || filter.type || filter.priority);

  return (
    <AdminAuthGuard>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Moderation / Feedback"
          title="Reports"
          subtitle="Bug reports, feature requests, and improvements from the feedback form."
        />

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search title, description, or #ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select
              value={filter.status ?? "all"}
              onValueChange={(v) => setFilter({ ...filter, status: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="TODO">To do</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.type ?? "all"}
              onValueChange={(v) => setFilter({ ...filter, type: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="FEATURE">Feature</SelectItem>
                <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.priority ?? "all"}
              onValueChange={(v) => setFilter({ ...filter, priority: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilter({});
                }}
                className="text-muted-foreground"
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-brand" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Loading reports…
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {statusColumns.map((status) => {
                const columnReports = byStatus[status];
                return (
                  <DroppableColumn key={status} status={status} count={columnReports.length}>
                    <SortableContext
                      items={columnReports.map((r) => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnReports.length > 0 ? (
                        columnReports.map((report) => (
                          <SortableReportCard
                            key={report.id}
                            report={report}
                            onSelect={setSelectedReportId}
                            pending={pendingIds.has(report.id)}
                          />
                        ))
                      ) : (
                        <p className="py-8 text-center font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60">
                          {hasFilters ? "No matches" : "Empty"}
                        </p>
                      )}
                    </SortableContext>
                  </DroppableColumn>
                );
              })}
            </div>

            <DragOverlay>
              {activeReport && ActiveIcon ? (
                <Card className="rotate-2 border-brand/50 bg-card p-3.5 shadow-2xl">
                  <div className="mb-2 flex items-center gap-2">
                    <ActiveIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm font-medium text-foreground">
                      {activeReport.title}
                    </p>
                  </div>
                  <PriorityBadge priority={activeReport.priority} />
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Detail drawer */}
        <Sheet
          open={selectedReport != null}
          onOpenChange={(open) => {
            if (!open) setSelectedReportId(null);
          }}
        >
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
            {selectedReport && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 font-display text-lg">
                    <span className="font-mono text-sm text-muted-foreground">
                      #{selectedReport.id}
                    </span>
                    {selectedReport.title}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={selectedReport.priority} />
                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                      {selectedReport.type}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {statusLabels[selectedReport.status]}
                    </Badge>
                  </div>

                  <div>
                    <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Description
                    </Label>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        Tracking ID
                      </Label>
                      <p className="mt-1 font-mono text-sm text-foreground">
                        {selectedReport.trackingId}
                      </p>
                    </div>
                    {selectedReport.email && (
                      <div>
                        <Label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Label>
                        <p className="mt-1 truncate text-sm text-foreground">{selectedReport.email}</p>
                      </div>
                    )}
                    <div>
                      <Label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Created
                      </Label>
                      <p className="mt-1 font-mono text-sm text-foreground">
                        {new Date(selectedReport.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Updated
                      </Label>
                      <p className="mt-1 font-mono text-sm text-foreground">
                        {new Date(selectedReport.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border pt-6">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Update status
                    </Label>
                    <Select
                      value={selectedReport.status}
                      onValueChange={(newStatus) =>
                        applyStatus(selectedReport.id, newStatus as Status)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusColumns.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </AdminShell>
    </AdminAuthGuard>
  );
}
