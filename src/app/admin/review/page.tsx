"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface SalaryEntry {
    id: number;
    createdAt: string;
    country: string | null;
    sector: string | null;
    jobTitle: string | null;
    workExperience: number | null;
    age: number | null;
    grossSalary: number | null;
    currency: string | null;
    reviewStatus: string;
    anomalyScore: number | null;
    anomalyReason: string | null;
}

interface AnomalyStats {
    approved: number;
    pending: number;
    needsReview: number;
    rejected: number;
    total: number;
}

export default function ReviewPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<SalaryEntry[]>([]);
    const [stats, setStats] = useState<AnomalyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch pending entries
            const entriesRes = await fetch("/api/admin/review?status=all");
            if (!entriesRes.ok) {
                if (entriesRes.status === 401) {
                    router.push("/admin/login");
                    return;
                }
                throw new Error("Failed to fetch entries");
            }
            const entriesData = await entriesRes.json();
            setEntries(entriesData);

            // Fetch statistics
            const statsRes = await fetch("/api/admin/anomaly-stats");
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (
        entryId: number,
        action: "approve" | "reject"
    ) => {
        try {
            setProcessingId(entryId);

            const res = await fetch("/api/admin/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entryId, action }),
            });

            if (!res.ok) {
                throw new Error(`Failed to ${action} entry`);
            }

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error(`Failed to ${action} entry:`, error);
            alert(`Failed to ${action} entry. Please try again.`);
        } finally {
            setProcessingId(null);
        }
    };

    const getAnomalyBadge = (score: number | null) => {
        if (score === null) return null;

        if (score >= 70) {
            return <Badge variant="destructive">High Risk ({score})</Badge>;
        } else if (score >= 30) {
            return <Badge variant="secondary">Medium Risk ({score})</Badge>;
        } else {
            return <Badge variant="outline">Low Risk ({score})</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Entry Review Queue</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Admin Dashboard
                </Link>
                <h1 className="text-3xl font-bold mb-2">Entry Review Queue</h1>
                <p className="text-muted-foreground">
                    Review flagged entries and approve or reject them based on
                    anomaly detection analysis.
                </p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Entries
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">
                                Approved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats.approved}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-600">
                                Pending
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {stats.pending}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600">
                                Needs Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {stats.needsReview}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">
                                Rejected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats.rejected}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Entries List */}
            {entries.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <CheckCircle className="mx-auto h-12 w-12 mb-2" />
                            <p>No entries pending review. Great job!</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <Card key={entry.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2">
                                            {entry.jobTitle ||
                                                "Untitled Position"}
                                        </CardTitle>
                                        <CardDescription>
                                            Submitted:{" "}
                                            {new Date(
                                                entry.createdAt
                                            ).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        {getAnomalyBadge(entry.anomalyScore)}
                                        <Badge
                                            variant={
                                                entry.reviewStatus ===
                                                "NEEDS_REVIEW"
                                                    ? "destructive"
                                                    : "secondary"
                                            }
                                        >
                                            {entry.reviewStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Gross Salary
                                        </p>
                                        <p className="font-semibold text-lg">
                                            {formatCurrency(
                                                entry.grossSalary,
                                                entry.currency
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Country
                                        </p>
                                        <p className="font-semibold">
                                            {entry.country || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Sector
                                        </p>
                                        <p className="font-semibold">
                                            {entry.sector || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Experience
                                        </p>
                                        <p className="font-semibold">
                                            {entry.workExperience === null
                                                ? "N/A"
                                                : `${entry.workExperience} years`}
                                        </p>
                                    </div>
                                </div>

                                {entry.anomalyReason && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                                        <div className="flex gap-2">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-yellow-900 text-sm mb-1">
                                                    Anomaly Detection Reason
                                                </p>
                                                <p className="text-sm text-yellow-800">
                                                    {entry.anomalyReason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            handleAction(entry.id, "reject")
                                        }
                                        disabled={processingId === entry.id}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() =>
                                            handleAction(entry.id, "approve")
                                        }
                                        disabled={processingId === entry.id}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
