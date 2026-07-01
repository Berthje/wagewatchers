"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useSalaryDisplay, formatSalaryWithPreferences } from "@/contexts/salary-display-context";
import { CustomTooltip } from "./custom-tooltip";

interface ExperienceData {
  experience: number;
  avgSalary: number;
  medianSalary: number;
  count: number;
}

interface ExperienceGrowthChartProps {
  readonly data: ExperienceData[];
  readonly loading?: boolean;
}

export function ExperienceGrowthChart({ data, loading = false }: ExperienceGrowthChartProps) {
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();

  if (loading) {
    return (
      <Card className="border-border bg-card space-y-3">
        <CardHeader>
          <CardTitle className="text-foreground">{t("charts.experienceGrowth.title")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("charts.experienceGrowth.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-96 bg-muted rounded p-4 text-muted-foreground">
            <div className="relative h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`exp-grid-h-${i}`}
                  className="absolute w-full h-px bg-muted"
                  style={{ top: `${20 + i * 20}%` }}
                ></div>
              ))}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`exp-grid-v-${i}`}
                  className="absolute h-full w-px bg-muted"
                  style={{ left: `${15 + i * 14}%` }}
                ></div>
              ))}
              {/* Area fill */}
              <div className="absolute bottom-8 left-4 right-4 h-32 bg-linear-to-t from-muted to-transparent rounded-t animate-pulse"></div>
              {/* Wavy line */}
              <svg className="absolute bottom-8 left-4 right-4 h-32" viewBox="0 0 350 80">
                <path
                  d="M0,60 Q25,30 50,50 T100,40 T150,25 T200,35 T250,45 T300,30 T350,40"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="animate-pulse"
                />
              </svg>
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-4 right-4 flex justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={`exp-x-label-${i}`}
                    className="h-3 bg-muted rounded animate-pulse w-4 md:w-6"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card space-y-3">
      <CardHeader>
        <CardTitle className="text-foreground">{t("charts.experienceGrowth.title")}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("charts.experienceGrowth.description")}
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
            <AreaChart
              data={data}
              margin={{
                top: 15,
              }}
            >
              <defs>
                <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1} />
                </linearGradient>
              </defs>
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
              <Tooltip
                content={<CustomTooltip chartType="experience" />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Area
                type="monotone"
                dataKey="medianSalary"
                stroke="#ea580c"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salaryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
