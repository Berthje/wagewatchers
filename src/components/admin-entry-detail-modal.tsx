"use client";

import type { SalaryEntry } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    User,
    Briefcase,
    Coins,
    MapPin,
    Clock,
    Building,
    TrendingUp,
    Gift,
    FileText,
    X,
} from "lucide-react";

interface AdminEntryDetailModalProps {
    readonly entry: SalaryEntry | null;
    readonly isLoading: boolean;
    readonly onClose: () => void;
}

export function AdminEntryDetailModal({
    entry,
    isLoading,
    onClose,
}: Readonly<AdminEntryDetailModalProps>) {
    if (!entry && !isLoading) return null;

    const formatCurrency = (amount: number | null, currency: string | null = "EUR") => {
        if (!amount) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: Date | string | null): string => {
        if (!date) return "N/A";
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const timeStr = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${dateStr} at ${timeStr}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-4">
            <div className="relative bg-stone-900 rounded-lg w-full max-w-5xl my-8 border border-stone-700">
                {/* Header with close button */}
                <div className="sticky top-0 z-10 bg-stone-900 border-b border-stone-700 p-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-2xl font-bold text-stone-100">
                        {isLoading ? "Loading..." : entry?.jobTitle || "Entry Details"}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-100"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-stone-400">
                        <p>Loading entry details...</p>
                    </div>
                ) : entry ? (
                    <div className="p-6 space-y-6">
                        {/* Metadata badges */}
                        <div className="flex flex-wrap gap-2">
                            {entry.country && (
                                <Badge variant="outline" className="border-stone-600 text-stone-300">
                                    <MapPin className="mr-1 h-3 w-3" />
                                    {entry.country}
                                    {entry.workCity && ` - ${entry.workCity}`}
                                </Badge>
                            )}
                            {entry.sector && (
                                <Badge variant="outline" className="border-stone-600 text-stone-300">
                                    <Briefcase className="mr-1 h-3 w-3" />
                                    {entry.sector}
                                </Badge>
                            )}
                            <Badge
                                variant={entry.reviewStatus === "NEEDS_REVIEW" ? "destructive" : "secondary"}
                            >
                                {entry.reviewStatus}
                            </Badge>
                        </div>

                        {/* Salary Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-stone-800 border-stone-700">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-stone-400 flex items-center">
                                        <Coins className="mr-2 h-4 w-4" />
                                        Gross Salary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-bold text-stone-100">
                                        {formatCurrency(entry.grossSalary, entry.currency)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-stone-800 border-stone-700">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-stone-400 flex items-center">
                                        <Coins className="mr-2 h-4 w-4" />
                                        Net Salary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-bold text-stone-100">
                                        {formatCurrency(entry.netSalary, entry.currency)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-stone-800 border-stone-700">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-stone-400 flex items-center">
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Net Compensation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-bold text-stone-100">
                                        {formatCurrency(entry.netCompensation, entry.currency)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Personal Information */}
                        <Card className="bg-stone-800 border-stone-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-stone-100 flex items-center">
                                    <User className="mr-2 h-5 w-5" />
                                    Personal Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem label="Age" value={entry.age !== null ? `${entry.age} years` : undefined} />
                                    <InfoItem label="Education" value={entry.education} />
                                    <InfoItem
                                        label="Work Experience"
                                        value={entry.workExperience !== null ? `${entry.workExperience} years` : undefined}
                                    />
                                    <InfoItem label="Civil Status" value={entry.civilStatus} />
                                    <InfoItem label="Dependents" value={entry.dependents?.toString()} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Information */}
                        <Card className="bg-stone-800 border-stone-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-stone-100 flex items-center">
                                    <Briefcase className="mr-2 h-5 w-5" />
                                    Job Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem label="Job Title" value={entry.jobTitle} />
                                    <InfoItem label="Sector" value={entry.sector} />
                                    <InfoItem
                                        label="Seniority"
                                        value={entry.seniority !== null ? `${entry.seniority} years` : undefined}
                                    />
                                    <InfoItem label="Employee Count" value={entry.employeeCount} />
                                    <InfoItem
                                        label="Multinational"
                                        value={entry.multinational !== null ? (entry.multinational ? "Yes" : "No") : undefined}
                                    />
                                </div>
                                {entry.jobDescription && (
                                    <div className="mt-4 pt-4 border-t border-stone-700">
                                        <p className="text-sm font-medium text-stone-400 mb-2">Job Description</p>
                                        <p className="text-stone-100">{entry.jobDescription}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Work Schedule */}
                        <Card className="bg-stone-800 border-stone-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-stone-100 flex items-center">
                                    <Clock className="mr-2 h-5 w-5" />
                                    Work Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem
                                        label="Official Hours"
                                        value={entry.officialHours !== null ? `${entry.officialHours} hours/week` : undefined}
                                    />
                                    <InfoItem
                                        label="Average Hours"
                                        value={entry.averageHours !== null ? `${entry.averageHours} hours/week` : undefined}
                                    />
                                    <InfoItem
                                        label="Vacation Days"
                                        value={entry.vacationDays !== null ? `${entry.vacationDays} days` : undefined}
                                    />
                                    <InfoItem
                                        label="Telework Days"
                                        value={entry.teleworkDays !== null ? `${entry.teleworkDays} days/week` : undefined}
                                    />
                                    <InfoItem label="Shift Description" value={entry.shiftDescription} />
                                    <InfoItem label="On Call" value={entry.onCall} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Benefits */}
                        <Card className="bg-stone-800 border-stone-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-stone-100 flex items-center">
                                    <Gift className="mr-2 h-5 w-5" />
                                    Benefits
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem label="13th Month" value={entry.thirteenthMonth} />
                                    <InfoItem
                                        label="Meal Vouchers"
                                        value={entry.mealVouchers !== null ? formatCurrency(entry.mealVouchers, entry.currency) : undefined}
                                    />
                                    <InfoItem
                                        label="Eco Cheques"
                                        value={entry.ecoCheques !== null ? formatCurrency(entry.ecoCheques, entry.currency) : undefined}
                                    />
                                    <InfoItem label="Group Insurance" value={entry.groupInsurance} />
                                    <InfoItem label="Other Insurances" value={entry.otherInsurances} />
                                </div>
                                {entry.otherBenefits && (
                                    <div className="mt-4 pt-4 border-t border-stone-700">
                                        <p className="text-sm font-medium text-stone-400 mb-2">Other Benefits</p>
                                        <p className="text-stone-100">{entry.otherBenefits}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Location & Commute */}
                        <Card className="bg-stone-800 border-stone-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-stone-100 flex items-center">
                                    <MapPin className="mr-2 h-5 w-5" />
                                    Location & Commute
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem label="Work City" value={entry.workCity} />
                                    <InfoItem
                                        label="Commute Distance"
                                        value={entry.commuteDistance !== null ? `${entry.commuteDistance} km` : undefined}
                                    />
                                    <InfoItem label="Commute Method" value={entry.commuteMethod} />
                                    <InfoItem label="Commute Compensation" value={entry.commuteCompensation} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Work Environment */}
                        <Card className="bg-stone-800 border-stone-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-stone-100 flex items-center">
                                    <Building className="mr-2 h-5 w-5" />
                                    Work Environment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem label="Day Off Ease" value={entry.dayOffEase} />
                                    <InfoItem label="Stress Level" value={entry.stressLevel} />
                                    <InfoItem label="Reports" value={entry.reports?.toString()} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Notes */}
                        {entry.extraNotes && (
                            <Card className="bg-stone-800 border-stone-700">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-stone-100 flex items-center">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Additional Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="prose prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html: entry.extraNotes,
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Anomaly Information */}
                        {entry.anomalyScore !== null && (
                            <Card className="bg-stone-800 border-stone-700">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-stone-100">Anomaly Detection</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <InfoItem label="Anomaly Score" value={entry.anomalyScore?.toString()} />
                                        {entry.anomalyReason && (
                                            <InfoItem label="Reason" value={entry.anomalyReason} />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Submission Info */}
                        <Card className="bg-stone-800 border-stone-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-stone-100">Submission Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem label="Submitted" value={formatDate(entry.createdAt)} />
                                    <InfoItem
                                        label="Source"
                                        value={entry.isManualEntry ? "Manual Entry" : entry.source || "Unknown"}
                                    />
                                    {entry.reviewedAt && (
                                        <InfoItem label="Reviewed At" value={formatDate(entry.reviewedAt)} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function InfoItem({
    label,
    value,
}: Readonly<{
    label: string;
    value: string | number | null | undefined;
}>) {
    const displayValue = value == null || value === "" ? "/" : value;
    return (
        <div>
            <p className="text-sm font-medium text-stone-400 mb-1">{label}</p>
            <p className="text-stone-100">{displayValue}</p>
        </div>
    );
}
