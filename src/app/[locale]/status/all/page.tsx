"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import {
    Bug,
    Lightbulb,
    TrendingUp,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Calendar,
    Clock,
} from "lucide-react";

interface Report {
    id: number;
    title: string;
    description: string;
    type: "BUG" | "FEATURE" | "IMPROVEMENT";
    status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    createdAt: string;
    updatedAt: string;
    trackingId: string;
    email?: string;
}

const STORAGE_KEY = "wagewatchers_tracking_ids";

const statusColors = {
    TODO: "bg-gray-800 text-gray-200",
    IN_PROGRESS: "bg-blue-900 text-blue-200",
    DONE: "bg-green-900 text-green-200",
    CANCELLED: "bg-red-900 text-red-200",
};

const priorityColors = {
    LOW: "bg-gray-800 text-gray-200",
    MEDIUM: "bg-yellow-900 text-yellow-200",
    HIGH: "bg-orange-900 text-orange-200",
    CRITICAL: "bg-red-900 text-red-200",
};

const typeIcons = {
    BUG: Bug,
    FEATURE: Lightbulb,
    IMPROVEMENT: TrendingUp,
};

export default function AllReportsPage() {
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations("status");
    const tNav = useTranslations("nav");

    const statusLabels = {
        TODO: t("statuses.TODO"),
        IN_PROGRESS: t("statuses.IN_PROGRESS"),
        DONE: t("statuses.DONE"),
        CANCELLED: t("statuses.CANCELLED"),
    };

    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAllReports = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            // Get stored tracking IDs
            const storedIds = localStorage.getItem(STORAGE_KEY);
            if (!storedIds) {
                setError(t("noResults"));
                setLoading(false);
                return;
            }

            const trackingIds = JSON.parse(storedIds) as string[];
            if (trackingIds.length === 0) {
                setError(t("noResults"));
                setLoading(false);
                return;
            }

            // Fetch all reports for the stored tracking IDs
            const fetchPromises = trackingIds.map((id) =>
                fetch(`/api/reports?trackingId=${encodeURIComponent(id)}`)
                    .then((res) => (res.ok ? res.json() : []))
                    .catch(() => [])
            );

            const results = await Promise.all(fetchPromises);
            const allReports = results.flat();

            if (allReports.length === 0) {
                setError(t("noResults"));
            } else {
                // Sort reports by createdAt descending (most recent first)
                const sortedReports = allReports.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
                setReports(sortedReports);
            }
        } catch {
            setError(t("errors.network"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadAllReports();
    }, [loadAllReports]);

    return (
        <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
            {/* Header */}
            <Navbar
                locale={locale}
                translations={{
                    dashboard: tNav("dashboard"),
                    statistics: tNav("statistics"),
                    feedback: tNav("feedback"),
                    status: tNav("status"),
                    donate: tNav("donate"),
                    addEntry: tNav("addEntry"),
                }}
            />

            <div className="container mx-auto p-6 max-w-6xl">
                {/* Back Button */}
                <div className="mb-6">
                    <Link href={`/${locale}/status`}>
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t("results.backToStatus", {
                                defaultValue: "Back to Status",
                            })}
                        </Button>
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-stone-100">
                        {t("results.allReportsTitle", {
                            defaultValue: "All Your Reports",
                        })}
                    </h1>
                    <p className="text-stone-400">
                        {t("results.allReportsSubtitle", {
                            defaultValue:
                                "Complete overview of all your submitted reports and their current status.",
                        })}
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                            <p className="text-lg text-stone-400">
                                {t("loading")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Alert className="border-red-800 bg-red-950/50">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-200">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Reports Grid */}
                {!loading && reports.length > 0 && (
                    <div>
                        <div className="mb-6">
                            <p className="text-stone-400">
                                {t("results.showingAll", {
                                    count: reports.length,
                                    defaultValue: `Showing all ${reports.length} reports`,
                                })}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {reports.map((report) => {
                                const TypeIcon = typeIcons[report.type];
                                return (
                                    <Card
                                        key={report.id}
                                        className="border-stone-800 bg-stone-900/60 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <TypeIcon className="w-5 h-5 text-stone-400 mt-1" />
                                                <div className="flex gap-1">
                                                    <Badge
                                                        className={
                                                            priorityColors[
                                                            report.priority
                                                            ]
                                                        }
                                                    >
                                                        {report.priority}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardTitle className="text-stone-100 text-lg leading-tight">
                                                {report.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <p className="text-stone-300 mb-4 text-sm leading-relaxed">
                                                {report.description}
                                            </p>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Badge
                                                        className={
                                                            statusColors[
                                                            report.status
                                                            ]
                                                        }
                                                    >
                                                        {
                                                            statusLabels[
                                                            report.status
                                                            ]
                                                        }
                                                    </Badge>
                                                </div>

                                                <div className="text-xs text-stone-400 space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {t(
                                                                "results.submittedOn"
                                                            )}{" "}
                                                            {new Date(
                                                                report.createdAt
                                                            ).toLocaleDateString()}{" "}
                                                            {new Date(
                                                                report.createdAt
                                                            ).toLocaleTimeString(
                                                                undefined,
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {t(
                                                                "results.lastUpdated"
                                                            )}{" "}
                                                            {new Date(
                                                                report.updatedAt
                                                            ).toLocaleDateString()}{" "}
                                                            {new Date(
                                                                report.updatedAt
                                                            ).toLocaleTimeString(
                                                                undefined,
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="font-mono text-stone-100 bg-stone-800 px-2 py-1 rounded text-xs">
                                                        {report.trackingId}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && reports.length === 0 && !error && (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-stone-100 mb-2">
                                {t("results.noReportsTitle")}
                            </h3>
                            <p className="text-stone-400 mb-4">
                                {t("results.noReportsMessage")}
                            </p>
                            <Link href={`/${locale}/status`}>
                                <Button>
                                    {t("results.backToStatus", {
                                        defaultValue: "Back to Status",
                                    })}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
