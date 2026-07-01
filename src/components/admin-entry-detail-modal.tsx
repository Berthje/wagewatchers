"use client";

import { useState, useEffect } from "react";
import type { SalaryEntry } from "@/lib/db/schema";
import { logError } from "@/lib/logger";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { AnomalyDossier } from "@/components/admin/anomaly-dossier";
import {
  User,
  Briefcase,
  Coins,
  MapPin,
  Clock,
  Building,
  Gift,
  FileText,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface EntryReport {
  id: number;
  reason?: string | null;
  createdAt: string;
  ipAddress?: string | null;
}

interface AdminEntryDetailModalProps {
  readonly entryId: number;
  readonly entry: SalaryEntry | null;
  readonly isLoading: boolean;
  readonly onClose: () => void;
}

function formatCurrency(amount: number | null, currency: string | null = "EUR") {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}

function Section({
  title,
  icon: Icon,
  children,
}: Readonly<{ title: string; icon: React.ElementType; children: React.ReactNode }>) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoItem({
  label,
  value,
}: Readonly<{ label: string; value: string | number | null | undefined }>) {
  const displayValue = value == null || value === "" ? "—" : value;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{displayValue}</p>
    </div>
  );
}

export function AdminEntryDetailModal({
  entryId,
  entry,
  isLoading,
  onClose,
}: Readonly<AdminEntryDetailModalProps>) {
  const [reports, setReports] = useState<EntryReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (entry && entry.reportCount && entry.reportCount > 0) {
      setReportsLoading(true);
      fetch(`/api/entries/${entry.id}/report`)
        .then((res) => res.json())
        .then((data) => setReports(data.reports || []))
        .catch((error) => logError("Error fetching reports", error, { entryId: entry.id }))
        .finally(() => setReportsLoading(false));
    } else {
      setReports([]);
    }
  }, [entry]);

  return (
    <Sheet
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">
            {isLoading ? "Loading…" : entry?.jobTitle || "Entry details"}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <p className="py-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Loading entry…
          </p>
        ) : entry ? (
          <div className="mt-6 space-y-5">
            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2">
              {entry.country && (
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                  <MapPin className="mr-1 h-3 w-3" />
                  {entry.country}
                  {entry.workCity ? ` · ${entry.workCity}` : ""}
                </Badge>
              )}
              {entry.sector && (
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                  <Briefcase className="mr-1 h-3 w-3" />
                  {entry.sector}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {entry.reviewStatus}
              </Badge>
              {entry.reportCount && entry.reportCount > 0 ? (
                <Badge
                  variant="outline"
                  className="border-destructive/40 font-mono text-[10px] uppercase tracking-wider text-destructive"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {entry.reportCount} report{entry.reportCount !== 1 ? "s" : ""}
                </Badge>
              ) : null}
            </div>

            {/* Salary highlights */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Gross", value: entry.grossSalary },
                { label: "Net", value: entry.netSalary },
                { label: "Net comp.", value: entry.netCompensation },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                  <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" />
                    {s.label}
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
                    {formatCurrency(s.value, entry.currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Anomaly dossier */}
            <Section title="Why flagged" icon={Activity}>
              <AnomalyDossier entryId={entryId} />
            </Section>

            {/* Personal */}
            <Section title="Personal" icon={User}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Age" value={entry.age != null ? `${entry.age} years` : undefined} />
                <InfoItem label="Education" value={entry.education} />
                <InfoItem
                  label="Work experience"
                  value={entry.workExperience != null ? `${entry.workExperience} years` : undefined}
                />
                <InfoItem label="Civil status" value={entry.civilStatus} />
                <InfoItem label="Dependents" value={entry.dependents?.toString()} />
              </div>
            </Section>

            {/* Job */}
            <Section title="Job" icon={Briefcase}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Job title" value={entry.jobTitle} />
                <InfoItem label="Sector" value={entry.sector} />
                <InfoItem
                  label="Seniority"
                  value={entry.seniority != null ? `${entry.seniority} years` : undefined}
                />
                <InfoItem label="Employee count" value={entry.employeeCount} />
                <InfoItem
                  label="Multinational"
                  value={entry.multinational == null ? undefined : entry.multinational ? "Yes" : "No"}
                />
              </div>
              {entry.jobDescription && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Job description
                  </p>
                  <p className="text-sm text-foreground">{entry.jobDescription}</p>
                </div>
              )}
            </Section>

            {/* Schedule */}
            <Section title="Work schedule" icon={Clock}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem
                  label="Official hours"
                  value={entry.officialHours != null ? `${entry.officialHours} h/week` : undefined}
                />
                <InfoItem
                  label="Average hours"
                  value={entry.averageHours != null ? `${entry.averageHours} h/week` : undefined}
                />
                <InfoItem
                  label="Vacation days"
                  value={entry.vacationDays != null ? `${entry.vacationDays} days` : undefined}
                />
                <InfoItem
                  label="Telework"
                  value={entry.teleworkDays != null ? `${entry.teleworkDays} days/week` : undefined}
                />
                <InfoItem label="Shift" value={entry.shiftDescription} />
                <InfoItem label="On call" value={entry.onCall} />
              </div>
            </Section>

            {/* Benefits */}
            <Section title="Benefits" icon={Gift}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="13th month" value={entry.thirteenthMonth} />
                <InfoItem
                  label="Meal vouchers"
                  value={
                    entry.mealVouchers != null
                      ? formatCurrency(entry.mealVouchers, entry.currency)
                      : undefined
                  }
                />
                <InfoItem
                  label="Eco cheques"
                  value={
                    entry.ecoCheques != null
                      ? formatCurrency(entry.ecoCheques, entry.currency)
                      : undefined
                  }
                />
                <InfoItem label="Group insurance" value={entry.groupInsurance} />
                <InfoItem label="Other insurances" value={entry.otherInsurances} />
              </div>
              {entry.otherBenefits && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Other benefits
                  </p>
                  <p className="text-sm text-foreground">{entry.otherBenefits}</p>
                </div>
              )}
            </Section>

            {/* Location */}
            <Section title="Location & commute" icon={MapPin}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Work city" value={entry.workCity} />
                <InfoItem
                  label="Commute distance"
                  value={entry.commuteDistance != null ? `${entry.commuteDistance} km` : undefined}
                />
                <InfoItem label="Commute method" value={entry.commuteMethod} />
                <InfoItem label="Commute compensation" value={entry.commuteCompensation} />
              </div>
            </Section>

            {/* Environment */}
            <Section title="Work environment" icon={Building}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Day-off ease" value={entry.dayOffEase} />
                <InfoItem label="Stress level" value={entry.stressLevel} />
                <InfoItem label="Direct reports" value={entry.reports?.toString()} />
              </div>
            </Section>

            {/* Reports */}
            {entry.reportCount && entry.reportCount > 0 ? (
              <Section title={`Reports (${entry.reportCount})`} icon={AlertTriangle}>
                {reportsLoading ? (
                  <p className="font-mono text-xs text-muted-foreground">Loading reports…</p>
                ) : reports.length > 0 ? (
                  <div className="space-y-2">
                    {reports.map((report, index) => (
                      <div key={report.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                          <span>Report #{index + 1}</span>
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-foreground">
                          {report.reason || <span className="italic text-muted-foreground">No reason provided</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">No report details found</p>
                )}
              </Section>
            ) : null}

            {/* Notes */}
            {entry.extraNotes && (
              <Section title="Additional notes" icon={FileText}>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: entry.extraNotes }}
                />
              </Section>
            )}

            {/* Submission */}
            <Section title="Submission" icon={Clock}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Submitted" value={formatDate(entry.createdAt)} />
                <InfoItem
                  label="Source"
                  value={entry.isManualEntry ? "Manual entry" : entry.source || "Unknown"}
                />
                {entry.reviewedAt && <InfoItem label="Reviewed at" value={formatDate(entry.reviewedAt)} />}
              </div>
            </Section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
