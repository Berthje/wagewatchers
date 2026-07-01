import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Payslip-style stat cell: mono eyebrow, big tabular figure, optional sub-line.
 * When `href` is set the whole card is a link into the relevant queue.
 */
export function StatCard({
  eyebrow,
  value,
  sub,
  href,
  accent = false,
  className,
}: Readonly<{
  eyebrow: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent?: boolean;
  className?: string;
}>) {
  const inner = (
    <div
      className={cn(
        "h-full rounded-xl border border-border bg-card p-5 transition-colors",
        href && "hover:border-brand/50",
        className
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-3xl font-semibold tabular-nums md:text-4xl",
          accent ? "text-brand" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 font-mono text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
