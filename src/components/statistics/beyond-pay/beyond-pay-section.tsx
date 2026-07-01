"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { SalaryEntry } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  useSalaryDisplay,
  convertCurrency,
  convertPeriod,
} from "@/contexts/salary-display-context";
import {
  MIN_V2_ENTRIES,
  countSatisfactionEntries,
  satisfactionDistribution,
  medianSalaryBySatisfaction,
  satisfactionBySector,
  satisfactionByWorkerType,
  satisfactionByPerk,
  satisfactionByCommute,
  workerTypeMix,
  contractTypeMix,
  fixedVsVariablePay,
  companyCarFuelMix,
  equityAdoption,
} from "@/lib/statistics/beyond-pay";
import {
  SatisfactionDistributionChart,
  SatisfactionVsPayChart,
  HappiestSectorsChart,
  SatisfactionByWorkerTypeChart,
  PerkSatisfactionChart,
  CommuteSatisfactionChart,
} from "./satisfaction-charts";
import {
  WorkerTypeMixChart,
  ContractTypeChart,
  FixedVsVariableChart,
  CompanyCarFuelChart,
  EquityAdoptionChart,
} from "./structure-charts";

interface BeyondPaySectionProps {
  readonly entries: SalaryEntry[];
  readonly loading?: boolean;
}

const sumCount = (rows: { count?: number }[]) =>
  rows.reduce((total, row) => total + (row.count ?? 0), 0);

/**
 * "Beyond Pay" statistics section — satisfaction and v2-property charts.
 *
 * Gated behind a minimum number of satisfaction-bearing (v2) entries so it stays
 * hidden until there is enough data to be meaningful. Salary values are converted
 * to the user's display currency/period here, before the pure aggregations run.
 */
export function BeyondPaySection({ entries, loading = false }: BeyondPaySectionProps) {
  const t = useTranslations("statistics.beyondPay");
  const { preferences } = useSalaryDisplay();

  // Convert a raw monthly-in-source-currency amount to the display currency + period.
  const convert = useCallback(
    (amount: number | null | undefined, currency?: string | null) => {
      if (amount == null) return 0;
      const inTarget = convertCurrency(amount, currency ?? "EUR", preferences.currency);
      return convertPeriod(inTarget, "monthly", preferences.period);
    },
    [preferences.currency, preferences.period],
  );

  const formatMoney = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: preferences.currency,
        maximumFractionDigits: 0,
      }).format(n),
    [preferences.currency],
  );

  const stats = useMemo(
    () => ({
      totalSatisfaction: countSatisfactionEntries(entries),
      distribution: satisfactionDistribution(entries),
      vsPay: medianSalaryBySatisfaction(entries, convert),
      sectors: satisfactionBySector(entries),
      byWorkerType: satisfactionByWorkerType(entries),
      perks: satisfactionByPerk(entries),
      commute: satisfactionByCommute(entries),
      workerMix: workerTypeMix(entries, convert),
      contracts: contractTypeMix(entries, convert),
      fixedVar: fixedVsVariablePay(entries, convert),
      fixedVarCount: entries.filter(
        (e) => e.fixedGrossSalary != null || e.variableGrossSalary != null,
      ).length,
      fuel: companyCarFuelMix(entries),
      equity: equityAdoption(entries),
    }),
    [entries, convert],
  );

  const enough = stats.totalSatisfaction >= MIN_V2_ENTRIES;
  const basedOn = (n: number) => t("basedOn", { count: n });
  // Recharts caches internal scales; re-key so currency/period changes fully re-render.
  const chartKey = `${preferences.currency}-${preferences.period}`;

  const heading = (
    <div className="space-y-1">
      <h2 className="text-2xl font-bold text-foreground">{t("title")}</h2>
      <p className="text-muted-foreground">{t("subtitle")}</p>
    </div>
  );

  if (!loading && !enough) {
    return (
      <section className="space-y-4 md:space-y-6">
        {heading}
        <Card className="border-border bg-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("placeholder", {
              count: stats.totalSatisfaction,
              needed: Math.max(0, MIN_V2_ENTRIES - stats.totalSatisfaction),
            })}
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4 md:space-y-6" key={chartKey}>
      {heading}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <SatisfactionDistributionChart
            data={stats.distribution}
            loading={loading}
            caption={basedOn(stats.totalSatisfaction)}
          />
        </div>
        <SatisfactionVsPayChart
          data={stats.vsPay}
          loading={loading}
          caption={basedOn(sumCount(stats.vsPay))}
          formatMoney={formatMoney}
        />
        <HappiestSectorsChart
          data={stats.sectors}
          loading={loading}
          caption={basedOn(sumCount(stats.sectors))}
        />
        <SatisfactionByWorkerTypeChart
          data={stats.byWorkerType}
          loading={loading}
          caption={basedOn(sumCount(stats.byWorkerType))}
        />
        <PerkSatisfactionChart data={stats.perks} loading={loading} />
        <CommuteSatisfactionChart
          data={stats.commute}
          loading={loading}
          caption={basedOn(sumCount(stats.commute))}
        />
        <WorkerTypeMixChart
          data={stats.workerMix}
          loading={loading}
          caption={basedOn(sumCount(stats.workerMix))}
          formatMoney={formatMoney}
        />
        <ContractTypeChart
          data={stats.contracts}
          loading={loading}
          caption={basedOn(sumCount(stats.contracts))}
          formatMoney={formatMoney}
        />
        <FixedVsVariableChart
          data={stats.fixedVar}
          loading={loading}
          caption={basedOn(stats.fixedVarCount)}
          formatMoney={formatMoney}
        />
        <CompanyCarFuelChart
          data={stats.fuel}
          loading={loading}
          caption={basedOn(sumCount(stats.fuel))}
        />
        <EquityAdoptionChart data={stats.equity} loading={loading} />
      </div>
    </section>
  );
}
