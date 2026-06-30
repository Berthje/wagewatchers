"use client";

import {
  ScatterChart,
  Scatter,
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

interface TaxRateData {
  grossSalary: number;
  taxPercentage: number;
  country: string;
  sector: string;
}

interface TaxRateAnalysisChartProps {
  readonly data: TaxRateData[];
  readonly loading?: boolean;
}

export function TaxRateAnalysisChart({ data, loading = false }: TaxRateAnalysisChartProps) {
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();

  if (loading) {
    return (
      <Card className="border-border bg-card space-y-3">
        <CardHeader>
          <CardTitle className="text-foreground">{t("charts.taxRateAnalysis.title")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("charts.taxRateAnalysis.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-96 bg-muted rounded p-4">
            <div className="relative h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`tax-grid-h-${i}`}
                  className="absolute w-full h-px bg-muted"
                  style={{ top: `${20 + i * 15}%` }}
                ></div>
              ))}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`tax-grid-v-${i}`}
                  className="absolute h-full w-px bg-muted"
                  style={{ left: `${15 + i * 14}%` }}
                ></div>
              ))}
              {/* Scatter points */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((i) => (
                <div
                  key={`tax-point-${i}`}
                  className="absolute w-2 h-2 bg-muted rounded-full animate-pulse"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    animationDelay: `${Math.random() * 2}s`,
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
        <CardTitle className="text-foreground">{t("charts.taxRateAnalysis.title")}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("charts.taxRateAnalysis.description")}
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
            <ScatterChart
              data={data}
              margin={{
                top: 15,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
              <XAxis
                type="number"
                dataKey="grossSalary"
                name="grossSalary"
                stroke="currentColor"
                tick={{ fill: "currentColor" }}
                axisLine={false}
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
              <YAxis
                type="number"
                dataKey="taxPercentage"
                name="taxPercentage"
                stroke="currentColor"
                tick={{ fill: "currentColor" }}
                axisLine={false}
                domain={[0, 50]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={<CustomTooltip chartType="default" />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter name="entries" dataKey="taxPercentage" fill="#ea580c" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
