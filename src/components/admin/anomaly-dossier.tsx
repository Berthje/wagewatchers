"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/logger";
import type { AnomalyExplanation, StatisticalProfile } from "@/lib/anomaly-detector";

function bandColor(score: number) {
  if (score >= 70) return "text-destructive";
  if (score >= 30) return "text-brand";
  return "text-muted-foreground";
}

function fmtEur(n: number | null | undefined) {
  if (n == null) return "—";
  return `€${Math.round(n).toLocaleString()}`;
}

function Histogram({
  histogram,
  entryValue,
  profile,
}: Readonly<{
  histogram: { bucketStart: number; count: number }[];
  entryValue: number;
  profile: StatisticalProfile;
}>) {
  const maxCount = Math.max(1, ...histogram.map((h) => h.count));
  const { min, max } = profile;
  const markerPct = max > min ? Math.min(100, Math.max(0, ((entryValue - min) / (max - min)) * 100)) : 50;

  return (
    <div className="relative flex h-16 items-end gap-px">
      {histogram.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-muted-foreground/25"
          style={{ height: `${Math.max(2, (h.count / maxCount) * 100)}%` }}
        />
      ))}
      <span
        className="absolute inset-y-0 w-0.5 bg-brand"
        style={{ left: `${markerPct}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * The "why was this flagged" dossier — recomputes and explains an entry's
 * anomaly score: comparison group, distribution, and which of the five methods
 * tripped. Lazy-loads on mount, so mount it only when the reviewer opens it.
 */
export function AnomalyDossier({ entryId }: Readonly<{ entryId: number }>) {
  const [data, setData] = useState<AnomalyExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/admin/entries/${entryId}/anomaly`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: AnomalyExplanation) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        logError("Failed to load anomaly dossier", e, { entryId });
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyzing…
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="py-3 font-mono text-xs text-muted-foreground">
        Couldn&apos;t compute the breakdown.
      </p>
    );
  }

  const { score, topReason, comparison, profile, methods, histogram, entryValue, similar } = data;

  return (
    <div className="space-y-5">
      {/* Verdict */}
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-center">
          <div className={cn("font-mono text-4xl font-semibold tabular-nums", bandColor(score))}>
            {score}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            score
          </div>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-foreground">{topReason}</p>
      </div>

      {/* Comparison group */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Compared against
          </span>
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {comparison.level}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-foreground">{comparison.description}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          n = {comparison.sampleSize} comparable entries
        </p>
      </div>

      {profile && entryValue != null ? (
        <>
          {/* Distribution */}
          <div>
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Distribution</span>
              <span className="text-brand">this entry {fmtEur(entryValue)}</span>
            </div>
            <Histogram histogram={histogram} entryValue={entryValue} profile={profile} />
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>min {fmtEur(profile.min)}</span>
              <span>med {fmtEur(profile.median)}</span>
              <span>max {fmtEur(profile.max)}</span>
            </div>
          </div>

          {/* Method breakdown */}
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Method breakdown
            </p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {methods.map((m) => (
                <li key={m.key} className="flex items-center gap-3 px-3 py-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      m.triggered ? "bg-brand" : "bg-muted-foreground/30"
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm",
                        m.triggered ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {m.label}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{m.detail}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-sm tabular-nums",
                      m.triggered ? bandColor(m.subScore) : "text-muted-foreground/40"
                    )}
                  >
                    {m.subScore || "–"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Similar approved entries */}
          {similar.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Similar approved entries
              </p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {similar.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {s.jobTitle || "—"}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {[
                        s.workExperience != null ? `${s.workExperience}y exp` : null,
                        s.age != null ? `age ${s.age}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="shrink-0 font-mono text-foreground">
                      {fmtEur(s.grossSalary)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-lg border border-brand/30 bg-brand/5 p-3 text-sm leading-relaxed text-muted-foreground">
          {topReason}
        </p>
      )}
    </div>
  );
}
