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

interface ExperienceData {
    experience: number;
    avgSalary: number;
    count: number;
}

interface ExperienceGrowthChartProps {
    readonly data: ExperienceData[];
    readonly loading?: boolean;
}

export function ExperienceGrowthChart({
    data,
    loading = false,
}: ExperienceGrowthChartProps) {
    const t = useTranslations("statistics");
    const { preferences } = useSalaryDisplay();

    if (loading) {
        return (
            <Card className="bg-stone-800 border-stone-700 space-y-3">
                <CardHeader>
                    <CardTitle className="text-stone-100">
                        {t("charts.experienceGrowth.title")}
                    </CardTitle>
                    <CardDescription className="text-stone-400">
                        {t("charts.experienceGrowth.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
                        <div className="relative h-full">
                            {/* Grid lines */}
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={`exp-grid-h-${i}`}
                                    className="absolute w-full h-px bg-stone-700"
                                    style={{ top: `${20 + i * 20}%` }}
                                ></div>
                            ))}
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={`exp-grid-v-${i}`}
                                    className="absolute h-full w-px bg-stone-700"
                                    style={{ left: `${15 + i * 14}%` }}
                                ></div>
                            ))}
                            {/* Area fill */}
                            <div className="absolute bottom-8 left-4 right-4 h-32 bg-linear-to-t from-stone-600/50 to-transparent rounded-t animate-pulse"></div>
                            {/* Wavy line */}
                            <svg
                                className="absolute bottom-8 left-4 right-4 h-32"
                                viewBox="0 0 350 80"
                            >
                                <path
                                    d="M0,60 Q25,30 50,50 T100,40 T150,25 T200,35 T250,45 T300,30 T350,40"
                                    stroke="rgb(120 113 108)"
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
                <CardTitle className="text-stone-100">
                    {t("charts.experienceGrowth.title")}
                </CardTitle>
                <CardDescription className="text-stone-400">
                    {t("charts.experienceGrowth.description")}
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
                        <AreaChart
                            data={data}
                            margin={{
                                top: 15,
                            }}
                        >
                            <defs>
                                <linearGradient
                                    id="salaryGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#ea580c"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#ea580c"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#44403c"
                            />
                            <XAxis
                                dataKey="experience"
                                stroke="#78716c"
                                axisLine={false}
                                label={{
                                    value: t(
                                        "charts.experienceGrowth.xAxisLabel"
                                    ),
                                    position: "insideBottom",
                                    offset: -5,
                                    fill: "#78716c",
                                }}
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
                            <Tooltip
                                formatter={(value: any) => [
                                    formatSalaryWithPreferences(
                                        value,
                                        "EUR",
                                        false,
                                        preferences.currency,
                                        preferences.period
                                    ),
                                    t("charts.tooltips.avgSalary"),
                                ]}
                                contentStyle={{
                                    backgroundColor: "#292524",
                                    border: "1px solid #44403c",
                                    borderRadius: "8px",
                                }}
                                itemStyle={{ color: "#f5f5f4" }}
                                labelStyle={{
                                    color: "#f5f5f4",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="avgSalary"
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
