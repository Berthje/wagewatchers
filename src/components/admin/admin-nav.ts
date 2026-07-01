import { LayoutDashboard, ClipboardCheck, Flag, Database, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminBadgeKey = "pendingReview" | "openReports";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Which live count (if any) to show as a badge. */
  badge?: AdminBadgeKey;
  /** Active only on an exact path match (used for the dashboard root). */
  exact?: boolean;
}

export interface AdminNavSection {
  label: string;
  items: AdminNavItem[];
}

/**
 * The admin navigation model. Adding a section or item here is all it takes to
 * extend the sidebar — the shell renders straight from this array.
 */
export const adminNav: AdminNavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Command Center", href: "/admin", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Moderation",
    items: [
      {
        label: "Review Queue",
        href: "/admin/review",
        icon: ClipboardCheck,
        badge: "pendingReview",
      },
      { label: "Reported", href: "/admin/reported", icon: Flag },
      { label: "All Entries", href: "/admin/entries", icon: Database },
      { label: "Reports", href: "/admin/reports", icon: MessageSquare, badge: "openReports" },
    ],
  },
];

/** Whether a nav item is active for the given pathname. */
export function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** The label of the active nav item — used as the mobile top-bar title. */
export function findActiveLabel(pathname: string): string {
  // Longest matching href wins, so /admin/entries beats the /admin root.
  let best: { label: string; len: number } | null = null;
  for (const section of adminNav) {
    for (const item of section.items) {
      if (isNavItemActive(item, pathname) && (!best || item.href.length > best.len)) {
        best = { label: item.label, len: item.href.length };
      }
    }
  }
  return best?.label ?? "Admin";
}
