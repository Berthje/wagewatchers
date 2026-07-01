import { cn } from "@/lib/utils";

/**
 * Shared page header: a mono eyebrow with a brand tick, a large display title,
 * and an optional subtitle — the same opening pattern as the landing hero.
 * `actions` renders on the right (buttons, links) on wider screens.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: Readonly<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}>) {
  return (
    <header className={cn("mb-10 md:mb-12", className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-3 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 bg-brand" aria-hidden="true" />
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.03] tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
