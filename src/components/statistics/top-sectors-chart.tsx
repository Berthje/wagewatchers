"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import React from "react";
import { useSalaryDisplay, formatSalaryWithPreferences } from "@/contexts/salary-display-context";
import { CustomTooltip } from "./custom-tooltip";

interface SectorData {
  sector: string;
  count: number;
  avgGross: number;
  totalGross: number;
}

interface TopSectorsChartProps {
  readonly data: SectorData[];
  readonly loading?: boolean;
}

export function TopSectorsChart({ data, loading = false }: TopSectorsChartProps) {
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();
  const renderBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const raw = String(value || "");
    const maxLen = 36;
    const truncated = raw.length > maxLen ? raw.slice(0, maxLen - 3) + "..." : raw;
    const inside = (width || 0) > 80;
    const tx = inside ? x + 24 : x + (width || 0) + 8; // More left margin when inside
    const fill = inside ? "#ffffff" : "#374151"; // white vs slate-700
    return (
      <text
        x={tx}
        y={y + (height || 0) / 2}
        fill={fill}
        dominantBaseline="middle"
        fontSize={16}
        fontWeight="bold"
      >
        {truncated}
      </text>
    );
  };

  if (loading) {
    return (
      <Card className="bg-stone-800 border-stone-700 space-y-3">
        <CardHeader>
          <CardTitle className="text-stone-100">{t("charts.topSectors.title")}</CardTitle>
          <CardDescription className="text-stone-400">
            {t("charts.topSectors.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
            {/* Chart area with grid lines */}
            <div className="relative h-full">
              {/* Horizontal grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`sectors-grid-${i}`}
                  className="absolute w-full h-px bg-stone-700"
                  style={{ top: `${20 + i * 15}%` }}
                ></div>
              ))}
              {/* Vertical bars */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={`sectors-bar-${i}`}
                  className="absolute bottom-8 w-8 bg-stone-600 rounded-t animate-pulse"
                  style={{
                    left: `${10 + i * 10}%`,
                    height: `${30 + Math.random() * 40}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                ></div>
              ))}
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={`sectors-label-${i}`}
                    className="h-4 bg-stone-700 rounded animate-pulse w-6 md:w-8"
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
        <CardTitle className="text-stone-100">{t("charts.topSectors.title")}</CardTitle>
        <CardDescription className="text-stone-400">
          {t("charts.topSectors.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-72 md:h-96">
          <ResponsiveContainer
            key={`${preferences.currency}-${preferences.period}`}
            width="100%"
            height="100%"
            minWidth={undefined}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 15,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />

              <XAxis
                type="number"
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

              {/* hide Y axis ticks/labels, sector names are rendered inside the bars */}
              <YAxis dataKey="sector" type="category" tick={false} axisLine={false} width={0} />

              <Tooltip
                content={<CustomTooltip chartType="sector" />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />

              <Bar dataKey="avgGross" fill="#ea580c" radius={[0, 8, 8, 0]}>
                <LabelList dataKey="sector" content={renderBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
