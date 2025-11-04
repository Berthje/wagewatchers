"use client";

import {
    PieChart,
    Pie,
    Cell,
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
import { CustomTooltip } from "./custom-tooltip";

interface AgeData {
    ageGroup: string;
    count: number;
    [key: string]: string | number;
}

interface AgeDemographicsChartProps {
    readonly data: AgeData[];
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

export function AgeDemographicsChart({ data, loading = false }: AgeDemographicsChartProps) {
    const t = useTranslations("statistics");

    if (loading) {
        return (
            <Card className="bg-stone-800 border-stone-700 space-y-3">
                <CardHeader>
                    <CardTitle className="text-stone-100">
                        {t("charts.ageDemographics.title")}
                    </CardTitle>
                    <CardDescription className="text-stone-400">
                        {t("charts.ageDemographics.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-64 md:h-96 bg-stone-800 rounded p-4 flex items-center justify-center">
                        <div className="relative">
                            {/* Pie chart skeleton */}
                            <div className="w-48 h-48 rounded-full bg-stone-700 animate-pulse relative">
                                {/* Pie segments */}
                                <div className="absolute inset-2 rounded-full bg-stone-800">
                                    <div className="absolute top-2 left-2 w-8 h-8 bg-stone-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="absolute top-8 right-4 w-6 h-6 bg-stone-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="absolute bottom-6 left-6 w-10 h-10 bg-stone-600 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                                    <div className="absolute bottom-4 right-8 w-7 h-7 bg-stone-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="absolute -right-20 top-8 space-y-2">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={`age-legend-${i}`} className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-stone-600 rounded animate-pulse"></div>
                                        <div className="h-3 bg-stone-700 rounded animate-pulse w-10 md:w-12"></div>
                                    </div>
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
                    {t("charts.ageDemographics.title")}
                </CardTitle>
                <CardDescription className="text-stone-400">
                    {t("charts.ageDemographics.description")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full h-64 md:h-96 flex items-center justify-center">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) =>
                                    `${entry.ageGroup}`
                                }
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={entry.ageGroup}
                                        fill={
                                            COLORS.gradient[
                                            index %
                                            COLORS
                                                .gradient
                                                .length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                content={<CustomTooltip chartType="age-demographics" total={data.reduce((sum, d) => sum + d.count, 0)} colors={COLORS.gradient} data={data} />}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}