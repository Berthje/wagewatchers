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
import {
    useSalaryDisplay,
    formatSalaryWithPreferences,
} from "@/contexts/salary-display-context";
import { CustomTooltip } from "./custom-tooltip";

interface LocationHeatmapData {
    city: string;
    country: string;
    avgSalary: number;
    count: number;
    lat?: number;
    lng?: number;
}

interface LocationHeatmapChartProps {
    readonly data: LocationHeatmapData[];
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

export function LocationHeatmapChart({
    data,
    loading = false,
}: LocationHeatmapChartProps) {
    const t = useTranslations("statistics");
    const { preferences } = useSalaryDisplay();

    if (loading) {
        return (
            <Card className="bg-stone-800 border-stone-700 space-y-3">
                <CardHeader>
                    <CardTitle className="text-stone-100">
                        {t("charts.locationHeatmap.title")}
                    </CardTitle>
                    <CardDescription className="text-stone-400">
                        {t("charts.locationHeatmap.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4">
                        {/* Chart area with grid lines */}
                        <div className="relative h-full">
                            {/* Horizontal grid lines */}
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                    key={`heatmap-grid-h-${i}`}
                                    className="absolute w-full h-px bg-stone-700"
                                    style={{ top: `${20 + i * 15}%` }}
                                ></div>
                            ))}
                            {/* Vertical bars */}
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div
                                    key={`heatmap-bar-${i}`}
                                    className="absolute bottom-8 w-8 bg-stone-600 rounded-t animate-pulse"
                                    style={{
                                        left: `${10 + i * 10}%`,
                                        height: `${30 + Math.random() * 40}%`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                ></div>
                            ))}
                            {/* Y-axis labels (city names) */}
                            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={`heatmap-city-${i}`}
                                        className="h-4 bg-stone-700 rounded animate-pulse w-12 md:w-16"
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return null;
    }

    return (
        <Card className="bg-stone-800 border-stone-700 space-y-3">
            <CardHeader>
                <CardTitle className="text-stone-100">
                    {t("charts.locationHeatmap.title")}
                </CardTitle>
                <CardDescription className="text-stone-400">
                    {t("charts.locationHeatmap.description")}
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
                            layout="vertical"
                            margin={{
                                top: 15,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#44403c"
                            />
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
                            <YAxis
                                dataKey="city"
                                type="category"
                                stroke="#78716c"
                                width={110}
                            />
                            <Tooltip
                                content={<CustomTooltip chartType="location" colors={COLORS.gradient} data={data} />}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                labelFormatter={(label: string) => {
                                    const location = data.find(
                                        (l) => l.city === label
                                    );
                                    return location
                                        ? `${location.city} (${location.count} entries)`
                                        : label;
                                }}
                            />
                            <Bar dataKey="avgSalary" radius={[0, 8, 8, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={entry.city}
                                        fill={
                                            COLORS.gradient[
                                            index % COLORS.gradient.length
                                            ]
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
