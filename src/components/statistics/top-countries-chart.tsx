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
import { useSalaryDisplay, formatSalaryWithPreferences } from "@/contexts/salary-display-context";
import { CustomTooltip } from "./custom-tooltip";

interface CountryData {
  country: string;
  avgSalary: number;
  count: number;
}

interface TopCountriesChartProps {
  readonly data: CountryData[];
  readonly loading?: boolean;
}

export function TopCountriesChart({ data, loading = false }: TopCountriesChartProps) {
  const t = useTranslations("statistics");
  const { preferences } = useSalaryDisplay();

  // Custom label renderer: place label inside the bar when there's enough width,
  // otherwise place it to the right of the bar. Truncates long names.
  const renderBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const raw = String(value || "");
    const maxLen = 20; // Shorter for countries since they're horizontal
    const truncated = raw.length > maxLen ? raw.slice(0, maxLen - 3) + "..." : raw;

    // If bar width is large enough, draw inside with white text; else draw outside with dark text
    const inside = (width || 0) > 60;
    const tx = inside ? x + (width || 0) / 2 : x + (width || 0) + 8; // Center when inside
    const fill = inside ? "#ffffff" : "#374151"; // white vs slate-700

    return (
      <text
        x={tx}
        y={y + (height || 0) / 2}
        fill={fill}
        dominantBaseline="middle"
        textAnchor={inside ? "middle" : "start"}
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
          <CardTitle className="text-stone-100">{t("charts.topCountries.title")}</CardTitle>
          <CardDescription className="text-stone-400">
            {t("charts.topCountries.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
            <div className="relative h-full">
              {/* Horizontal grid lines */}
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`countries-grid-${i}`}
                  className="absolute w-full h-px bg-stone-700"
                  style={{ top: `${20 + i * 20}%` }}
                ></div>
              ))}
              {/* Vertical bars */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`countries-bar-${i}`}
                  className="absolute bottom-8 w-6 md:w-8 bg-stone-600 rounded-t animate-pulse"
                  style={{
                    left: `${15 + i * 12}%`,
                    height: `${25 + Math.random() * 45}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                ></div>
              ))}
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-8 right-8 flex justify-between">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={`countries-label-${i}`}
                    className="h-3 bg-stone-700 rounded animate-pulse w-6 md:w-8"
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
        <CardTitle className="text-stone-100">{t("charts.topCountries.title")}</CardTitle>
        <CardDescription className="text-stone-400">
          {t("charts.topCountries.description")}
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
            <BarChart
              data={data}
              margin={{
                top: 15,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
              {/* hide X axis ticks/labels, country names are rendered inside the bars */}
              <XAxis dataKey="country" tick={false} axisLine={false} height={0} />
              <YAxis
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
                content={<CustomTooltip chartType="country" />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Bar dataKey="avgSalary" fill="#fb923c" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="country" content={renderBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
