"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import { Bug, Lightbulb, TrendingUp, Search, AlertCircle, Loader2 } from "lucide-react";

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
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

const typeIcons = {
  BUG: Bug,
  FEATURE: Lightbulb,
  IMPROVEMENT: TrendingUp,
};

export default function StatusClient() {
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

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"trackingId" | "email">("trackingId");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [searched, setSearched] = useState(false);
  const [myTrackingIds, setMyTrackingIds] = useState<string[]>([]);

  const loadMyReports = useCallback(
    async (trackingIds: string[]) => {
      setLoading(true);
      setError("");
      // Don't set searched=true here, this is automatic loading

      try {
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
          const sortedReports = allReports.toSorted(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setReports(sortedReports);
        }
      } catch {
        setError(t("errors.network"));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // Load tracking IDs from localStorage on mount
  useEffect(() => {
    const storedIds = localStorage.getItem(STORAGE_KEY);
    if (storedIds) {
      try {
        const ids = JSON.parse(storedIds) as string[];
        setMyTrackingIds(ids);
        // Auto-load reports for stored tracking IDs
        if (ids.length > 0) {
          loadMyReports(ids);
        } else {
          // No IDs to load, stop loading
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse stored tracking IDs", e);
        setLoading(false);
      }
    } else {
      // No stored IDs, stop loading
      setLoading(false);
    }
  }, [loadMyReports]);

  const handleSearchInputChange = (value: string) => {
    setValidationError("");

    if (searchType === "trackingId") {
      // Only allow alphanumeric characters and dash
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");

      // Auto-format with dash after 4 characters
      let formatted = cleaned.replaceAll("-", ""); // Remove existing dashes
      if (formatted.length > 4) {
        formatted = formatted.slice(0, 4) + "-" + formatted.slice(4, 8);
      } else {
        formatted = formatted.slice(0, 8);
      }

      setSearchTerm(formatted);
    } else {
      setSearchTerm(value);
    }
  };

  const validateInput = (): boolean => {
    if (!searchTerm.trim()) {
      setValidationError(t("errors.empty"));
      return false;
    }

    if (searchType === "trackingId") {
      // Validate tracking ID format: XXXX-XXXX (8 characters without dashes)
      const cleanId = searchTerm.replaceAll("-", "");
      if (cleanId.length !== 8 || !/^[A-Z0-9]{8}$/.test(cleanId)) {
        setValidationError(t("search.invalidFormat"));
        return false;
      }
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(searchTerm)) {
        setValidationError(t("search.invalidFormat"));
        return false;
      }
    }

    return true;
  };

  const buildSearchUrl = (searchTerm: string, searchType: "trackingId" | "email"): string => {
    if (searchType === "trackingId") {
      // Construct full tracking ID with TRK- prefix
      const cleanId = searchTerm.replaceAll("-", "");
      const fullTrackingId = `TRK-${cleanId.slice(0, 4)}-${cleanId.slice(4, 8)}`;
      return `/api/reports?trackingId=${encodeURIComponent(fullTrackingId)}`;
    } else {
      return `/api/reports?email=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  const updateReportsWithNewData = (newReports: Report[]) => {
    setReports((prevReports) => {
      const existingIds = new Set(prevReports.map((r) => r.id));
      const filteredNewReports = newReports.filter((r: Report) => !existingIds.has(r.id));
      const combinedReports = [...prevReports, ...filteredNewReports];
      // Sort by createdAt descending (most recent first)
      return combinedReports.toSorted(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  };

  const saveTrackingIdsToStorage = (reports: Report[]) => {
    try {
      const storedIds = localStorage.getItem(STORAGE_KEY);
      const ids = storedIds ? JSON.parse(storedIds) : [];

      // Extract tracking IDs from the reports
      const newTrackingIds = reports
        .map((report: Report) => report.trackingId)
        .filter((id: string) => id && !ids.includes(id));

      // Add new tracking IDs if any
      if (newTrackingIds.length > 0) {
        const updatedIds = [...ids, ...newTrackingIds];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));
        setMyTrackingIds(updatedIds);
      }
    } catch (e) {
      console.error("Failed to save tracking ID to localStorage", e);
    }
  };

  const searchReports = async () => {
    if (!validateInput()) {
      return;
    }

    setLoading(true);
    setError("");
    setValidationError("");
    setSearched(true);

    try {
      const url = buildSearchUrl(searchTerm, searchType);
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.length === 0) {
          setError(t("noResults"));
        } else {
          updateReportsWithNewData(data);
          saveTrackingIdsToStorage(data);
        }
      } else {
        setError(t("noResults"));
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchReports();
    }
  };

  const getResultsTitle = (
    reports: Report[],
    myTrackingIds: string[],
    searched: boolean
  ): string => {
    const isSaved = myTrackingIds.length > 0 && !searched;
    const isFew = reports.length <= 2;

    if (isSaved) {
      return isFew
        ? `${t("results.savedTitle")} (${reports.length})`
        : `${t("results.recentSavedTitle")} (${reports.length} ${t("results.total")})`;
    } else {
      return isFew
        ? `${t("results.title")} (${reports.length})`
        : `${t("results.recentTitle")} (${reports.length} ${t("results.total")})`;
    }
  };

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
          changelog: tNav("changelog"),
        }}
      />

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-stone-100">{t("title")}</h1>
          <p className="text-stone-400">{t("subtitle")}</p>
        </div>

        {/* Search Form */}
        <Card className="mb-6 border-stone-800 bg-stone-900/60 backdrop-blur-sm">
          <CardHeader className="mb-2">
            <CardTitle className="text-stone-100">
              {myTrackingIds.length > 0 ? t("search.searchAnother") : t("search.searchTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Type Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={searchType === "trackingId" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSearchType("trackingId");
                  setSearchTerm("");
                  setValidationError("");
                }}
                className={searchType === "trackingId" ? "" : "text-stone-400"}
              >
                {t("search.searchType.trackingId")}
              </Button>
              <Button
                type="button"
                variant={searchType === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSearchType("email");
                  setSearchTerm("");
                  setValidationError("");
                }}
                className={searchType === "email" ? "" : "text-stone-400"}
              >
                {t("search.searchType.email")}
              </Button>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-1">
                {searchType === "trackingId" ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-stone-100 font-mono font-semibold">TRK-</span>
                    </div>
                    <Input
                      id="search"
                      type="text"
                      placeholder={t("search.placeholder")}
                      value={searchTerm}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyUp={handleKeyPress}
                      className="pl-16 font-mono text-stone-100 tracking-wider"
                      maxLength={9}
                    />
                  </div>
                ) : (
                  <Input
                    id="search"
                    type="email"
                    placeholder={t("search.placeholderEmail")}
                    value={searchTerm}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyUp={handleKeyPress}
                  />
                )}

                <p className="text-xs text-stone-400 mt-2">{t("search.hint")}</p>
              </div>
              <div className="flex items-end">
                <Button onClick={searchReports} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? t("search.searching") : t("search.button")}
                </Button>
              </div>
            </div>

            {validationError && (
              <Alert className="mt-4 border-amber-800 bg-amber-950/50">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200">{validationError}</AlertDescription>
              </Alert>
            )}

            {error && !validationError && (
              <Alert className="mt-4 border-red-800 bg-red-950/50">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm text-stone-400">{t("loading")}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && reports.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-stone-100">
                {getResultsTitle(reports, myTrackingIds, searched)}
              </h2>
              {reports.length > 2 && (
                <Link href={`/${locale}/status/all`}>
                  <Button variant="outline" size="sm" className="text-stone-400">
                    {t("results.viewAll")}
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {reports.slice(0, 2).map((report) => {
                const TypeIcon = typeIcons[report.type];
                return (
                  <Card
                    key={report.id}
                    className="border-stone-800 bg-stone-900/60 backdrop-blur-sm"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <TypeIcon className="w-5 h-5 text-stone-400" />
                          <div>
                            <CardTitle className="text-stone-100 text-lg">{report.title}</CardTitle>
                            <p className="text-sm text-stone-400 mt-1">
                              {t("results.submittedOn")}{" "}
                              {new Date(report.createdAt).toLocaleDateString()}{" "}
                              {new Date(report.createdAt).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={priorityColors[report.priority]}>
                            {report.priority}
                          </Badge>
                          <Badge className={statusColors[report.status]}>
                            {statusLabels[report.status]}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-stone-300 mb-4">{report.description}</p>
                      <div className="text-sm text-stone-400 space-y-1">
                        <div>
                          <span className="font-medium">{t("results.trackingId")}</span>{" "}
                          <span className="font-mono text-stone-100">{report.trackingId}</span>
                        </div>
                        <div>
                          {t("results.lastUpdated")}{" "}
                          {new Date(report.updatedAt).toLocaleDateString()}{" "}
                          {new Date(report.updatedAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
