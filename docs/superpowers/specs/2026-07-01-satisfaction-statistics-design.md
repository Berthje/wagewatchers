# Design: Satisfaction & v2-property statistics ("Beyond Pay" section)

**Date:** 2026-07-01
**Status:** Approved (design), pending implementation plan
**Author:** Layton + Claude

## Problem

The public `/statistics` page computes ~12 salary-focused charts (sectors, countries,
experience, age, tax, location, peer comparison). The v2 entry structure added several
new properties that are not yet surfaced anywhere:

- `jobSatisfaction` (integer 0–10)
- `workerType` enum: `whiteCollar | blueCollar | freelancer | intern | phdResearcher`
- `contractType` enum: `permanent | fixedTerm | interim | internship | freelance`
- `hasCompanyCar` (boolean) + `companyCarFuelType` enum: `electric | hybrid | fuel`
- `hasEquity` (boolean)
- `commuteTimeMinutes` (integer)
- `fixedGrossSalary` / `variableGrossSalary` (real, monthly)

We want statistics built around these — satisfaction as the headline — on the public
statistics page.

## Goals

- Add a **satisfaction-centered** set of 11 charts to the public `/statistics` page.
- Reuse existing infrastructure: filters, currency/period conversion, custom tooltips,
  loading skeletons, i18n, CSV/PDF export.
- Handle the reality that v2 fields are **null on the ~1,900 legacy (v1) entries** — gate
  the whole new block until enough v2 data exists, and drop under-populated buckets.

## Non-goals

- No server-side aggregation API (page already loads all entries client-side).
- No new data fetching or schema changes.
- No changes to the existing 12 charts.
- No sentiment/NLP analysis of free-text fields.

## Decisions (from brainstorming)

| Decision | Choice |
|----------|--------|
| Scope | Satisfaction-centered set (6 satisfaction + 5 structural) |
| Location | Public `/statistics` page |
| Thin-data handling | Gate the whole new section; per-bucket floor within charts |
| Architecture | **B** — pure-function compute in `lib/statistics/` + one gated section component |
| Chart set | All 11 as proposed |

## Architecture

Follows the existing client-side model. `statistics-client.tsx`
(`src/app/[locale]/statistics/statistics-client.tsx`) already fetches all entries from
`/api/entries`, filters them via `useFilters(...)`, and reads display preferences via
`useSalaryDisplay()`. The new work slots into that flow with minimal change to the client
file.

### New files

- **`src/lib/statistics/beyond-pay.ts`** — pure aggregation functions, one per chart, plus
  exported threshold constants. Salary-based functions accept a
  `getSalary: (entry: SalaryEntry) => number | null` accessor so currency/period conversion
  stays in the component and the math stays pure and unit-testable. Satisfaction/score
  functions take entries directly (unitless).
- **`src/lib/statistics/beyond-pay.test.ts`** — unit tests (drives TDD). Edge cases: empty
  set, all-null satisfaction, sub-floor buckets, single-value buckets, mixed v1/v2 rows.
- **`src/components/statistics/beyond-pay/BeyondPaySection.tsx`** — owns the gating logic,
  section heading, and responsive grid; renders the 11 chart components. Props:
  `{ entries: SalaryEntry[]; loading: boolean }`.
- **`src/components/statistics/beyond-pay/*.tsx`** — the 11 chart components, each with
  `{ data, loading }` props like the existing charts (skeleton loader, `ResponsiveContainer`,
  `CustomTooltip`, "based on N entries" caption).

### Changed files

- **`src/components/statistics/index.ts`** — export `BeyondPaySection` (and charts if needed
  elsewhere).
- **`src/types/api/statistics.types.ts`** — add new data-shape types (below).
- **`src/app/[locale]/statistics/statistics-client.tsx`** — import and render
  `<BeyondPaySection entries={filteredEntries} loading={loading} />` in a new grid slot after
  the existing charts (~line 529). Salary conversion for the section is done inside
  `BeyondPaySection` using `convertCurrency(v, entry.currency, "EUR")` →
  `convertPeriod(v, "monthly", preferences.period)`, matching the existing pattern.

## Gating & thresholds

Exported constants in `beyond-pay.ts`:

- `MIN_V2_ENTRIES = 30` — minimum count of v2 entries (`entryVersion === 2`, equivalently
  non-null `jobSatisfaction`) in the **filtered** set required to render the section.
- `MIN_BUCKET = 5` — minimum entries for a bucket (a sector, worker type, commute band,
  fuel type, contract type) to be shown within a chart.

Behavior:

- If filtered v2 count `< MIN_V2_ENTRIES`: `BeyondPaySection` renders a single quiet
  placeholder card ("More insights unlock as we collect structured entries — {n} so far"),
  not an empty gap.
- If `>= MIN_V2_ENTRIES`: render the full grid. Individual charts drop buckets below
  `MIN_BUCKET` and show a per-chart "based on N entries" caption.

## Charts

Salary values are converted (EUR → `preferences.period`) before aggregation for charts
marked "conv? yes".

| # | Chart | Viz (Recharts) | Data row shape | Conv? |
|---|-------|----------------|----------------|-------|
| 1 | Satisfaction distribution | Bar | `{ score: 0–10, count }` | no |
| 2 | Satisfaction vs pay | Composed (bar count + line median pay) | `{ score, medianSalary, count }` | yes |
| 3 | Happiest sectors | Horizontal bar | `{ sector, avgSatisfaction, count }` top N, ≥ floor | no |
| 4 | Satisfaction by worker type | Bar | `{ workerType, avgSatisfaction, count }` | no |
| 5 | Do perks help? | Grouped bar | `{ perk: "Company car" \| "Equity", withPerk, withoutPerk }` (avg sat.) | no |
| 6 | Commute vs satisfaction | Bar/line | `{ band: "0–15" \| "15–30" \| "30–60" \| "60+", avgSatisfaction, count }` | no |
| 7 | Worker-type mix | Donut (+ median pay label) | `{ workerType, count, medianSalary }` | yes |
| 8 | Contract type | Bar | `{ contractType, count, medianSalary }` | yes |
| 9 | Fixed vs variable pay | Stacked bar | `{ label, avgFixed, avgVariable }` (overall; optional by sector) | yes |
| 10 | Company-car fuel mix | Donut | `{ fuelType: electric \| hybrid \| fuel, count }` | no |
| 11 | Equity adoption | Stat card + small bar | `{ withEquityPct, total, byWorkerType: {workerType, pct, count}[] }` | no |

Notes:
- Charts 5 and 6 exclude entries with null satisfaction. Chart 6 also requires
  `commuteTimeMinutes`.
- Chart 10 only considers entries where `hasCompanyCar === true` and `companyCarFuelType`
  is set.
- Chart 9 averages `fixedGrossSalary` and `variableGrossSalary` over entries where at least
  one is non-null.
- Enum values (`workerType`, `contractType`, `companyCarFuelType`) render via i18n-backed
  human-readable labels, not raw enum keys.

## New types (`statistics.types.ts`)

```ts
export interface SatisfactionBucket { score: number; count: number; }
export interface SatisfactionVsPay { score: number; medianSalary: number; count: number; }
export interface SectorSatisfaction { sector: string; avgSatisfaction: number; count: number; }
export interface WorkerTypeSatisfaction { workerType: string; avgSatisfaction: number; count: number; }
export interface PerkSatisfaction { perk: string; withPerk: number; withoutPerk: number; }
export interface CommuteSatisfaction { band: string; avgSatisfaction: number; count: number; }
export interface WorkerTypeStat { workerType: string; count: number; medianSalary: number; }
export interface ContractTypeStat { contractType: string; count: number; medianSalary: number; }
export interface FixedVariablePay { label: string; avgFixed: number; avgVariable: number; }
export interface FuelMix { fuelType: string; count: number; }
export interface EquityAdoption {
  withEquityPct: number;
  total: number;
  byWorkerType: { workerType: string; pct: number; count: number }[];
}
```

## Cross-cutting concerns

- **Currency/period:** salary-based charts convert inside `BeyondPaySection` before passing
  a `getSalary` accessor into the pure functions. Scores are unitless.
- **i18n:** all labels/titles through `next-intl` under a `statistics.beyondPay.*` namespace,
  matching existing chart components.
- **Loading:** each chart shows the existing skeleton pattern while `loading` is true.
- **Export:** section title/data flow into the existing CSV/PDF export where applicable
  (satisfaction summary rows); not blocking for v1 of this feature.
- **Empty/thin data:** gating + per-bucket floor as above; captions state sample size.

## Testing

- Unit tests for every pure aggregation function in `beyond-pay.test.ts`. Assert bucketing,
  averaging, median via `d3-array`, floor filtering, and empty/null handling.
- Manual verification: statistics page renders the section only when ≥ 30 v2 entries are in
  the filtered set; filters (worker type, company car, equity) correctly reshape the charts.

## Risks / open considerations

- **Data volume:** with few v2 entries the section stays hidden; that is intended and the
  placeholder communicates it.
- **`statistics-client.tsx` size:** already 539 lines; Approach B avoids growing it further
  by keeping compute + rendering in the new module/section.
- **Threshold tuning:** `MIN_V2_ENTRIES` / `MIN_BUCKET` are constants and easy to adjust once
  real v2 volume is known.
