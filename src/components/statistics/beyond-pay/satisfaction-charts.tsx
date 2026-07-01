"use client";

import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import type {
  SatisfactionBucket,
  SatisfactionVsPay,
  SectorSatisfaction,
  WorkerTypeSatisfaction,
  PerkSatisfaction,
  CommuteSatisfaction,
} from "@/types";
import { ChartCard } from "./chart-card";
import { BeyondPayTooltip } from "./beyond-pay-tooltip";
import { ACCENT, ACCENT_MUTED, PALETTE, AXIS_TICK } from "./palette";

interface BaseChartProps {
  readonly loading?: boolean;
  readonly caption?: string;
}

const scoreLabel = (v: number | unknown) => `${v}/10`;

// 1 — Satisfaction distribution (histogram 0–10)
export function SatisfactionDistributionChart({
  data,
  loading,
  caption,
}: BaseChartProps & { readonly data: SatisfactionBucket[] }) {
  const t = useTranslations("statistics.beyondPay");
  return (
    <ChartCard
      title={t("charts.satisfactionDistribution.title")}
      description={t("charts.satisfactionDistribution.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.every((d) => d.count === 0)}
      emptyMessage={t("charts.satisfactionDistribution.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="score" tick={AXIS_TICK} stroke="currentColor" axisLine={false} />
          <YAxis tick={AXIS_TICK} stroke="currentColor" axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                formatLabel={(l) => scoreLabel(l as number)}
                nameFor={() => t("axis.entries")}
              />
            }
          />
          <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 2 — Satisfaction vs pay (median pay line + count bars)
export function SatisfactionVsPayChart({
  data,
  loading,
  caption,
  formatMoney,
}: BaseChartProps & {
  readonly data: SatisfactionVsPay[];
  readonly formatMoney: (n: number) => string;
}) {
  const t = useTranslations("statistics.beyondPay");
  return (
    <ChartCard
      title={t("charts.satisfactionVsPay.title")}
      description={t("charts.satisfactionVsPay.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.satisfactionVsPay.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="score" tick={AXIS_TICK} stroke="currentColor" axisLine={false} />
          <YAxis
            yAxisId="pay"
            tick={AXIS_TICK}
            stroke="currentColor"
            axisLine={false}
            width={72}
            tickFormatter={(v) => formatMoney(v)}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tick={AXIS_TICK}
            stroke="currentColor"
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                formatLabel={(l) => scoreLabel(l as number)}
                nameFor={(k) => (k === "medianSalary" ? t("axis.medianPay") : t("axis.entries"))}
                formatValue={(v, k) => (k === "medianSalary" ? formatMoney(v) : String(v))}
              />
            }
          />
          <Bar yAxisId="count" dataKey="count" fill={ACCENT_MUTED} radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="pay"
            type="monotone"
            dataKey="medianSalary"
            stroke={ACCENT}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 3 — Happiest sectors (horizontal bars, 0–10)
export function HappiestSectorsChart({
  data,
  loading,
  caption,
}: BaseChartProps & { readonly data: SectorSatisfaction[] }) {
  const t = useTranslations("statistics.beyondPay");
  return (
    <ChartCard
      title={t("charts.happiestSectors.title")}
      description={t("charts.happiestSectors.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.happiestSectors.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis type="number" domain={[0, 10]} tick={AXIS_TICK} stroke="currentColor" axisLine={false} />
          <YAxis
            type="category"
            dataKey="sector"
            tick={AXIS_TICK}
            stroke="currentColor"
            axisLine={false}
            width={120}
          />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                nameFor={(k) => (k === "avgSatisfaction" ? t("axis.avgSatisfaction") : t("axis.entries"))}
                formatValue={(v, k) => (k === "avgSatisfaction" ? scoreLabel(v) : String(v))}
                extraKeys={["count"]}
              />
            }
          />
          <Bar dataKey="avgSatisfaction" fill={ACCENT} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 4 — Satisfaction by worker type
export function SatisfactionByWorkerTypeChart({
  data,
  loading,
  caption,
}: BaseChartProps & { readonly data: WorkerTypeSatisfaction[] }) {
  const t = useTranslations("statistics.beyondPay");
  const label = (k: string) => t(`workerType.${k}`);
  return (
    <ChartCard
      title={t("charts.satisfactionByWorkerType.title")}
      description={t("charts.satisfactionByWorkerType.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.satisfactionByWorkerType.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis
            dataKey="workerType"
            tick={AXIS_TICK}
            stroke="currentColor"
            axisLine={false}
            tickFormatter={(k) => label(k)}
            interval={0}
          />
          <YAxis domain={[0, 10]} tick={AXIS_TICK} stroke="currentColor" axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                formatLabel={(l) => label(l as string)}
                nameFor={(k) => (k === "avgSatisfaction" ? t("axis.avgSatisfaction") : t("axis.entries"))}
                formatValue={(v, k) => (k === "avgSatisfaction" ? scoreLabel(v) : String(v))}
                extraKeys={["count"]}
              />
            }
          />
          <Bar dataKey="avgSatisfaction" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={d.workerType} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 5 — Do perks make people happier? (grouped bars)
export function PerkSatisfactionChart({
  data,
  loading,
  caption,
}: BaseChartProps & { readonly data: PerkSatisfaction[] }) {
  const t = useTranslations("statistics.beyondPay");
  const label = (k: string) => t(`perk.${k}`);
  return (
    <ChartCard
      title={t("charts.perkSatisfaction.title")}
      description={t("charts.perkSatisfaction.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.perkSatisfaction.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis
            dataKey="perk"
            tick={AXIS_TICK}
            stroke="currentColor"
            axisLine={false}
            tickFormatter={(k) => label(k)}
            interval={0}
          />
          <YAxis domain={[0, 10]} tick={AXIS_TICK} stroke="currentColor" axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                formatLabel={(l) => label(l as string)}
                nameFor={(k) => t(`perk.${k === "withPerk" ? "with" : "without"}`)}
                formatValue={(v) => scoreLabel(v)}
              />
            }
          />
          <Bar dataKey="withPerk" fill={ACCENT} radius={[6, 6, 0, 0]} />
          <Bar dataKey="withoutPerk" fill={ACCENT_MUTED} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 6 — Commute time vs satisfaction
export function CommuteSatisfactionChart({
  data,
  loading,
  caption,
}: BaseChartProps & { readonly data: CommuteSatisfaction[] }) {
  const t = useTranslations("statistics.beyondPay");
  return (
    <ChartCard
      title={t("charts.commuteSatisfaction.title")}
      description={t("charts.commuteSatisfaction.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.commuteSatisfaction.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="band" tick={AXIS_TICK} stroke="currentColor" axisLine={false} interval={0} />
          <YAxis domain={[0, 10]} tick={AXIS_TICK} stroke="currentColor" axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                nameFor={(k) => (k === "avgSatisfaction" ? t("axis.avgSatisfaction") : t("axis.entries"))}
                formatValue={(v, k) => (k === "avgSatisfaction" ? scoreLabel(v) : String(v))}
                extraKeys={["count"]}
              />
            }
          />
          <Bar dataKey="avgSatisfaction" fill={ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
