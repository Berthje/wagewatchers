import { cn } from "@/lib/utils";

/**
 * A figure that starts under an ink redaction bar and wipes clean on mount —
 * the payslip motif applied to review. Use `redact` only for entries that are
 * actually flagged, so the reveal *means* "this was hidden because it's
 * suspicious" rather than being decoration.
 */
export function RedactedFigure({
  value,
  redact,
  delay = 0,
  className,
}: Readonly<{
  value: string;
  redact: boolean;
  delay?: number;
  className?: string;
}>) {
  if (!redact) {
    return <span className={className}>{value}</span>;
  }
  return (
    <span className={cn("lp-reveal", className)}>
      <span>{value}</span>
      <span className="lp-reveal__bar" style={{ animationDelay: `${delay}s` }} aria-hidden="true" />
    </span>
  );
}
