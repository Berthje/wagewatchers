"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { SalaryEntry } from "@/lib/db/schema";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Edit,
    Eye,
    Trash2,
    AlertCircle,
    Calendar,
    HelpCircle,
    AlertTriangle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    getOwnedEntryIds,
    getEntryToken,
    isEntryEditable,
    removeEntryToken,
} from "@/lib/entry-ownership";
import {
    useSalaryDisplay,
    formatSalaryWithPreferences,
} from "@/contexts/salary-display-context";
import { createCityDisplayFormatter } from "@/lib/utils/format.utils";
import confetti from "canvas-confetti";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

function MyEntriesContent() {
    const params = useParams();
    const locale = params.locale as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("myEntries");
    const tNav = useTranslations("nav");
    const tUi = useTranslations("ui");
    const tEntryDetail = useTranslations("entryDetail");
    const { preferences } = useSalaryDisplay();
    const formatCityDisplay = createCityDisplayFormatter(tUi);

    const navTranslations = {
        dashboard: tNav("dashboard"),
        statistics: tNav("statistics"),
        feedback: tNav("feedback"),
        status: tNav("status"),
        donate: tNav("donate"),
        addEntry: tNav("addEntry"),
        changelog: tNav("changelog"),
    };

    const [entries, setEntries] = useState<SalaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<SalaryEntry | null>(
        null
    );
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    useEffect(() => {
        loadMyEntries();

        // Check if we just submitted a new entry
        if (searchParams.get("success") === "true") {
            // Trigger confetti
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = {
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                zIndex: 0,
            };

            function randomInRange(min: number, max: number) {
                return Math.random() * (max - min) + min;
            }

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(0.1, 0.3),
                        y: Math.random() - 0.2,
                    },
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(0.7, 0.9),
                        y: Math.random() - 0.2,
                    },
                });
            }, 250);

            // Clean up URL parameter
            const newUrl = `/${locale}/my-entries`;
            router.replace(newUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const loadMyEntries = async () => {
        setIsLoading(true);
        try {
            const entryIds = getOwnedEntryIds();

            if (entryIds.length === 0) {
                setEntries([]);
                setIsLoading(false);
                return;
            }

            const res = await fetch(`/api/entries?ids=${entryIds.join(",")}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            } else {
                console.error("Failed to load entries");
            }
        } catch (error) {
            console.error("Error loading entries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = (id: number) => {
        router.push(`/${locale}/dashboard/${id}`);
    };

    const handleEdit = (id: number) => {
        router.push(`/${locale}/edit/${id}`);
    };

    const openDeleteDialog = (entry: SalaryEntry) => {
        setEntryToDelete(entry);
        setDeleteConfirmText("");
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!entryToDelete) return;

        setDeletingId(entryToDelete.id);
        try {
            const token = getEntryToken(entryToDelete.id);
            const res = await fetch(`/api/entries/${entryToDelete.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ownerToken: token }),
            });

            if (res.ok) {
                removeEntryToken(entryToDelete.id);
                setEntries(entries.filter((e) => e.id !== entryToDelete.id));
                setDeleteError(null);
                setDeleteDialogOpen(false);
                setEntryToDelete(null);
                setDeleteConfirmText("");
            } else {
                const error = await res.json();
                setDeleteError(
                    t("deleteError") + ": " + (error.error || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Delete error:", error);
            setDeleteError(t("deleteError"));
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (date: Date) => {
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const timeStr = dateObj.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${dateStr} ${timeStr}`;
    };

    const formatSalary = (amount: number | null, currency: string | null = "EUR") => {
        if (!amount) return "-";
        return formatSalaryWithPreferences(
            amount,
            currency,
            false,
            preferences.currency,
            preferences.period,
            locale,
            false
        );
    };

    const getEditStatus = (entry: SalaryEntry) => {
        const editable = isEntryEditable(entry.editableUntil);
        if (editable) {
            const hoursLeft = Math.ceil(
                (new Date(entry.editableUntil!).getTime() - Date.now()) /
                (1000 * 60 * 60)
            );
            return { editable: true, hoursLeft };
        }
        return { editable: false, hoursLeft: 0 };
    };

    const getReviewStatusBadge = (reviewStatus: string | null) => {
        if (!reviewStatus) {
            return (
                <Badge variant="outline">
                    {t("table.pending")}
                </Badge>
            );
        }

        const statusConfig = {
            APPROVED: {
                variant: "default" as const,
                text: tEntryDetail("reviewStatus.approved"),
                tooltip: tEntryDetail("reviewStatus.tooltip.approved"),
            },
            PENDING: {
                variant: "secondary" as const,
                text: tEntryDetail("reviewStatus.pendingReview"),
                tooltip: tEntryDetail("reviewStatus.tooltip.pendingReview"),
            },
            NEEDS_REVIEW: {
                variant: "destructive" as const,
                text: tEntryDetail("reviewStatus.needsReview"),
                tooltip: tEntryDetail("reviewStatus.tooltip.needsReview"),
            },
            REJECTED: {
                variant: "destructive" as const,
                text: tEntryDetail("reviewStatus.rejected"),
                tooltip: tEntryDetail("reviewStatus.tooltip.rejected"),
            },
        };

        const config = statusConfig[reviewStatus as keyof typeof statusConfig];
        if (!config) return null;

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant={config.variant} className="cursor-help">
                            {config.text}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{config.tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <div className="min-h-screen bg-stone-900">
            <Navbar locale={locale} translations={navTranslations} />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-stone-100 mb-2">
                            {t("title")}
                        </h1>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                >
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    {t("howItWorks")}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>{t("infoTitle")}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                    <ul className="space-y-3 text-sm text-stone-300">
                                        <li className="flex gap-3">
                                            <span className="text-orange-400 shrink-0">
                                                •
                                            </span>
                                            <span>{t("info1")}</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-orange-400 shrink-0">
                                                •
                                            </span>
                                            <span>{t("info2")}</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-orange-400 shrink-0">
                                                •
                                            </span>
                                            <span>{t("info3")}</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-orange-400 shrink-0">
                                                •
                                            </span>
                                            <span>{t("info4")}</span>
                                        </li>
                                    </ul>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <p className="text-stone-400">
                        {t("description")}
                    </p>
                </div>


                {deleteError && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                )}

                {isLoading ? (
                    <LoadingSpinner
                        message={t("loading")}
                        fullScreen={false}
                        size="lg"
                    />
                ) : entries.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-stone-400 mb-4" />
                            <h3 className="text-lg font-semibold text-stone-100 mb-2">
                                {t("noEntries")}
                            </h3>
                            <p className="text-stone-400 mb-6">
                                {t("noEntriesDescription")}
                            </p>
                            <Button
                                onClick={() => router.push(`/${locale}/add`)}
                            >
                                {t("addFirst")}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t("yourEntries", { count: entries.length })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t("table.location")}
                                            </TableHead>
                                            <TableHead>
                                                {t("table.jobTitle")}
                                            </TableHead>
                                            <TableHead>
                                                {t("table.salary")}
                                            </TableHead>
                                            <TableHead>
                                                {t("table.submitted")}
                                            </TableHead>
                                            <TableHead>
                                                {t("table.status")}
                                            </TableHead>
                                            <TableHead>
                                                {t("table.editStatus")}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t("table.actions")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entries.map((entry) => {
                                            const editStatus =
                                                getEditStatus(entry);
                                            return (
                                                <TableRow key={entry.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Badge variant="outline">
                                                                {entry.country
                                                                    ? formatCityDisplay(entry.country, entry.workCity)
                                                                    : "-"}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {entry.jobTitle ||
                                                            t("table.noTitle")}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatSalary(
                                                            entry.grossSalary,
                                                            entry.currency
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-stone-400">
                                                        {formatDate(
                                                            entry.createdAt
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getReviewStatusBadge(entry.reviewStatus)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {editStatus.editable ? (
                                                            <Badge
                                                                variant="default"
                                                                className="bg-orange-300"
                                                            >
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {t(
                                                                    "table.editableFor",
                                                                    {
                                                                        hours: editStatus.hoursLeft,
                                                                    }
                                                                )}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">
                                                                {t(
                                                                    "table.readonly"
                                                                )}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleView(
                                                                        entry.id
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            {editStatus.editable && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleEdit(
                                                                                entry.id
                                                                            )
                                                                        }
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            openDeleteDialog(
                                                                                entry
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deletingId ===
                                                                            entry.id
                                                                        }
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            {t("deleteDialog.title")}
                        </DialogTitle>
                    </DialogHeader>

                    {entryToDelete && (
                        <div className="space-y-5">
                            {/* Entry Details */}
                            <div className="bg-stone-800 p-4 rounded-lg border border-stone-700">
                                <p className="text-stone-400 mb-2">
                                    {t("deleteDialog.deletingEntry")}
                                </p>
                                <div className="space-y-1">
                                    <p className="font-semibold text-stone-100">
                                        {entryToDelete.jobTitle ||
                                            t("table.noTitle")}
                                    </p>
                                    <p className="text-stone-400">
                                        {entryToDelete.country
                                            ? formatCityDisplay(entryToDelete.country, entryToDelete.workCity)
                                            : "-"}{" "}
                                        •{" "}
                                        {formatSalary(
                                            entryToDelete.grossSalary
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Simple bullet list */}
                            <div className="space-y-2.5 text-sm text-stone-300">
                                <p className="flex items-start gap-2">
                                    <span className="text-stone-500 mt-0.5">
                                        •
                                    </span>
                                    <span>{t("deleteDialog.canEdit")}</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-stone-500 mt-0.5">
                                        •
                                    </span>
                                    <span>{t("deleteDialog.permanent")}</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-stone-500 mt-0.5">
                                        •
                                    </span>
                                    <span>{t("deleteDialog.helpsOthers")}</span>
                                </p>
                            </div>

                            {/* Confirmation Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-100">
                                    {t("deleteDialog.typeToConfirm")}
                                </label>
                                <Input
                                    value={deleteConfirmText}
                                    onChange={(e) =>
                                        setDeleteConfirmText(e.target.value)
                                    }
                                    className="font-mono mt-2"
                                    autoComplete="off"
                                />
                                <p className="text-xs text-stone-400">
                                    {t("deleteDialog.confirmHint")}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDeleteDialogOpen(false);
                                        setDeleteConfirmText("");
                                        setEntryToDelete(null);
                                    }}
                                    className="flex-1"
                                    disabled={deletingId !== null}
                                >
                                    {t("deleteDialog.cancel")}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={
                                        deleteConfirmText !== "DELETE" ||
                                        deletingId !== null
                                    }
                                    className="flex-1"
                                >
                                    {deletingId !== null ? (
                                        <span className="ml-2">
                                            {t("deleteDialog.deleting")}
                                        </span>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {t("deleteDialog.confirmDelete")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function MyEntriesClient() {
    return <MyEntriesContent />;
}