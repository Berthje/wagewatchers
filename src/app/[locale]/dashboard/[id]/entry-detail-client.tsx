"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SalaryEntry } from "@/lib/db/schema";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { CommentSection } from "@/components/comment-thread";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { shouldDisplayField } from "@/lib/salary-config";
import { createFieldConfigs } from "@/lib/field-configs";
import { BENEFIT_DEFINITIONS } from "@/lib/benefits-catalog";
import { DEGREE_DEFINITIONS } from "@/lib/degrees-catalog";
import { getPrimaryComp } from "@/lib/utils/compensation.utils";
import {
  getFieldDisplayValue,
  getCurrencySymbol,
  createCityDisplayFormatter,
} from "@/lib/utils/format.utils";
import { useSalaryDisplay, formatSalaryWithPreferences } from "@/contexts/salary-display-context";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/logger";
import {
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Gift,
  FileText,
  ShieldCheck,
  Flag,
  Car,
  PlugZap,
  Fuel,
  Sparkles,
  Globe,
  Smile,
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

interface EntryBenefitRow {
  benefitKey: string;
  valueNumeric: number | null;
  valueText: string | null;
  currency: string | null;
}

const BENEFIT_DEF_BY_KEY = new Map(BENEFIT_DEFINITIONS.map((d) => [d.key, d]));
const CATEGORY_ORDER = ["cash", "insurance", "retirement", "mobility", "timeOff", "other"] as const;

export function EntryDetailClient({
  entry,
  benefits = [],
  locale,
}: Readonly<{
  entry: SalaryEntry;
  benefits?: EntryBenefitRow[];
  locale: string;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("entryDetail");
  const tAdd = useTranslations("add");
  const tUi = useTranslations("ui");
  const formatCityDisplay = createCityDisplayFormatter(tUi);

  const { preferences } = useSalaryDisplay();
  const symbol = getCurrencySymbol(preferences.currency);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const fieldConfigs = createFieldConfigs(tAdd);
  const workerType = entry.workerType ?? "whiteCollar";

  // Money formatter honouring display currency + period (monthly source amounts).
  const money = (amount: number | null | undefined) =>
    formatSalaryWithPreferences(
      amount ?? null,
      entry.currency,
      false,
      preferences.currency,
      preferences.period,
      locale,
      false
    );
  // Plain currency amount that should NOT be period-converted (rates, vouchers).
  const flat = (amount: number) => `${symbol}${Math.round(amount).toLocaleString()}`;

  const formatDate = (date: Date): string => {
    const dateObj = new Date(date);
    return `${dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} at ${dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const shouldShow = (fieldName: string): boolean =>
    !entry.country || shouldDisplayField(entry.country, fieldName);

  const degreeName = entry.degreeId
    ? (DEGREE_DEFINITIONS.find((d) => d.id === entry.degreeId)?.name ?? null)
    : null;

  const getReviewStatusBadge = () => {
    if (!entry.reviewStatus) return null;
    const statusMap = {
      APPROVED: { variant: "default" as const, key: "approved" },
      PENDING: { variant: "secondary" as const, key: "pendingReview" },
      NEEDS_REVIEW: { variant: "destructive" as const, key: "needsReview" },
      REJECTED: { variant: "destructive" as const, key: "rejected" },
    };
    const status = statusMap[entry.reviewStatus as keyof typeof statusMap];
    if (!status) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={status.variant} className="cursor-help">
              <ShieldCheck className="mr-1 h-3 w-3" />
              {t(`reviewStatus.${status.key}`)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t(`reviewStatus.tooltip.${status.key}`)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleReport = async () => {
    if (hasReported || isReporting) return;
    setIsReporting(true);
    setReportError(null);
    try {
      const response = await fetch(`/api/entries/${entry.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim() || undefined }),
      });
      const data = await response.json();
      if (response.ok) {
        setHasReported(true);
        setReportModalOpen(false);
        setReportReason("");
        const reported = JSON.parse(localStorage.getItem("wagewatchers_reported_entries") || "[]");
        if (!reported.includes(entry.id)) {
          reported.push(entry.id);
          localStorage.setItem("wagewatchers_reported_entries", JSON.stringify(reported));
        }
      } else {
        setReportError(data.error || "Failed to report entry");
      }
    } catch (error) {
      logError("Error reporting entry:", error, { entryId: entry.id });
      setReportError("Failed to report entry");
    } finally {
      setIsReporting(false);
    }
  };

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
          logError("Error fetching comments:", error, { entryId: entry.id });
        } finally {
          setCommentsLoading(false);
        }
      }
    };
    fetchComments();
  }, [entry.id, entry.isManualEntry, entry.source]);

  useEffect(() => {
    const reported = JSON.parse(localStorage.getItem("wagewatchers_reported_entries") || "[]");
    if (reported.includes(entry.id)) setHasReported(true);
  }, [entry.id]);

  // ── Benefits formatting ────────────────────────────────────────────────────
  const formatBenefitValue = (b: EntryBenefitRow): string | null => {
    const def = BENEFIT_DEF_BY_KEY.get(b.benefitKey);
    if (!def) return b.valueText ?? (b.valueNumeric != null ? String(b.valueNumeric) : null);
    if (def.valueType === "boolean") return null;
    if (def.valueType === "percent") return b.valueNumeric != null ? `${b.valueNumeric}%` : null;
    if (def.valueType === "enum") return b.valueText ?? null;
    if (def.valueType === "text") return b.valueText ?? null;
    // amount
    if (b.valueNumeric == null) return null;
    if (def.unit === "days") return `${b.valueNumeric} ${tAdd("benefitUnits.days")}`;
    const m = money(b.valueNumeric);
    return def.unit ? `${m} ${tAdd(`benefitUnits.${def.unit}`)}` : m;
  };
  const benefitLabel = (key: string) => {
    const k = `benefitsCatalog.${key}`;
    const label = tAdd(k);
    return label === k ? key : label;
  };

  const equityBenefit = benefits.find((b) => b.benefitKey === "equity");
  const showEquity = entry.hasEquity === true || !!equityBenefit;
  const pillBenefits = benefits.filter((b) => b.benefitKey !== "equity");
  const groupedBenefits = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: pillBenefits.filter(
      (b) => (BENEFIT_DEF_BY_KEY.get(b.benefitKey)?.category ?? "other") === cat
    ),
  })).filter((g) => g.items.length > 0);
  const hasPackage = entry.hasCompanyCar === true || showEquity || pillBenefits.length > 0;

  const primary = getPrimaryComp(entry);
  const carFuelIcon =
    entry.companyCarFuelType === "electric"
      ? PlugZap
      : entry.companyCarFuelType === "hybrid"
        ? PlugZap
        : Fuel;

  const reportAction = (
    <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={hasReported || isReporting}>
          <Flag className="mr-2 h-4 w-4" />
          {isReporting ? t("reporting") : hasReported ? t("reported") : t("reportEntry")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("reportEntry")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="report-reason" className="text-muted-foreground">
              {t("reportReasonLabel")}
            </Label>
            <Textarea
              id="report-reason"
              placeholder={t("reportReasonPlaceholder")}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleReport} disabled={isReporting}>
              {isReporting ? t("reporting") : t("reportEntry")}
            </Button>
          </div>
          {reportError && <p className="text-sm text-destructive">{reportError}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <PageShell width="lg">
      <Button
        variant="ghost"
        className="mb-4 text-muted-foreground hover:text-foreground"
        onClick={() => {
          const qs = searchParams.toString();
          router.push(`/${locale}/dashboard${qs ? `?${qs}` : ""}`);
        }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("backToDashboard")}
      </Button>

      <PageHeader title={entry.jobTitle || t("untitled")} actions={reportAction} className="mb-5" />

      {/* Identity band — worker type drives the whole record */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge className="bg-brand text-brand-foreground hover:bg-brand">
          {tAdd(`formOptions.workerType.${workerType}`)}
        </Badge>
        {entry.contractType && (
          <Badge variant="outline" className="border-border text-muted-foreground">
            {tAdd(`formOptions.contractType.${entry.contractType}`)}
            {entry.contractDurationMonths ? ` · ${entry.contractDurationMonths}m` : ""}
          </Badge>
        )}
        {entry.country && (
          <Badge variant="outline" className="border-border text-muted-foreground">
            <MapPin className="mr-1 h-3 w-3" />
            {formatCityDisplay(entry.country, entry.workCity)}
          </Badge>
        )}
        {entry.sector && (
          <Badge variant="outline" className="border-border text-muted-foreground">
            <Briefcase className="mr-1 h-3 w-3" />
            {getFieldDisplayValue("sector", entry.sector, fieldConfigs, tAdd)}
          </Badge>
        )}
        <Badge variant="outline" className="border-border text-muted-foreground">
          <Calendar className="mr-1 h-3 w-3" />
          {formatDate(entry.createdAt)}
        </Badge>
        {getReviewStatusBadge()}
      </div>

      {/* ── Compensation statement (worker-type aware) ── */}
      <Card className="mb-6 overflow-hidden border-border bg-card">
        <div className="border-b border-dashed border-border bg-muted/30 px-6 py-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {t("compensation")}
            {entry.salaryBasis ? ` · ${tAdd(`formOptions.salaryBasis.${entry.salaryBasis}`)}` : ""}
          </span>
        </div>
        <CardContent className="pt-6">
          {primary ? (
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">
                  {t(`headline.${primary.labelKey}`)}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold tracking-tight text-foreground">
                    {primary.kind === "rate" ? flat(primary.amount) : money(primary.amount)}
                  </span>
                  {primary.kind === "rate" && (
                    <span className="font-mono text-base text-muted-foreground">
                      {tAdd(`benefitUnits.${primary.unitKey}`)}
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary figures per worker type */}
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {workerType === "freelancer" && (
                  <>
                    {entry.clientDayBudget != null && (
                      <MiniStat
                        label={t("headline.clientBudget")}
                        value={`${flat(entry.clientDayBudget)} ${tAdd("benefitUnits.perDay")}`}
                      />
                    )}
                    {entry.agencyCutPercent != null && (
                      <MiniStat
                        label={t("headline.agencyCut")}
                        value={`${entry.agencyCutPercent}%`}
                      />
                    )}
                  </>
                )}
                {(workerType === "whiteCollar" ||
                  workerType === "intern" ||
                  workerType === "blueCollar") && (
                  <>
                    {entry.netSalary != null && primary.labelKey !== "netSalary" && (
                      <MiniStat label={t("netSalary", { symbol })} value={money(entry.netSalary)} />
                    )}
                    {entry.netCompensation != null && entry.netCompensation > 0 && (
                      <MiniStat
                        label={t("netCompensation", { symbol })}
                        value={money(entry.netCompensation)}
                      />
                    )}
                  </>
                )}
                {workerType === "phdResearcher" &&
                  entry.virtualGrossSalary != null &&
                  primary.labelKey !== "virtualGross" && (
                    <MiniStat
                      label={t("headline.virtualGross")}
                      value={money(entry.virtualGrossSalary)}
                    />
                  )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noCompensation")}</p>
          )}

          {/* Fixed vs variable split bar (salaried) */}
          {entry.fixedGrossSalary != null &&
            entry.variableGrossSalary != null &&
            entry.fixedGrossSalary + entry.variableGrossSalary > 0 && (
              <div className="mt-6">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {tAdd("sections.salary.fixedGrossSalary", { symbol })}:{" "}
                    {money(entry.fixedGrossSalary)}
                  </span>
                  <span>
                    {tAdd("sections.salary.variableGrossSalary", { symbol })}:{" "}
                    {money(entry.variableGrossSalary)}
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-brand"
                    style={{
                      width: `${(entry.fixedGrossSalary / (entry.fixedGrossSalary + entry.variableGrossSalary)) * 100}%`,
                    }}
                  />
                  <div className="h-full bg-brand/40" style={{ flex: 1 }} />
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* ── The package: car, equity, benefits ── */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-foreground">
            <Gift className="mr-2 h-5 w-5" />
            {t("packageTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company car callout */}
          {entry.hasCompanyCar === true && (
            <Callout icon={Car} title={tAdd("sections.benefits.hasCompanyCar")}>
              <span className="font-medium text-foreground">
                {entry.companyCarModel || tAdd("sections.benefits.hasCompanyCar")}
              </span>
              {entry.companyCarFuelType && (
                <Chip icon={carFuelIcon}>
                  {tAdd(`formOptions.carFuelType.${entry.companyCarFuelType}`)}
                </Chip>
              )}
              {entry.companyCarCardScope && (
                <Chip icon={Globe}>
                  {tAdd(`formOptions.carCardScope.${entry.companyCarCardScope}`)}
                </Chip>
              )}
            </Callout>
          )}

          {/* Equity callout */}
          {showEquity && (
            <Callout icon={Sparkles} title={tAdd("sections.benefits.hasEquity")}>
              {equityBenefit?.valueNumeric != null && (
                <span className="font-mono font-medium text-foreground">
                  {money(equityBenefit.valueNumeric)} {tAdd("benefitUnits.perYear")}
                </span>
              )}
              {equityBenefit?.valueText && <Chip>{equityBenefit.valueText}</Chip>}
            </Callout>
          )}

          {/* Catalog benefit pills, grouped by category */}
          {groupedBenefits.map((g) => (
            <div key={g.cat}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {tAdd(`benefitCategories.${g.cat}`)}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((b) => {
                  const val = formatBenefitValue(b);
                  return (
                    <span
                      key={b.benefitKey}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm"
                    >
                      <span className="text-foreground">{benefitLabel(b.benefitKey)}</span>
                      {val && <span className="font-mono text-xs text-brand">{val}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          {shouldShow("otherBenefits") && entry.otherBenefits && (
            <div className="border-t border-border pt-3">
              <p className="mb-1 text-sm font-medium text-muted-foreground">{t("otherBenefits")}</p>
              <p className="text-foreground">{entry.otherBenefits}</p>
            </div>
          )}
          {shouldShow("otherInsurances") && entry.otherInsurances && (
            <div className={cn(entry.otherBenefits ? "" : "border-t border-border pt-3")}>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                {t("otherInsurances")}
              </p>
              <p className="text-foreground">{entry.otherInsurances}</p>
            </div>
          )}

          {!hasPackage && !entry.otherBenefits && !entry.otherInsurances && (
            <p className="text-sm text-muted-foreground">{t("noBenefits")}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Profile (personal + employer) ── */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-foreground">
            <User className="mr-2 h-5 w-5" />
            {t("personalInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoItem
              label={t("age")}
              value={entry.age != null ? `${entry.age} ${t("years")}` : undefined}
            />
            <InfoItem
              label={t("workExperience")}
              value={
                entry.workExperience != null ? `${entry.workExperience} ${t("years")}` : undefined
              }
            />
            <InfoItem
              label={t("education")}
              value={getFieldDisplayValue("education", entry.education, fieldConfigs, tAdd)}
            />
            {degreeName && <InfoItem label={tAdd("sections.personal.degree")} value={degreeName} />}
            <InfoItem
              label={t("civilStatus")}
              value={getFieldDisplayValue("civilStatus", entry.civilStatus, fieldConfigs, tAdd)}
            />
            <InfoItem label={t("dependents")} value={entry.dependents?.toString()} />
            <InfoItem
              label={t("employeeCount")}
              value={getFieldDisplayValue("employeeCount", entry.employeeCount, fieldConfigs, tAdd)}
            />
            <InfoItem
              label={t("multinational")}
              value={
                entry.multinational != null ? (entry.multinational ? t("yes") : t("no")) : undefined
              }
            />
            <InfoItem
              label={tAdd("sections.employer.publiclyListed")}
              value={
                entry.publiclyListed != null
                  ? entry.publiclyListed
                    ? t("yes")
                    : t("no")
                  : undefined
              }
            />
            <InfoItem
              label={t("seniority")}
              value={entry.seniority != null ? `${entry.seniority} ${t("years")}` : undefined}
            />
          </div>
          {entry.jobDescription && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {t("jobDescription")}
              </p>
              <p className="text-foreground">{entry.jobDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Work & schedule ── */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-foreground">
            <Clock className="mr-2 h-5 w-5" />
            {t("workSchedule")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoItem
              label={t("officialHours")}
              value={
                entry.officialHours != null
                  ? `${entry.officialHours} ${t("hoursPerWeek")}`
                  : undefined
              }
            />
            <InfoItem
              label={t("averageHours")}
              value={
                entry.averageHours != null
                  ? `${entry.averageHours} ${t("hoursPerWeek")}`
                  : undefined
              }
            />
            <InfoItem
              label={t("vacationDays")}
              value={entry.vacationDays != null ? `${entry.vacationDays} ${t("days")}` : undefined}
            />
            <InfoItem
              label={t("teleworkDays")}
              value={
                entry.teleworkDays != null ? `${entry.teleworkDays} ${t("daysPerWeek")}` : undefined
              }
            />
            <InfoItem label={t("shiftDescription")} value={entry.shiftDescription} />
            <InfoItem label={t("onCall")} value={entry.onCall} />
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
          {entry.jobSatisfaction != null && (
            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Smile className="h-4 w-4" />
                  {tAdd("sections.workLife.jobSatisfaction")}
                </span>
                <span className="font-mono text-sm text-foreground">
                  {entry.jobSatisfaction}/10
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${(entry.jobSatisfaction / 10) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Location & commute ── */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-foreground">
            <MapPin className="mr-2 h-5 w-5" />
            {t("locationCommute")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entry.residenceCountry && entry.residenceCountry !== entry.country && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-sm">
              <Globe className="h-4 w-4 text-brand" />
              <span className="text-foreground">
                {t("crossBorder", { residence: entry.residenceCountry, work: entry.country ?? "" })}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoItem label={t("workCity")} value={entry.workCity} />
            {entry.workProvince && (
              <InfoItem label={tAdd("sections.commute.workProvince")} value={entry.workProvince} />
            )}
            <InfoItem
              label={t("commuteDistance")}
              value={
                entry.commuteDistance != null
                  ? `${entry.commuteDistance} ${entry.commuteUnit === "minutes" ? "min" : "km"}`
                  : undefined
              }
            />
            {entry.commuteTimeMinutes != null && (
              <InfoItem
                label={tAdd("sections.commute.commuteTimeMinutes")}
                value={`${entry.commuteTimeMinutes} min`}
              />
            )}
            <InfoItem label={t("commuteMethod")} value={entry.commuteMethod} />
            <InfoItem label={t("commuteCompensation")} value={entry.commuteCompensation} />
          </div>
        </CardContent>
      </Card>

      {entry.extraNotes && (
        <Card className="mb-6 border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-foreground">
              <FileText className="mr-2 h-5 w-5" />
              {t("additionalNotes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none text-foreground dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: entry.extraNotes }}
            />
          </CardContent>
        </Card>
      )}

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
    </PageShell>
  );
}

function MiniStat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Callout({
  icon: Icon,
  title,
  children,
}: Readonly<{ icon: React.ElementType; title: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <span className="mr-1 text-sm font-medium text-muted-foreground">{title}</span>
      {children}
    </div>
  );
}

function Chip({
  icon: Icon,
  children,
}: Readonly<{ icon?: React.ElementType; children: React.ReactNode }>) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      {children}
    </span>
  );
}

function InfoItem({
  label,
  value,
}: Readonly<{ label: string; value: string | number | null | undefined }>) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-foreground">{value == null || value === "" ? "/" : value}</p>
    </div>
  );
}
