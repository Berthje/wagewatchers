"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import type {
  WorkerTypeStat,
  ContractTypeStat,
  FixedVariablePay,
  FuelMix,
  EquityAdoption,
} from "@/types";
import { ChartCard } from "./chart-card";
import { BeyondPayTooltip } from "./beyond-pay-tooltip";
import { ACCENT, ACCENT_MUTED, PALETTE, AXIS_TICK } from "./palette";

interface BaseChartProps {
  readonly loading?: boolean;
  readonly caption?: string;
}
type WithMoney = { readonly formatMoney: (n: number) => string };

// 7 — Worker-type mix (donut, share + median pay in tooltip)
export function WorkerTypeMixChart({
  data,
  loading,
  caption,
  formatMoney,
}: BaseChartProps & WithMoney & { readonly data: WorkerTypeStat[] }) {
  const t = useTranslations("statistics.beyondPay");
  const label = (k: string) => t(`workerType.${k}`);
  return (
    <ChartCard
      title={t("charts.workerTypeMix.title")}
      description={t("charts.workerTypeMix.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.workerTypeMix.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="workerType"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            labelLine={false}
            label={(e: any) => label(e.workerType)}
          >
            {data.map((d, i) => (
              <Cell key={d.workerType} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            content={
              <BeyondPayTooltip
                formatLabel={(l) => label(l as string)}
                nameFor={(k) => (k === "medianSalary" ? t("axis.medianPay") : t("axis.entries"))}
                formatValue={(v, k) => (k === "medianSalary" ? formatMoney(v) : String(v))}
                extraKeys={["medianSalary"]}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 8 — Contract types (count bars + median pay in tooltip)
export function ContractTypeChart({
  data,
  loading,
  caption,
  formatMoney,
}: BaseChartProps & WithMoney & { readonly data: ContractTypeStat[] }) {
  const t = useTranslations("statistics.beyondPay");
  const label = (k: string) => t(`contractType.${k}`);
  return (
    <ChartCard
      title={t("charts.contractType.title")}
      description={t("charts.contractType.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.contractType.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis
            dataKey="contractType"
            tick={AXIS_TICK}
            stroke="currentColor"
            axisLine={false}
            tickFormatter={(k) => label(k)}
            interval={0}
          />
          <YAxis tick={AXIS_TICK} stroke="currentColor" axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                formatLabel={(l) => label(l as string)}
                nameFor={(k) => (k === "medianSalary" ? t("axis.medianPay") : t("axis.entries"))}
                formatValue={(v, k) => (k === "medianSalary" ? formatMoney(v) : String(v))}
                extraKeys={["medianSalary"]}
              />
            }
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={d.contractType} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 9 — Fixed vs variable pay (stacked)
export function FixedVsVariableChart({
  data,
  loading,
  caption,
  formatMoney,
}: BaseChartProps & WithMoney & { readonly data: FixedVariablePay[] }) {
  const t = useTranslations("statistics.beyondPay");
  return (
    <ChartCard
      title={t("charts.fixedVsVariable.title")}
      description={t("charts.fixedVsVariable.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.fixedVsVariable.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10 }} barSize={90}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="label" tick={false} axisLine={false} height={1} />
          <YAxis
            tick={AXIS_TICK}
            stroke="currentColor"
            axisLine={false}
            width={72}
            tickFormatter={(v) => formatMoney(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(234,88,12,0.08)" }}
            content={
              <BeyondPayTooltip
                formatLabel={() => t("charts.fixedVsVariable.title")}
                nameFor={(k) => (k === "avgFixed" ? t("axis.avgFixed") : t("axis.avgVariable"))}
                formatValue={(v) => formatMoney(v)}
              />
            }
          />
          <Bar dataKey="avgFixed" stackId="pay" fill={ACCENT} />
          <Bar dataKey="avgVariable" stackId="pay" fill={ACCENT_MUTED} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 10 — Company-car fuel mix (donut)
export function CompanyCarFuelChart({
  data,
  loading,
  caption,
}: BaseChartProps & { readonly data: FuelMix[] }) {
  const t = useTranslations("statistics.beyondPay");
  const label = (k: string) => t(`fuelType.${k}`);
  return (
    <ChartCard
      title={t("charts.companyCarFuel.title")}
      description={t("charts.companyCarFuel.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.length === 0}
      emptyMessage={t("charts.companyCarFuel.description")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="fuelType"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            labelLine={false}
            label={(e: any) => label(e.fuelType)}
          >
            {data.map((d, i) => (
              <Cell key={d.fuelType} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            content={
              <BeyondPayTooltip
                formatLabel={(l) => label(l as string)}
                nameFor={() => t("axis.entries")}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 11 — Equity adoption (headline stat + per-worker-type breakdown)
export function EquityAdoptionChart({
  data,
  loading,
  caption,
}: BaseChartProps & { readonly data: EquityAdoption }) {
  const t = useTranslations("statistics.beyondPay");
  const label = (k: string) => t(`workerType.${k}`);
  return (
    <ChartCard
      title={t("charts.equityAdoption.title")}
      description={t("charts.equityAdoption.description")}
      caption={caption}
      loading={loading}
      isEmpty={!loading && data.total === 0}
      emptyMessage={t("charts.equityAdoption.description")}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-mono font-bold text-foreground">
            {Math.round(data.withEquityPct)}%
          </span>
          <span className="text-sm text-muted-foreground">{t("equity.haveEquity")}</span>
        </div>
        <span className="text-xs text-muted-foreground mb-2">
          {t("equity.ofEntries", { total: data.total })}
        </span>
        {data.byWorkerType.length > 0 ? (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byWorkerType}
                layout="vertical"
                margin={{ top: 4, left: 8, right: 32 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={AXIS_TICK}
                  stroke="currentColor"
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="workerType"
                  tick={AXIS_TICK}
                  stroke="currentColor"
                  axisLine={false}
                  width={110}
                  tickFormatter={(k) => label(k)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(234,88,12,0.08)" }}
                  content={
                    <BeyondPayTooltip
                      formatLabel={(l) => label(l as string)}
                      nameFor={(k) => (k === "pct" ? t("axis.adoption") : t("axis.entries"))}
                      formatValue={(v, k) => (k === "pct" ? `${v}%` : String(v))}
                      extraKeys={["count"]}
                    />
                  }
                />
                <Bar dataKey="pct" fill={ACCENT} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </ChartCard>
  );
}
