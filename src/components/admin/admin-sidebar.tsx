"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/logger";
import { adminNav, isNavItemActive, type AdminBadgeKey } from "@/components/admin/admin-nav";

interface AdminSidebarProps {
  /** Live counts keyed by badge, fetched once by the shell. null = not loaded. */
  badges: Record<AdminBadgeKey, number | null>;
  /** Called when a nav link is clicked (used to close the mobile sheet). */
  onNavigate?: () => void;
}

export function AdminSidebar({ badges, onNavigate }: Readonly<AdminSidebarProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (error) {
      logError("Logout error", error);
    }
    localStorage.removeItem("adminAuthenticated");
    router.push("/admin/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <span className="text-sm font-bold text-background">WW</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold text-sidebar-foreground">
            WageWatchers
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Admin
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {adminNav.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isNavItemActive(item, pathname);
                const Icon = item.icon;
                const badgeValue = item.badge ? badges[item.badge] : null;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-[13px] tracking-tight transition-colors",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badgeValue != null && badgeValue > 0 && (
                        <span
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                            item.badge === "pendingReview"
                              ? "border-brand/40 text-brand"
                              : "border-border text-muted-foreground"
                          )}
                        >
                          {badgeValue}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between px-2 pb-2">
          <Link
            href="/en"
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View site
          </Link>
          <button
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Sun className={cn("h-4 w-4", mounted && isDark ? "block" : "hidden")} />
            <Moon className={cn("h-4 w-4", mounted && isDark ? "hidden" : "block")} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 font-mono text-[13px] tracking-tight text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}
