"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SalaryEntry } from "@/lib/db/schema";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { CommentSection } from "@/components/comment-thread";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { shouldDisplayField } from "@/lib/salary-config";
import { createFieldConfigs } from "@/lib/field-configs";
import {
  getFieldDisplayValue,
  getCurrencySymbol,
  createCityDisplayFormatter,
} from "@/lib/utils/format.utils";
import { useSalaryDisplay, formatSalaryWithPreferences } from "@/contexts/salary-display-context";
import {
  ArrowLeft,
  User,
  Briefcase,
  Coins,
  MapPin,
  Calendar,
  Clock,
  Building,
  TrendingUp,
  Gift,
  FileText,
  ShieldCheck,
} from "lucide-react";

interface Comment {
  id: number;
  externalId: string | null;
  body: string;
  author: string | null;
  score: number | null;
  createdAt: string | Date;
  depth: number;
  parentId: number | null;
  replies: Comment[];
}

export function EntryDetailClient({
  entry,
  locale,
}: Readonly<{
  entry: SalaryEntry;
  locale: string;
}>) {
  const router = useRouter();
  const t = useTranslations("entryDetail");
  const tAdd = useTranslations("add");
  const tNav = useTranslations("nav");
  const tUi = useTranslations("ui");
  const formatCityDisplay = createCityDisplayFormatter(tUi);

  const { preferences } = useSalaryDisplay();
  const symbol = getCurrencySymbol(preferences.currency);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const formatDate = (date: Date): string => {
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

  // Helper to check if field should be displayed for this entry's country
  const shouldShow = (fieldName: string): boolean => {
    if (!entry.country) return true; // Show all fields if country is unknown
    return shouldDisplayField(entry.country, fieldName);
  };

  // Get field configurations for display labels
  const fieldConfigs = createFieldConfigs(tAdd);

  // Helper to get review status badge props
  const getReviewStatusBadge = () => {
    if (!entry.reviewStatus) return null;

    const statusMap = {
      APPROVED: {
        variant: "default" as const,
        text: t("reviewStatus.approved"),
        tooltip: t("reviewStatus.tooltip.approved"),
      },
      PENDING: {
        variant: "secondary" as const,
        text: t("reviewStatus.pendingReview"),
        tooltip: t("reviewStatus.tooltip.pendingReview"),
      },
      NEEDS_REVIEW: {
        variant: "destructive" as const,
        text: t("reviewStatus.needsReview"),
        tooltip: t("reviewStatus.tooltip.needsReview"),
      },
      REJECTED: {
        variant: "destructive" as const,
        text: t("reviewStatus.rejected"),
        tooltip: t("reviewStatus.tooltip.rejected"),
      },
    };

    const status = statusMap[entry.reviewStatus as keyof typeof statusMap];
    if (!status) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={status.variant} className="cursor-help">
              <ShieldCheck className="mr-1 h-3 w-3" />
              {status.text}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Fetch comments if entry has a source (external scrape)
  useEffect(() => {
    const fetchComments = async () => {
      if (!entry.isManualEntry && entry.source) {
        setCommentsLoading(true);
        try {
          const response = await fetch(`/api/entries/${entry.id}/comments`);
          if (response.ok) {
            const data = await response.json();
            setComments(data.comments || []);
            setCommentCount(data.totalCount || 0);
          }
        } catch (error) {
          console.error("Error fetching comments:", error);
        } finally {
          setCommentsLoading(false);
        }
      }
    };

    fetchComments();
  }, [entry.id, entry.isManualEntry, entry.source]);

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-700 sticky top-0 z-50">
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
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 text-stone-300 hover:text-stone-100"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToDashboard")}
        </Button>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-100 mb-3">
            {entry.jobTitle || t("untitled")}
          </h1>
          <div className="flex flex-wrap gap-2">
            {entry.country && (
              <Badge variant="outline" className="border-stone-600 text-stone-300">
                <MapPin className="mr-1 h-3 w-3" />
                {formatCityDisplay(entry.country, entry.workCity)}
              </Badge>
            )}
            {entry.sector && (
              <Badge variant="outline" className="border-stone-600 text-stone-300">
                <Briefcase className="mr-1 h-3 w-3" />
                {entry.sector}
              </Badge>
            )}
            <Badge variant="outline" className="border-stone-600 text-stone-300">
              <Calendar className="mr-1 h-3 w-3" />
              {formatDate(entry.createdAt)}
            </Badge>
            {getReviewStatusBadge()}
          </div>
        </div>

        {/* Salary Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-stone-800 border-stone-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-400 flex items-center">
                <Coins className="mr-2 h-4 w-4" />
                {t("grossSalary", { symbol })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-stone-100">
                {formatSalaryWithPreferences(
                  entry.grossSalary,
                  entry.currency,
                  false,
                  preferences.currency,
                  preferences.period,
                  locale,
                  false
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-800 border-stone-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-400 flex items-center">
                <Coins className="mr-2 h-4 w-4" />
                {t("netSalary", { symbol })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-stone-100">
                {formatSalaryWithPreferences(
                  entry.netSalary,
                  entry.currency,
                  false,
                  preferences.currency,
                  preferences.period,
                  locale,
                  false
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-800 border-stone-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-400 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                {t("netCompensation", { symbol })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-stone-100">
                {formatSalaryWithPreferences(
                  entry.netCompensation,
                  entry.currency,
                  false,
                  preferences.currency,
                  preferences.period,
                  locale,
                  false
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <Card className="mb-6 bg-stone-800 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-stone-100 flex items-center">
              <User className="mr-2 h-5 w-5" />
              {t("personalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label={t("age")}
                value={
                  entry.age !== null && entry.age !== undefined
                    ? `${entry.age} ${t("years")}`
                    : undefined
                }
              />
              <InfoItem
                label={t("education")}
                value={getFieldDisplayValue("education", entry.education, fieldConfigs, tAdd)}
              />
              <InfoItem
                label={t("workExperience")}
                value={
                  entry.workExperience !== null && entry.workExperience !== undefined
                    ? `${entry.workExperience} ${t("years")}`
                    : undefined
                }
              />
              <InfoItem
                label={t("civilStatus")}
                value={getFieldDisplayValue("civilStatus", entry.civilStatus, fieldConfigs, tAdd)}
              />
              <InfoItem label={t("dependents")} value={entry.dependents?.toString()} />
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card className="mb-6 bg-stone-800 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-stone-100 flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              {t("jobInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label={t("jobTitle")} value={entry.jobTitle} />
              <InfoItem
                label={t("sector")}
                value={getFieldDisplayValue("sector", entry.sector, fieldConfigs, tAdd)}
              />
              <InfoItem
                label={t("seniority")}
                value={
                  entry.seniority !== null && entry.seniority !== undefined
                    ? `${entry.seniority} ${t("years")}`
                    : undefined
                }
              />
              <InfoItem
                label={t("employeeCount")}
                value={getFieldDisplayValue(
                  "employeeCount",
                  entry.employeeCount,
                  fieldConfigs,
                  tAdd
                )}
              />
              <InfoItem
                label={t("multinational")}
                value={
                  entry.multinational !== null
                    ? entry.multinational
                      ? t("yes")
                      : t("no")
                    : undefined
                }
              />
            </div>
            {entry.jobDescription && (
              <div className="mt-4 pt-4 border-t border-stone-700">
                <p className="text-sm font-medium text-stone-400 mb-2">{t("jobDescription")}</p>
                <p className="text-stone-100">{entry.jobDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Schedule */}
        <Card className="mb-6 bg-stone-800 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-stone-100 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              {t("workSchedule")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label={t("officialHours")}
                value={
                  entry.officialHours !== null && entry.officialHours !== undefined
                    ? `${entry.officialHours} ${t("hoursPerWeek")}`
                    : undefined
                }
              />
              <InfoItem
                label={t("averageHours")}
                value={
                  entry.averageHours !== null && entry.averageHours !== undefined
                    ? `${entry.averageHours} ${t("hoursPerWeek")}`
                    : undefined
                }
              />
              <InfoItem
                label={t("vacationDays")}
                value={
                  entry.vacationDays !== null && entry.vacationDays !== undefined
                    ? `${entry.vacationDays} ${t("days")}`
                    : undefined
                }
              />
              <InfoItem
                label={t("teleworkDays")}
                value={
                  entry.teleworkDays !== null && entry.teleworkDays !== undefined
                    ? `${entry.teleworkDays} ${t("daysPerWeek")}`
                    : undefined
                }
              />
              <InfoItem label={t("shiftDescription")} value={entry.shiftDescription} />
              <InfoItem label={t("onCall")} value={entry.onCall} />
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mb-6 bg-stone-800 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-stone-100 flex items-center">
              <Gift className="mr-2 h-5 w-5" />
              {t("benefits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shouldShow("thirteenthMonth") && (
                <InfoItem
                  label={t("thirteenthMonth")}
                  value={getFieldDisplayValue(
                    "thirteenthMonth",
                    entry.thirteenthMonth,
                    fieldConfigs,
                    tAdd
                  )}
                />
              )}
              {shouldShow("mealVouchers") && (
                <InfoItem
                  label={t("mealVouchers", { symbol })}
                  value={
                    entry.mealVouchers !== null && entry.mealVouchers !== undefined
                      ? formatSalaryWithPreferences(
                          entry.mealVouchers,
                          entry.currency,
                          false,
                          preferences.currency,
                          preferences.period,
                          locale,
                          false
                        )
                      : undefined
                  }
                />
              )}
              {shouldShow("ecoCheques") && (
                <InfoItem
                  label={t("ecoCheques", { symbol })}
                  value={
                    entry.ecoCheques !== null && entry.ecoCheques !== undefined
                      ? formatSalaryWithPreferences(
                          entry.ecoCheques,
                          entry.currency,
                          false,
                          preferences.currency,
                          preferences.period,
                          locale,
                          false
                        )
                      : undefined
                  }
                />
              )}
              {shouldShow("groupInsurance") && (
                <InfoItem label={t("groupInsurance")} value={entry.groupInsurance} />
              )}
              {shouldShow("otherInsurances") && (
                <InfoItem label={t("otherInsurances")} value={entry.otherInsurances} />
              )}
            </div>
            {shouldShow("otherBenefits") && entry.otherBenefits && (
              <div className="mt-4 pt-4 border-t border-stone-700">
                <p className="text-sm font-medium text-stone-400 mb-2">{t("otherBenefits")}</p>
                <p className="text-stone-100">{entry.otherBenefits}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Commute */}
        <Card className="mb-6 bg-stone-800 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-stone-100 flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              {t("locationCommute")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label={t("workCity")} value={entry.workCity} />
              <InfoItem
                label={t("commuteDistance")}
                value={
                  entry.commuteDistance !== null && entry.commuteDistance !== undefined
                    ? `${entry.commuteDistance} km`
                    : undefined
                }
              />
              <InfoItem label={t("commuteMethod")} value={entry.commuteMethod} />
              <InfoItem label={t("commuteCompensation")} value={entry.commuteCompensation} />
            </div>
          </CardContent>
        </Card>

        {/* Work Environment */}
        <Card className="mb-6 bg-stone-800 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-stone-100 flex items-center">
              <Building className="mr-2 h-5 w-5" />
              {t("workEnvironment")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label={t("dayOffEase")}
                value={getFieldDisplayValue("dayOffEase", entry.dayOffEase, fieldConfigs, tAdd)}
              />
              <InfoItem
                label={t("stressLevel")}
                value={getFieldDisplayValue("stressLevel", entry.stressLevel, fieldConfigs, tAdd)}
              />
              <InfoItem label={t("reports")} value={entry.reports?.toString()} />
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        {entry.extraNotes && (
          <Card className="mb-6 bg-stone-800 border-stone-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-stone-100 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                {t("additionalNotes")}
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

        {/* Comments Section - Only for external sources */}
        {!entry.isManualEntry && entry.source && (
          <div className="mb-6">
            <CommentSection
              comments={comments}
              totalCount={commentCount}
              isLoading={commentsLoading}
              sourceUrl={entry.sourceUrl}
              source={entry.source}
            />
          </div>
        )}
      </main>
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
