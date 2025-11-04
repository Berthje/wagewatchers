"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { CustomTooltip } from "./custom-tooltip";

interface SalaryRangeData {
    range: string;
    count: number;
}

interface SalaryDistributionChartProps {
    readonly data: SalaryRangeData[];
    readonly loading?: boolean;
}

const COLORS = {
    gradient: [
        "#ea580c", // orange-600
        "#fb923c", // orange-400
        "#fdba74", // orange-300
        "#fed7aa", // orange-200
        "#ffedd5", // orange-100
        "#fff7ed", // orange-50
    ],
};

export function SalaryDistributionChart({ data, loading = false }: SalaryDistributionChartProps) {
    const t = useTranslations("statistics");

    if (loading) {
        return (
            <Card className="bg-stone-800 border-stone-700 space-y-3">
                <CardHeader>
                    <CardTitle className="text-stone-100">
                        {t("charts.salaryDistribution.title")}
                    </CardTitle>
                    <CardDescription className="text-stone-400">
                        {t("charts.salaryDistribution.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
                        <div className="relative h-full">
                            {/* Horizontal grid lines */}
                            {[0, 1, 2, 3].map((i) => (
                                <div key={`salary-dist-grid-${i}`} className="absolute w-full h-px bg-stone-700" style={{ top: `${20 + i * 20}%` }}></div>
                            ))}
                            {/* Vertical bars */}
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={`salary-dist-bar-${i}`} className="absolute bottom-8 w-6 bg-stone-600 rounded-t animate-pulse"
                                    style={{
                                        left: `${8 + i * 12}%`,
                                        height: `${20 + Math.random() * 50}%`,
                                        animationDelay: `${i * 0.1}s`
                                    }}>
                                </div>
                            ))}
                            {/* X-axis labels */}
                            <div className="absolute bottom-0 left-4 right-4 flex justify-between">
                                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={`salary-dist-label-${i}`} className="h-3 bg-stone-700 rounded animate-pulse w-8 md:w-10"></div>
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
                    {t("charts.salaryDistribution.title")}
                </CardTitle>
                <CardDescription className="text-stone-400">
                    {t("charts.salaryDistribution.description")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full h-64 md:h-96">
                    <ResponsiveContainer
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
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#44403c"
                            />
                            <XAxis
                                dataKey="range"
                                stroke="#78716c"
                                axisLine={false}
                            />
                            <YAxis stroke="#78716c" axisLine={false} tickCount={5} />
                            <Tooltip
                                content={<CustomTooltip colors={COLORS.gradient.toReversed()} data={data} />}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                            />
                            <Bar
                                dataKey="count"
                                radius={[8, 8, 0, 0]}
                            >
                                {data.map(
                                    (entry, index) => (
                                        <Cell
                                            key={entry.range}
                                            fill={
                                                COLORS.gradient.toReversed()[
                                                index %
                                                COLORS
                                                    .gradient
                                                    .length
                                                ]
                                            }
                                        />
                                    )
                                )}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}