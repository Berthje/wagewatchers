import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";

const WIDTHS = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

/**
 * Shared page frame for all user-facing pages: warm ledger-ink background
 * (matching the landing page), the shared navbar, and a centered content well.
 * Replaces the per-page `bg-linear-to-br` + hand-rolled Navbar markup.
 */
export function PageShell({
  children,
  width = "lg",
  className,
}: Readonly<{
  children: React.ReactNode;
  width?: keyof typeof WIDTHS;
  className?: string;
}>) {
  return (
    <div className="lp-ledger relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main
        className={cn("relative z-10 mx-auto w-full px-6 py-10 md:py-14", WIDTHS[width], className)}
      >
        {children}
      </main>
    </div>
  );
}
