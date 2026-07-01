"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { findActiveLabel, type AdminBadgeKey } from "@/components/admin/admin-nav";
import { logError } from "@/lib/logger";

/**
 * Admin chrome: a persistent left rail on desktop, a slide-out sheet on mobile,
 * and a ledger-ruled content well — the redaction/payslip language applied to
 * the back office. Accepts server-rendered children.
 */
export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<AdminBadgeKey, number | null>>({
    pendingReview: null,
    openReports: null,
  });

  // Fetch the sidebar counts once per navigation, in the shell, so the desktop
  // rail and the mobile sheet share a single request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          fetch("/api/admin/anomaly-stats"),
          fetch("/api/reports?status=TODO"),
        ]);
        const stats = statsRes.ok ? await statsRes.json() : null;
        const reports = reportsRes.ok ? await reportsRes.json() : null;
        if (cancelled) return;
        setBadges({
          pendingReview: stats ? (stats.pending ?? 0) + (stats.needsReview ?? 0) : null,
          openReports: Array.isArray(reports) ? reports.length : null,
        });
      } catch (error) {
        logError("Failed to load admin sidebar badges", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="lp-ledger relative min-h-screen bg-background text-foreground">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <AdminSidebar badges={badges} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-md p-1.5 text-foreground transition-colors hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          >
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <AdminSidebar badges={badges} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-display text-sm font-semibold">{findActiveLabel(pathname)}</span>
      </div>

      {/* Content well */}
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}
