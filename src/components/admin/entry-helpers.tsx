import { cn } from "@/lib/utils";

/** Format a salary/amount as whole-euro currency, or "N/A" when missing. */
export function formatCurrency(amount: number | null | undefined, currency: string | null = "EUR") {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Anomaly-risk chip on a single brand scale (no rainbow of colors). */
export function RiskChip({ score }: Readonly<{ score: number | null }>) {
  if (score == null) return null;
  const label = score >= 70 ? "HIGH" : score >= 30 ? "MED" : "LOW";
  const cls =
    score >= 70
      ? "border-brand text-brand bg-brand/10"
      : score >= 30
        ? "border-border text-foreground"
        : "border-transparent text-muted-foreground";
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider tabular-nums",
        cls
      )}
    >
      {label} · {Math.round(score)}
    </span>
  );
}

/** Review-status chip: brand for needs-review, destructive for rejected, muted otherwise. */
export function StatusBadge({ status }: Readonly<{ status: string }>) {
  const cls =
    status === "NEEDS_REVIEW"
      ? "border-brand/40 text-brand"
      : status === "REJECTED"
        ? "border-destructive/40 text-destructive"
        : "border-border text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-block rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        cls
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
