"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SalaryEntry } from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "next-intl";
import { useSalaryDisplay, convertCurrency } from "@/contexts/salary-display-context";
import { estimateAnnualPackageEUR } from "@/lib/utils/compensation.utils";
import { getOwnedEntryIds, getEntryToken } from "@/lib/entry-ownership";
import { logError } from "@/lib/logger";
import { Sparkles, BarChart3 } from "lucide-react";

interface PeerComparisonProps {
  /** The full approved entry pool (the page's filtered set). */
  readonly entries: SalaryEntry[];
  readonly currencySymbol: string;
}

const MIN_PEERS = 2; // need at least this many comparable peers to be meaningful
const toEUR = (amount: number, currency: string | null) => convertCurrency(amount, currency, "EUR");

// ── Similarity weighting ─────────────────────────────────────────────────────
// Worker type + country are hard prerequisites (you can't fairly compare a
// freelancer day rate to a salaried gross, or a Belgian salary to a Dutch one).
// Age, sector and job title are *soft* weights: peers most like the viewer count
// most, but the cohort never collapses to zero — distant peers just whisper.
const AGE_SIGMA = 2; // gaussian falloff in years: ±1y≈0.88, ±2y≈0.61, ±3y≈0.32
const AGE_FLOOR = 0.05; // very-different ages still count a little
const SECTOR_MISMATCH = 0.5; // "slight tad" — sector matters but doesn't exclude
const TITLE_MISMATCH = 0.7; // job title is free-text, so weight it gently

type WeightedPeer = { pkg: number; w: number };

function normalizeTitle(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** How much a peer counts toward the viewer's distribution (0–1+). */
function similarityWeight(peer: SalaryEntry, me: SalaryEntry): number {
  let w = 1;
  if (me.age != null && peer.age != null) {
    const d = peer.age - me.age;
    w *= Math.max(AGE_FLOOR, Math.exp(-(d * d) / (2 * AGE_SIGMA * AGE_SIGMA)));
  }
  if (me.sector && peer.sector) {
    w *= peer.sector === me.sector ? 1 : SECTOR_MISMATCH;
  }
  const myTitle = normalizeTitle(me.jobTitle);
  const peerTitle = normalizeTitle(peer.jobTitle);
  if (myTitle && peerTitle) {
    w *= peerTitle === myTitle ? 1 : TITLE_MISMATCH;
  }
  return w;
}

/** Weighted quantile over peers pre-sorted ascending by package. */
function weightedQuantile(sorted: WeightedPeer[], q: number, totalW: number): number {
  if (totalW <= 0) return 0;
  const target = q * totalW;
  let cum = 0;
  for (const x of sorted) {
    cum += x.w;
    if (cum >= target) return x.pkg;
  }
  return sorted[sorted.length - 1].pkg;
}

/**
 * "How do I compare?" — compares the viewer's own shared entry (loaded from the
 * ownership tokens in localStorage) against comparable peers, on a fuller annual
 * package estimate, not gross alone. If the viewer hasn't shared a salary yet we
 * show a call-to-action instead; if there aren't enough comparable peers we say so.
 */
export function PeerComparison({ entries, currencySymbol }: PeerComparisonProps) {
  const t = useTranslations("statistics");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { preferences } = useSalaryDisplay();

  const [myEntry, setMyEntry] = useState<SalaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the viewer's own most-recent shared entry from their ownership tokens.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const ids = getOwnedEntryIds();
        if (ids.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }
        const tokensParam = ids
          .map((id) => {
            const token = getEntryToken(id);
            return token ? `${id}:${token}` : null;
          })
          .filter(Boolean)
          .join(",");
        const res = await fetch(
          `/api/entries?ids=${ids.join(",")}&tokens=${encodeURIComponent(tokensParam)}`
        );
        if (res.ok) {
          const data: SalaryEntry[] = await res.json();
          // Most recent first (API orders by createdAt desc).
          if (!cancelled && data.length > 0) setMyEntry(data[0]);
        }
      } catch (e) {
        logError("PeerComparison: failed to load own entry", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const myWorkerType = myEntry?.workerType ?? "whiteCollar";

  // Comparable peers: hard-matched on worker type + country, then similarity-
  // weighted so people close to the viewer's age / sector / job title dominate
  // the distribution. Pre-sorted ascending by package for the weighted quantiles.
  const weightedPeers = useMemo<WeightedPeer[]>(() => {
    if (!myEntry) return [];
    return entries
      .filter(
        (e) =>
          e.id !== myEntry.id &&
          (e.workerType ?? "whiteCollar") === myWorkerType &&
          (!myEntry.country || !e.country || e.country === myEntry.country)
      )
      .map((e) => ({ pkg: estimateAnnualPackageEUR(e, toEUR), w: similarityWeight(e, myEntry) }))
      .filter((x): x is WeightedPeer => x.pkg != null && x.pkg > 0 && x.w > 0)
      .sort((a, b) => a.pkg - b.pkg);
  }, [entries, myEntry, myWorkerType]);

  const myPackage = useMemo(
    () => (myEntry ? estimateAnnualPackageEUR(myEntry, toEUR) : null),
    [myEntry]
  );

  const stats = useMemo(() => {
    const n = weightedPeers.length;
    if (n < MIN_PEERS || myPackage == null) return null;
    const totalW = weightedPeers.reduce((s, x) => s + x.w, 0);
    const sumW2 = weightedPeers.reduce((s, x) => s + x.w * x.w, 0);
    // Kish effective sample size — an honest "how many peers is this really worth".
    const effectiveN = Math.max(1, Math.round((totalW * totalW) / sumW2));
    const belowW = weightedPeers
      .filter((x) => x.pkg <= myPackage)
      .reduce((s, x) => s + x.w, 0);
    return {
      n,
      effectiveN,
      percentile: Math.round((belowW / totalW) * 100),
      p25: weightedQuantile(weightedPeers, 0.25, totalW),
      median: weightedQuantile(weightedPeers, 0.5, totalW),
      p75: weightedQuantile(weightedPeers, 0.75, totalW),
      min: weightedPeers[0].pkg,
      max: weightedPeers[n - 1].pkg,
    };
  }, [weightedPeers, myPackage]);

  // Display annual EUR package in the user's chosen currency (period = annual).
  const fmtPackage = (annualEUR: number) => {
    const inCur = convertCurrency(annualEUR, "EUR", preferences.currency);
    return `${currencySymbol}${Math.round(inCur).toLocaleString()}`;
  };

  const goShare = () => router.push(`/${locale}/add`);

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-10">
          <LoadingSpinner message={t("peerComparison.loading")} fullScreen={false} size="md" />
        </CardContent>
      </Card>
    );
  }

  // No shared salary yet → call to action.
  if (!myEntry) {
    return (
      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">{t("peerComparison.ctaTitle")}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {t("peerComparison.ctaBody")}
            </p>
          </div>
          <Button onClick={goShare} className="mt-1">
            {t("peerComparison.ctaButton")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart3 className="h-5 w-5" />
          {t("peerComparison.title")}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("peerComparison.basisNote")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Your package */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("peerComparison.yourPackage")}</p>
            <p className="font-mono text-3xl font-bold text-foreground">
              {myPackage != null ? fmtPackage(myPackage) : "—"}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                {t("peerComparison.perYear")}
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(`peerComparison.workerType.${myWorkerType}`)}
          </p>
        </div>

        {!stats ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("peerComparison.notEnough", { min: MIN_PEERS })}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-brand/30 bg-brand/5 p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-brand">
                  {stats.percentile}
                  <span className="text-lg">ᵗʰ</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("peerComparison.percentileLabel")}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">
                {t("peerComparison.summary", { percent: stats.percentile, count: stats.effectiveN })}
              </p>
            </div>

            {/* Distribution bar */}
            <div className="space-y-2">
              <div className="relative h-3 w-full rounded-full bg-muted">
                {stats.max > stats.min && (
                  <>
                    <div
                      className="absolute h-3 rounded-full bg-brand/20"
                      style={{
                        left: `${((stats.p25 - stats.min) / (stats.max - stats.min)) * 100}%`,
                        width: `${((stats.p75 - stats.p25) / (stats.max - stats.min)) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute top-[-2px] h-[18px] w-0.5 bg-brand"
                      style={{
                        left: `${((stats.median - stats.min) / (stats.max - stats.min)) * 100}%`,
                      }}
                    />
                    {myPackage != null && (
                      <div
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((myPackage - stats.min) / (stats.max - stats.min)) * 100))}%`,
                        }}
                        aria-label={t("peerComparison.yourPackage")}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="flex justify-between font-mono text-xs text-muted-foreground">
                <span>{fmtPackage(stats.min)}</span>
                <span>{fmtPackage(stats.max)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label={t("peerComparison.p25")} value={fmtPackage(stats.p25)} />
              <Stat label={t("peerComparison.median")} value={fmtPackage(stats.median)} highlight />
              <Stat label={t("peerComparison.p75")} value={fmtPackage(stats.p75)} />
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">{t("peerComparison.packageIncludes")}</p>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`font-mono text-sm font-semibold ${highlight ? "text-brand" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
