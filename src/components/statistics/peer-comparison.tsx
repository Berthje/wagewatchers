"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { quantile } from "d3-array";
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

  // Comparable peers: same worker type, excludes the viewer's own entry, with a
  // computable package. (Worker type matters most — you can't fairly compare a
  // freelancer day rate to a salaried gross.)
  const peerPackages = useMemo(() => {
    if (!myEntry) return [];
    return entries
      .filter((e) => e.id !== myEntry.id && (e.workerType ?? "whiteCollar") === myWorkerType)
      .map((e) => estimateAnnualPackageEUR(e, toEUR))
      .filter((v): v is number => v != null && v > 0)
      .sort((a, b) => a - b);
  }, [entries, myEntry, myWorkerType]);

  const myPackage = useMemo(
    () => (myEntry ? estimateAnnualPackageEUR(myEntry, toEUR) : null),
    [myEntry]
  );

  const stats = useMemo(() => {
    const n = peerPackages.length;
    if (n < MIN_PEERS || myPackage == null) return null;
    const below = peerPackages.filter((v) => v <= myPackage).length;
    return {
      n,
      percentile: Math.round((below / n) * 100),
      p25: quantile(peerPackages, 0.25) ?? 0,
      median: quantile(peerPackages, 0.5) ?? 0,
      p75: quantile(peerPackages, 0.75) ?? 0,
      min: peerPackages[0],
      max: peerPackages[n - 1],
    };
  }, [peerPackages, myPackage]);

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
                {t("peerComparison.summary", { percent: stats.percentile, count: stats.n })}
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
