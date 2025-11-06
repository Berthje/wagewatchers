"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Bug,
    Lightbulb,
    TrendingUp,
    X,
    Calendar,
    User,
    Mail,
    GripVertical,
    Search,
    Loader2,
} from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AdminHeader } from "@/components/admin-header";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

const statusColumns = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
const priorityColors = {
    LOW: "bg-stone-700 text-stone-200",
    MEDIUM: "bg-amber-900/50 text-amber-200",
    HIGH: "bg-orange-900/50 text-orange-200",
    CRITICAL: "bg-red-900/50 text-red-200",
};

const typeIcons = {
    BUG: Bug,
    FEATURE: Lightbulb,
    IMPROVEMENT: TrendingUp,
};

// Droppable Column Component
function DroppableColumn({
    status,
    children,
    count,
}: Readonly<{
    status: string;
    children: React.ReactNode;
    count: number;
}>) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div
            className={`bg-stone-800/50 rounded-lg border-2 transition-colors flex flex-col ${isOver
                ? "border-amber-500 bg-amber-900/20"
                : "border-stone-700"
                }`}
        >
            <div className="p-4 pb-3 border-b border-stone-700 bg-stone-800/70 rounded-t-lg sticky top-0 z-10">
                <h2 className="text-lg font-semibold capitalize text-stone-100">
                    {status.replace("_", " ").toLowerCase()}
                    <span className="ml-2 text-sm font-normal text-stone-400">
                        ({count})
                    </span>
                </h2>
            </div>
            <div
                ref={setNodeRef}
                className="p-4 overflow-y-auto flex-1 max-h-[calc(100vh-350px)] scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-transparent"
                style={{
                    scrollbarWidth: "thin",
                }}
            >
                {children}
            </div>
        </div>
    );
}

// Sortable Card Component
function SortableReportCard({
    report,
    onSelect,
}: Readonly<{
    report: Report;
    onSelect: (report: Report) => void;
}>) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: report.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const TypeIcon = typeIcons[report.type];

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:border-amber-500 border-stone-700 bg-stone-900 mb-0"
                onClick={() => {
                    // Only open detail view on single click without dragging
                    if (!isDragging) {
                        onSelect(report);
                    }
                }}
            >
                <CardHeader className="pb-2.5 pt-3 px-3.5 space-y-0">
                    <div className="flex items-center gap-2 mb-2 min-w-0">
                        <GripVertical className="w-4 h-4 text-stone-600 shrink-0" />
                        <TypeIcon className="w-4 h-4 text-stone-400 shrink-0" />
                        <CardTitle className="text-sm font-semibold text-stone-100 truncate flex-1 min-w-0">
                            {report.title}
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            className={`${priorityColors[report.priority]} text-xs px-2 py-0.5 font-medium`}
                        >
                            {report.priority}
                        </Badge>
                        <span className="text-xs text-stone-500">
                            #{report.id}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="px-3.5 pb-3 pt-1.5">
                    <p className="text-sm text-stone-400 mb-2.5 line-clamp-2 leading-relaxed">
                        {report.description}
                    </p>
                    <div className="flex items-center text-xs text-stone-400">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        <span>
                            {new Date(report.createdAt).toLocaleDateString()}{" "}
                            {new Date(report.createdAt).toLocaleTimeString(
                                undefined,
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            )}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<{
        status?: string;
        type?: string;
        priority?: string;
    }>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const fetchReports = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter.status) params.append("status", filter.status);
            if (filter.type) params.append("type", filter.type);
            if (filter.priority) params.append("priority", filter.priority);

            const response = await fetch(`/api/reports?${params}`);
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const updateReportStatus = async (reportId: number, newStatus: string) => {
        try {
            // Update the database first
            const response = await fetch("/api/reports", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: reportId,
                    status: newStatus,
                }),
            });

            if (response.ok) {
                const updatedReport = await response.json();
                // Update local state with the full updated report from server
                setReports(
                    reports.map((report) =>
                        report.id === reportId ? updatedReport : report
                    )
                );
            } else {
                console.error("Failed to update report status");
                alert("Failed to update report status. Please try again.");
            }
        } catch (error) {
            console.error("Error updating report status:", error);
            alert("Failed to update report status. Please try again.");
        }
    };

    const getReportsByStatus = (status: string) => {
        return reports.filter((report) => {
            const matchesStatus = report.status === status;
            const matchesSearch =
                searchQuery.trim() === "" ||
                report.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                report.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                report.id.toString().includes(searchQuery);
            return matchesStatus && matchesSearch;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeReport = reports.find((r) => r.id === active.id);
        if (!activeReport) return;

        const overId = over.id;

        // Check if dropped over a status column directly
        if (statusColumns.includes(overId as any)) {
            updateReportStatus(activeReport.id, overId as string);
        } else {
            // Dropped over another card - find which column that card is in
            const overReport = reports.find((r) => r.id === overId);
            if (overReport && overReport.status !== activeReport.status) {
                updateReportStatus(activeReport.id, overReport.status);
            }
        }
    };

    const activeReport = activeId
        ? reports.find((r) => r.id === activeId)
        : null;

    if (loading) {
        return (
            <AdminAuthGuard>
                <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                        <p className="text-sm text-stone-400">
                            Loading reports...
                        </p>
                    </div>
                </div>
            </AdminAuthGuard>
        );
    }

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
                <div className="container mx-auto px-4 py-6">
                    {/* Admin Header with Home, Logout, and Back button */}
                    <AdminHeader />

                    <div className="mt-6">
                        <h1 className="text-3xl font-bold mb-4 text-stone-100">
                            Bug & Feature Reports
                        </h1>

                    {/* Filters */}
                    <div className="space-y-4 mb-6">
                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-500" />
                            <Input
                                type="text"
                                placeholder="Search by title, description, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-stone-800 border-stone-700"
                            />
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="flex flex-wrap gap-3">
                            <Select
                                onValueChange={(value) =>
                                    setFilter({
                                        ...filter,
                                        status:
                                            value === "all" ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">
                                        In Progress
                                    </SelectItem>
                                    <SelectItem value="DONE">Done</SelectItem>
                                    <SelectItem value="CANCELLED">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                onValueChange={(value) =>
                                    setFilter({
                                        ...filter,
                                        type:
                                            value === "all" ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Types
                                    </SelectItem>
                                    <SelectItem value="BUG">Bug</SelectItem>
                                    <SelectItem value="FEATURE">
                                        Feature
                                    </SelectItem>
                                    <SelectItem value="IMPROVEMENT">
                                        Improvement
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                onValueChange={(value) =>
                                    setFilter({
                                        ...filter,
                                        priority:
                                            value === "all" ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Priorities
                                    </SelectItem>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">
                                        Critical
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {(searchQuery ||
                                filter.status ||
                                filter.type ||
                                filter.priority) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setFilter({});
                                        }}
                                        className="text-stone-400"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Clear filters
                                    </Button>
                                )}
                        </div>
                    </div>
                </div>

                {/* Kanban Board */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {statusColumns.map((status) => {
                            const statusReports = getReportsByStatus(status);
                            return (
                                <DroppableColumn
                                    key={status}
                                    status={status}
                                    count={statusReports.length}
                                >
                                    <SortableContext
                                        items={statusReports.map((r) => r.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {statusReports.length > 0 ? (
                                            <div className="space-y-3">
                                                {statusReports.map((report) => (
                                                    <SortableReportCard
                                                        key={report.id}
                                                        report={report}
                                                        onSelect={
                                                            setSelectedReport
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-stone-600">
                                                <p className="text-sm text-center">
                                                    {searchQuery ||
                                                        filter.status ||
                                                        filter.type ||
                                                        filter.priority
                                                        ? "No reports match your filters"
                                                        : "No reports in this column"}
                                                </p>
                                            </div>
                                        )}
                                    </SortableContext>
                                </DroppableColumn>
                            );
                        })}
                    </div>
                    <DragOverlay>
                        {activeReport ? (
                            <Card className="cursor-grabbing shadow-2xl border-stone-700 bg-stone-900 rotate-3">
                                <CardHeader>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {React.createElement(
                                                typeIcons[activeReport.type],
                                                {
                                                    className:
                                                        "w-5 h-5 text-stone-400",
                                                }
                                            )}
                                            <CardTitle className="text-sm font-medium text-stone-100">
                                                {activeReport.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                    <Badge
                                        className={
                                            priorityColors[
                                            activeReport.priority
                                            ]
                                        }
                                    >
                                        {activeReport.priority}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-stone-400 line-clamp-3">
                                        {activeReport.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Ticket Detail Sidebar */}
            {selectedReport && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
                    onClick={() => setSelectedReport(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-stone-900 shadow-2xl h-full overflow-y-auto border-l border-stone-700 scrollbar-thin"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-stone-900/95 backdrop-blur-md border-b border-stone-700 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {React.createElement(
                                    typeIcons[selectedReport.type],
                                    {
                                        className:
                                            "w-5 h-5 text-stone-400",
                                    }
                                )}
                                <div>
                                    <h2 className="text-lg font-semibold text-stone-100">
                                        Ticket #{selectedReport.id}
                                    </h2>
                                    <p className="text-sm text-stone-400">
                                        {selectedReport.type
                                            .charAt(0)
                                            .toUpperCase() +
                                            selectedReport.type
                                                .slice(1)
                                                .toLowerCase()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReport(null)}
                                className="text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-full w-8 h-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {React.createElement(
                                        typeIcons[selectedReport.type],
                                        {
                                            className:
                                                "w-6 h-6 text-stone-400",
                                        }
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-stone-100">
                                            {selectedReport.title}
                                        </h3>
                                        <p className="text-sm text-stone-400">
                                            #{selectedReport.id}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    className={
                                        priorityColors[selectedReport.priority]
                                    }
                                >
                                    {selectedReport.priority}
                                </Badge>
                            </div>

                            {/* Status */}
                            <div>
                                <Label className="text-sm font-medium text-stone-300">
                                    Status
                                </Label>
                                <div className="mt-1">
                                    <Badge
                                        variant="outline"
                                        className="capitalize text-stone-100 border-stone-600"
                                    >
                                        {selectedReport.status
                                            .replace("_", " ")
                                            .toLowerCase()}
                                    </Badge>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-sm font-medium text-stone-300">
                                    Description
                                </Label>
                                <div className="mt-2 p-4 bg-stone-800/50 rounded-lg border border-stone-700">
                                    <p className="text-stone-100 whitespace-pre-wrap">
                                        {selectedReport.description}
                                    </p>
                                </div>
                            </div>

                            {/* Reporter Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-stone-300 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Reporter ID
                                    </Label>
                                    <p className="mt-1 text-stone-100 font-mono text-sm">
                                        {selectedReport.trackingId}
                                    </p>
                                </div>
                                {selectedReport.email && (
                                    <div>
                                        <Label className="text-sm font-medium text-stone-300 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </Label>
                                        <p className="mt-1 text-stone-100">
                                            {selectedReport.email}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-stone-300 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Created
                                    </Label>
                                    <p className="mt-1 text-stone-100">
                                        {new Date(
                                            selectedReport.createdAt
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-stone-300 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Updated
                                    </Label>
                                    <p className="mt-1 text-stone-100">
                                        {new Date(
                                            selectedReport.updatedAt
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Status Management */}
                            <div className="pt-6 border-t border-stone-700 space-y-3">
                                <Label className="text-xs font-medium text-stone-400 uppercase tracking-wide">
                                    Update Status
                                </Label>
                                <Select
                                    value={selectedReport.status}
                                    onValueChange={(newStatus) => {
                                        updateReportStatus(
                                            selectedReport.id,
                                            newStatus
                                        );
                                        setSelectedReport({
                                            ...selectedReport,
                                            status: newStatus as any,
                                            updatedAt: new Date().toISOString(),
                                        });
                                    }}
                                >
                                    <SelectTrigger className="w-full border-stone-700 bg-stone-800 text-stone-100 h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-stone-700 bg-stone-800">
                                        <SelectItem
                                            value="TODO"
                                            className="text-stone-100 hover:bg-stone-700 focus:bg-stone-700"
                                        >
                                            To Do
                                        </SelectItem>
                                        <SelectItem
                                            value="IN_PROGRESS"
                                            className="text-stone-100 hover:bg-stone-700 focus:bg-stone-700"
                                        >
                                            In Progress
                                        </SelectItem>
                                        <SelectItem
                                            value="DONE"
                                            className="text-stone-100 hover:bg-stone-700 focus:bg-stone-700"
                                        >
                                            Done
                                        </SelectItem>
                                        <SelectItem
                                            value="CANCELLED"
                                            className="text-stone-100 hover:bg-stone-700 focus:bg-stone-700"
                                        >
                                            Cancelled
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </AdminAuthGuard>
    );
}
