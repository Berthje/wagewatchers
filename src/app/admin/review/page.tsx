"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AdminHeader } from "@/components/admin-header";
import { AdminEntryDetailModal } from "@/components/admin-entry-detail-modal";
import type { SalaryEntry as FullSalaryEntry } from "@/lib/db/schema";

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
    const [entries, setEntries] = useState<SalaryEntry[]>([]);
    const [stats, setStats] = useState<AnomalyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
    const [detailEntry, setDetailEntry] = useState<FullSalaryEntry | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch pending entries
            const entriesRes = await fetch("/api/admin/review?status=all");
            if (!entriesRes.ok) {
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

    const handleAction = async (entryId: number, action: "approve" | "reject") => {
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

    const handleViewDetails = async (entryId: number) => {
        setSelectedEntryId(entryId);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/entries/${entryId}`);
            if (!res.ok) {
                throw new Error("Failed to fetch entry details");
            }
            const data = await res.json();
            setDetailEntry(data);
        } catch (error) {
            console.error("Failed to fetch entry details:", error);
            alert("Failed to load entry details. Please try again.");
            setSelectedEntryId(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetailView = () => {
        setSelectedEntryId(null);
        setDetailEntry(null);
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

    const formatCurrency = (amount: number | null, currency: string | null = "EUR") => {
        if (!amount) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <AdminAuthGuard>
                <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
                    <div className="container mx-auto px-4 py-6">
                        <AdminHeader />
                        <div className="mt-6">
                            <h1 className="text-3xl font-bold mb-6 text-stone-100">Entry Review Queue</h1>
                            <p className="text-stone-400">Loading...</p>
                        </div>
                    </div>
                </div>
            </AdminAuthGuard>
        );
    }

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
                <div className="container mx-auto px-4 py-6">
                    <AdminHeader />

                    <div className="mt-6">
                        <h1 className="text-3xl font-bold mb-2 text-stone-100">Entry Review Queue</h1>
                        <p className="text-stone-400">
                            Review flagged entries and approve or reject them based on anomaly detection analysis.
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
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">
                                Approved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-600">
                                Pending
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600">
                                Needs Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.needsReview}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">
                                Rejected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
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
                                            {entry.jobTitle || "Untitled Position"}
                                        </CardTitle>
                                        <CardDescription className="flex flex-col gap-1">
                                            <span>Submitted: {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        {getAnomalyBadge(entry.anomalyScore)}
                                        <Badge variant={entry.reviewStatus === "NEEDS_REVIEW" ? "destructive" : "secondary"}>
                                            {entry.reviewStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Gross Salary</p>
                                        <p className="font-semibold text-lg">
                                            {formatCurrency(entry.grossSalary, entry.currency)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Country</p>
                                        <p className="font-semibold">{entry.country || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Sector</p>
                                        <p className="font-semibold">{entry.sector || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Experience</p>
                                        <p className="font-semibold">
                                            {entry.workExperience === null ? "N/A" : `${entry.workExperience} years`}
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
                                                <p className="text-sm text-yellow-800">{entry.anomalyReason}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleViewDetails(entry.id)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleAction(entry.id, "reject")}
                                        disabled={processingId === entry.id}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => handleAction(entry.id, "approve")}
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

                {/* Detail Modal */}
                {selectedEntryId && (
                    <AdminEntryDetailModal
                        entry={detailEntry}
                        isLoading={detailLoading}
                        onClose={closeDetailView}
                    />
                )}
            </div>
        </AdminAuthGuard>
    );
}
