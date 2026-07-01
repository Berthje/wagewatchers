// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilters } from "@/hooks/use-filters";
import type { SalaryEntry } from "@/lib/db/schema";

// Minimal salary entries. Salaries are stored MONTHLY in EUR.
const entries = [
  { grossSalary: 3000, netSalary: 2000, currency: "EUR", country: "BE", workCity: "Brussels" },
  { grossSalary: 5000, netSalary: 3200, currency: "EUR", country: "BE", workCity: "Antwerp" },
  { grossSalary: 8000, netSalary: 5000, currency: "EUR", country: "NL", workCity: "Amsterdam" },
] as unknown as SalaryEntry[];

type Period = "monthly" | "annual";

describe("useFilters persistence across reload", () => {
  it("keeps a max-gross filter working after preferences hydrate to annual (reload scenario)", () => {
    // On reload the URL held `maxGrossSalary=70000`, entered while viewing ANNUAL.
    // The salary-display context always mounts with the DEFAULT prefs (EUR / monthly,
    // isHydrated=false) and only loads the stored "annual" pref in a post-mount effect,
    // flipping isHydrated true in the same render.
    // Annual salaries here are 36k / 60k / 96k, so a €70k/yr ceiling must keep exactly
    // two rows. The pre-fix bug multiplied the ceiling by 12 (-> 840k), letting every
    // row through -> "results revert to showing all salaries".
    const initialFilters = { maxGrossSalary: 70000 };

    const { result, rerender } = renderHook(
      ({ period, isHydrated }: { period: Period; isHydrated: boolean }) =>
        useFilters(entries, initialFilters, "EUR", period, isHydrated),
      { initialProps: { period: "monthly" as Period, isHydrated: false } }
    );

    expect(result.current.filters.maxGrossSalary).toBe(70000);

    // Preferences finish loading from localStorage -> switch to annual + hydrated.
    act(() => {
      rerender({ period: "annual", isHydrated: true });
    });

    // The ceiling must NOT be period-converted by the hydration settle, and must
    // still exclude the €96,000/yr (8000/mo) entry.
    expect(result.current.filters.maxGrossSalary).toBe(70000);
    const filtered = result.current.filteredEntries;
    const maxAnnual = Math.max(...filtered.map((e) => (e.grossSalary as number) * 12));
    expect(maxAnnual).toBeLessThanOrEqual(70000);
    expect(filtered.length).toBe(2);
  });

  it("does not corrupt a min-gross filter when preferences hydrate (annual)", () => {
    const initialFilters = { minGrossSalary: 48000 }; // €48k/yr entered in annual view

    const { result, rerender } = renderHook(
      ({ period, isHydrated }: { period: Period; isHydrated: boolean }) =>
        useFilters(entries, initialFilters, "EUR", period, isHydrated),
      { initialProps: { period: "monthly" as Period, isHydrated: false } }
    );

    act(() => {
      rerender({ period: "annual", isHydrated: true });
    });

    expect(result.current.filters.minGrossSalary).toBe(48000);
    // €48k/yr threshold -> keeps 5000/mo (60k/yr) and 8000/mo (96k/yr), drops 3000/mo (36k/yr).
    expect(result.current.filteredEntries.length).toBe(2);
  });

  it("still converts filter values when the user switches period AFTER hydration", () => {
    // Regression guard for the live-switch feature: a genuine user-initiated period
    // change (monthly -> annual, already hydrated) must convert the value x12.
    const initialFilters = { minGrossSalary: 3000 }; // €3000/mo set while viewing monthly

    const { result, rerender } = renderHook(
      ({ period }: { period: Period }) =>
        useFilters(entries, initialFilters, "EUR", period, /* isHydrated */ true),
      { initialProps: { period: "monthly" as Period } }
    );

    expect(result.current.filters.minGrossSalary).toBe(3000);

    act(() => {
      rerender({ period: "annual" });
    });

    // €3000/mo becomes €36,000/yr so the filter stays proportionally the same.
    expect(result.current.filters.minGrossSalary).toBe(36000);
  });
});
