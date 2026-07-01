"use client";

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useSalaryDisplay, formatSalaryWithPreferences } from "@/contexts/salary-display-context";
import { CustomTooltip } from "./custom-tooltip";

interface ExperienceBoxPlotData {
  experience: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
  salaries: number[];
}

interface ExperienceBoxPlotChartProps {
  readonly data: ExperienceBoxPlotData[];
  readonly loading?: boolean;
}

export function ExperienceBoxPlotChart({ data, loading = false }: ExperienceBoxPlotChartProps) {
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();

  // Recharts stacks bar values by summing them, so each segment must be the DELTA
  // between consecutive quartiles — not the absolute quartile value. Stacking the
  // absolute min/q1/median/q3 (the previous bug) produced bars ~3–4× too tall that
  // never aligned with the absolute median line. Absolute stats are preserved on the
  // datum for the tooltip and the median line.
  const chartData = data.map((d) => ({
    ...d,
    _base: d.min,
    _whiskerLow: Math.max(d.q1 - d.min, 0),
    _boxLow: Math.max(d.median - d.q1, 0),
    _boxHigh: Math.max(d.q3 - d.median, 0),
    _whiskerHigh: Math.max(d.max - d.q3, 0),
  }));

  if (loading) {
    return (
      <Card className="border-border bg-card space-y-3">
        <CardHeader>
          <CardTitle className="text-foreground">{t("charts.experienceBoxPlot.title")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("charts.experienceBoxPlot.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-96 bg-muted rounded p-4">
            <div className="relative h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`box-grid-h-${i}`}
                  className="absolute w-full h-px bg-muted"
                  style={{ top: `${20 + i * 15}%` }}
                ></div>
              ))}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`box-grid-v-${i}`}
                  className="absolute h-full w-px bg-muted"
                  style={{ left: `${15 + i * 14}%` }}
                ></div>
              ))}
              {/* Box plot placeholders */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`box-placeholder-${i}`}
                  className="absolute bottom-8 w-6 bg-muted rounded"
                  style={{
                    left: `${15 + i * 14}%`,
                    height: `${40 + Math.random() * 30}%`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card space-y-3">
      <CardHeader>
        <CardTitle className="text-foreground">{t("charts.experienceBoxPlot.title")}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("charts.experienceBoxPlot.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64 md:h-96 text-muted-foreground">
          <ResponsiveContainer
            key={`${preferences.currency}-${preferences.period}`}
            width="100%"
            height="100%"
            minWidth={undefined}
          >
            <ComposedChart
              data={chartData}
              margin={{
                top: 15,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
              <XAxis
                dataKey="experience"
                stroke="currentColor"
                tick={{ fill: "currentColor" }}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                tick={{ fill: "currentColor" }}
                tickFormatter={(value) =>
                  formatSalaryWithPreferences(
                    value,
                    "EUR",
                    false,
                    preferences.currency,
                    preferences.period
                  )
                }
              />
              <Tooltip content={<CustomTooltip chartType="experience" />} />

              {/* Stacked segments are DELTAS, not absolute values: each bar's height is the
                  gap to the next quartile, so the stack reconstructs a true box-and-whisker.
                  The transparent base lifts the box up to `min`. */}

              {/* Invisible base: 0 → min */}
              <Bar dataKey="_base" stackId="a" fill="transparent" />

              {/* Lower whisker: min → Q1 */}
              <Bar dataKey="_whiskerLow" stackId="a" fill="#fed7aa80" />

              {/* Box lower half: Q1 → median */}
              <Bar dataKey="_boxLow" stackId="a" fill="#fb923c60" />

              {/* Box upper half: median → Q3 */}
              <Bar dataKey="_boxHigh" stackId="a" fill="#fb923c60" />

              {/* Upper whisker: Q3 → max */}
              <Bar dataKey="_whiskerHigh" stackId="a" fill="#fed7aa80" />

              {/* Median line (absolute value — aligns with the Q1↔Q3 box boundary) */}
              <Line type="monotone" dataKey="median" stroke="#ea580c" strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
