import { cn } from "@/lib/utils";

/**
 * Admin page header — the same mono-eyebrow + Bricolage-title opening as the
 * front office's PageHeader, but sized for a working tool (not a hero).
 * `actions` renders on the right (buttons, filters).
 */
export function AdminPageHeader({
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
    <header className={cn("mb-8 md:mb-10", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2.5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 bg-brand" aria-hidden="true" />
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.02em] text-foreground md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
