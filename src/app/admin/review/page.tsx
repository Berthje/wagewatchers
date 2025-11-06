"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Eye, User, Briefcase, MapPin, TrendingUp, Clock } from "lucide-react";
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

                    <div className="mt-6 mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-stone-100">Entry Review Queue</h1>
                        <p className="text-stone-400">
                            Review flagged entries and approve or reject them based on anomaly detection analysis.
                        </p>
                    </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <Card className="bg-stone-800/50 border-stone-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                                Total Entries
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-stone-100">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-500/10 border-green-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-medium text-green-400 uppercase tracking-wider">
                                Approved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-medium text-yellow-400 uppercase tracking-wider">
                                Pending
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-500/10 border-orange-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-medium text-orange-400 uppercase tracking-wider">
                                Needs Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-500">{stats.needsReview}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-500/10 border-red-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-medium text-red-400 uppercase tracking-wider">
                                Rejected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-500">{stats.rejected}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Entries List */}
            {entries.length === 0 ? (
                <Card className="bg-stone-800/50 border-stone-700">
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-stone-100 mb-2">All Clear!</h3>
                            <p className="text-stone-400">No entries pending review. Great job!</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <Card key={entry.id} className="bg-stone-800/50 border-stone-700 hover:border-stone-600 transition-colors">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <CardTitle className="text-xl text-stone-100">
                                                {entry.jobTitle || "Untitled Position"}
                                            </CardTitle>
                                            <Badge
                                                variant={entry.reviewStatus === "NEEDS_REVIEW" ? "destructive" : "secondary"}
                                                className="shrink-0"
                                            >
                                                {entry.reviewStatus.replace("_", " ")}
                                            </Badge>
                                            {getAnomalyBadge(entry.anomalyScore)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-stone-400 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {entry.country && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {entry.country}
                                                </span>
                                            )}
                                            {entry.sector && (
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-3.5 w-3.5" />
                                                    {entry.sector}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-stone-900/50 rounded-lg border border-stone-700/50">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <span className="text-xs font-medium text-stone-400">Gross Salary</span>
                                        </div>
                                        <p className="text-lg font-bold text-stone-100">
                                            {formatCurrency(entry.grossSalary, entry.currency)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            <span className="text-xs font-medium text-stone-400">Location</span>
                                        </div>
                                        <p className="text-lg font-semibold text-stone-100 truncate">
                                            {entry.country || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Briefcase className="h-4 w-4 text-purple-500" />
                                            <span className="text-xs font-medium text-stone-400">Sector</span>
                                        </div>
                                        <p className="text-lg font-semibold text-stone-100 truncate">
                                            {entry.sector || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <User className="h-4 w-4 text-orange-500" />
                                            <span className="text-xs font-medium text-stone-400">Experience</span>
                                        </div>
                                        <p className="text-lg font-semibold text-stone-100">
                                            {entry.workExperience === null ? "N/A" : `${entry.workExperience} yrs`}
                                        </p>
                                    </div>
                                </div>

                                {/* Anomaly Reason - Only if present */}
                                {entry.anomalyReason && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <div className="shrink-0">
                                                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-yellow-200 text-sm mb-1">
                                                    Anomaly Detection Alert
                                                </p>
                                                <p className="text-sm text-yellow-100/80 leading-relaxed">
                                                    {entry.anomalyReason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleViewDetails(entry.id)}
                                        className="border-stone-600 hover:border-stone-500 hover:bg-stone-800"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Full Details
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleAction(entry.id, "reject")}
                                        disabled={processingId === entry.id}
                                        className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-200 hover:text-red-100"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {processingId === entry.id ? "Processing..." : "Reject"}
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(entry.id, "approve")}
                                        disabled={processingId === entry.id}
                                        className="bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-200 hover:text-green-100"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {processingId === entry.id ? "Processing..." : "Approve"}
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
