"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
    useSalaryDisplay,
    formatSalaryWithPreferences,
} from "@/contexts/salary-display-context";
import { CustomTooltip } from "./custom-tooltip";

interface YearlyData {
    year: number;
    avgSalary: number;
    count: number;
    medianSalary: number;
}

interface YearOverYearChartProps {
    readonly data: YearlyData[];
    readonly loading?: boolean;
}

export function YearOverYearChart({
    data,
    loading = false,
}: YearOverYearChartProps) {
    const t = useTranslations("statistics");
    const { preferences } = useSalaryDisplay();

    if (loading) {
        return (
            <Card className="bg-stone-800 border-stone-700 space-y-3">
                <CardHeader>
                    <CardTitle className="text-stone-100">
                        {t("charts.yearOverYear.title")}
                    </CardTitle>
                    <CardDescription className="text-stone-400">
                        {t("charts.yearOverYear.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
                        {/* Chart area with grid lines */}
                        <div className="relative h-full">
                            {/* Horizontal grid lines */}
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                    key={`yoy-grid-h-${i}`}
                                    className="absolute w-full h-px bg-stone-700"
                                    style={{ top: `${20 + i * 15}%` }}
                                ></div>
                            ))}
                            {/* Vertical grid lines */}
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={`yoy-grid-v-${i}`}
                                    className="absolute h-full w-px bg-stone-700"
                                    style={{ left: `${15 + i * 14}%` }}
                                ></div>
                            ))}
                            {/* Animated lines */}
                            <div className="absolute bottom-8 left-4 right-4 h-32">
                                <svg
                                    className="w-full h-full"
                                    viewBox="0 0 300 80"
                                >
                                    <path
                                        d="M0,60 Q50,40 100,50 T200,35 T300,45"
                                        stroke="rgb(234 88 12)"
                                        strokeWidth="3"
                                        fill="none"
                                        className="animate-pulse"
                                    />
                                    <path
                                        d="M0,50 Q50,30 100,40 T200,25 T300,35"
                                        stroke="rgb(251 146 60)"
                                        strokeWidth="3"
                                        strokeDasharray="5 5"
                                        fill="none"
                                        className="animate-pulse"
                                        style={{ animationDelay: "0.2s" }}
                                    />
                                </svg>
                            </div>
                            {/* X-axis labels */}
                            <div className="absolute bottom-0 left-4 right-4 flex justify-between">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={`yoy-x-label-${i}`}
                                        className="h-3 bg-stone-700 rounded animate-pulse w-6 md:w-8"
                                    ></div>
                                ))}
                            </div>
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={`yoy-y-label-${i}`}
                                        className="h-3 bg-stone-700 rounded animate-pulse w-8 md:w-10"
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (data.length <= 1) {
        return null;
    }

    return (
        <Card className="bg-stone-800 border-stone-700 space-y-3">
            <CardHeader>
                <CardTitle className="text-stone-100">
                    {t("charts.yearOverYear.title")}
                </CardTitle>
                <CardDescription className="text-stone-400">
                    {t("charts.yearOverYear.description")}
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
                        <LineChart
                            data={data}
                            margin={{
                                top: 15,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#44403c"
                            />
                            <XAxis dataKey="year" stroke="#78716c" axisLine={false} />
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
                                content={<CustomTooltip chartType="year" />}
                                cursor={{ strokeDasharray: '5 5' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="avgSalary"
                                stroke="#ea580c"
                                strokeWidth={3}
                                name={t("charts.tooltips.avgSalary")}
                            />
                            <Line
                                type="monotone"
                                dataKey="medianSalary"
                                stroke="#fb923c"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                name={t("charts.tooltips.medianSalary")}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
