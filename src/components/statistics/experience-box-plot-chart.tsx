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

  if (loading) {
    return (
      <Card className="bg-stone-800 border-stone-700 space-y-3">
        <CardHeader>
          <CardTitle className="text-stone-100">{t("charts.experienceBoxPlot.title")}</CardTitle>
          <CardDescription className="text-stone-400">
            {t("charts.experienceBoxPlot.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
            <div className="relative h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`box-grid-h-${i}`}
                  className="absolute w-full h-px bg-stone-700"
                  style={{ top: `${20 + i * 15}%` }}
                ></div>
              ))}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`box-grid-v-${i}`}
                  className="absolute h-full w-px bg-stone-700"
                  style={{ left: `${15 + i * 14}%` }}
                ></div>
              ))}
              {/* Box plot placeholders */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`box-placeholder-${i}`}
                  className="absolute bottom-8 w-6 bg-stone-600 rounded"
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
    <Card className="bg-stone-800 border-stone-700 space-y-3">
      <CardHeader>
        <CardTitle className="text-stone-100">{t("charts.experienceBoxPlot.title")}</CardTitle>
        <CardDescription className="text-stone-400">
          {t("charts.experienceBoxPlot.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64 md:h-96">
          <ResponsiveContainer
            key={`${preferences.currency}-${preferences.period}`}
            width="100%"
            height="100%"
            minWidth={undefined}
          >
            <ComposedChart
              data={data}
              margin={{
                top: 15,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
              <XAxis
                dataKey="experience"
                stroke="#78716c"
                axisLine={false}
              />
              <YAxis
                stroke="#78716c"
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

              {/* Min to Q1 range (bottom whisker) */}
              <Bar dataKey="min" stackId="a" fill="transparent" />

              {/* Q1 to Median range */}
              <Bar dataKey="q1" stackId="a" fill="#fed7aa80" />

              {/* Median to Q3 range */}
              <Bar dataKey="median" stackId="a" fill="#fb923c60" />

              {/* Q3 to Max range (top whisker) */}
              <Bar dataKey="q3" stackId="a" fill="#fed7aa80" />

              {/* Median line */}
              <Line
                type="monotone"
                dataKey="median"
                stroke="#ea580c"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
