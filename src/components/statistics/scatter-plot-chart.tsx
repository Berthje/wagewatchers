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

interface ScatterData {
  id: number;
  experience: number;
  salary: number;
  age: number;
  sector: string;
  country: string;
}

interface ScatterPlotChartProps {
  readonly data: ScatterData[];
  readonly loading?: boolean;
  readonly onPointClick?: (data: any) => void;
}

export function ScatterPlotChart({ data, loading = false, onPointClick }: ScatterPlotChartProps) {
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();

  if (loading) {
    return (
      <Card className="bg-stone-800 border-stone-700 space-y-3">
        <CardHeader>
          <CardTitle className="text-stone-100">{t("charts.scatterPlot.title")}</CardTitle>
          <CardDescription className="text-stone-400">
            {t("charts.scatterPlot.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
            <div className="relative h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`scatter-grid-h-${i}`}
                  className="absolute w-full h-px bg-stone-700"
                  style={{ top: `${20 + i * 15}%` }}
                ></div>
              ))}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`scatter-grid-v-${i}`}
                  className="absolute h-full w-px bg-stone-700"
                  style={{ left: `${15 + i * 14}%` }}
                ></div>
              ))}
              {/* Scatter points */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((i) => (
                <div
                  key={`scatter-point-${i}`}
                  className="absolute w-2 h-2 bg-stone-500 rounded-full animate-pulse"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                ></div>
              ))}
              {/* Axis labels */}
              <div className="absolute bottom-2 left-4 right-4 flex justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={`scatter-x-label-${i}`}
                    className="h-3 bg-stone-700 rounded animate-pulse w-6 md:w-8"
                  ></div>
                ))}
              </div>
              <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={`scatter-y-label-${i}`}
                    className="h-3 bg-stone-700 rounded animate-pulse w-4 md:w-6"
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
    <Card className="bg-stone-800 border-stone-700 space-y-3">
      <CardHeader>
        <CardTitle className="text-stone-100">{t("charts.scatterPlot.title")}</CardTitle>
        <CardDescription className="text-stone-400">
          {t("charts.scatterPlot.description")}
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
            <ScatterChart
              data={data}
              margin={{
                top: 15,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
              <XAxis
                type="number"
                dataKey="experience"
                name="experience"
                stroke="#78716c"
                axisLine={false}
              />
              <YAxis
                type="number"
                dataKey="salary"
                name="salary"
                stroke="#78716c"
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
              <Tooltip
                content={<CustomTooltip chartType="scatter" />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter
                name="entries"
                dataKey="salary"
                fill="#ea580c"
                onClick={onPointClick}
                style={{ cursor: "pointer" }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
