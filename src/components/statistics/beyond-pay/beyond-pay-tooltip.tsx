"use client";

/**
 * Lightweight, self-consistent tooltip for the "Beyond Pay" charts.
 *
 * Values passed in are already in display units (the section converts salary to the
 * user's currency/period before charting), so this tooltip only formats — it never
 * re-converts. Recharts injects `active`/`payload`/`label`; the other props are set
 * per-chart via `content={<BeyondPayTooltip ... />}`.
 */
interface BeyondPayTooltipProps {
  readonly active?: boolean;
  readonly payload?: any[];
  readonly label?: unknown;
  /** Format a raw value for a given dataKey (e.g. money vs "7/10" vs plain count). */
  readonly formatValue?: (value: number, key: string) => string;
  /** Map the header (category / pie slice name) to a display label. */
  readonly formatLabel?: (label: unknown) => string;
  /** Map a dataKey to a human-readable series name. */
  readonly nameFor?: (key: string) => string;
  /** Extra datum keys to render as rows, read from the hovered row's payload. */
  readonly extraKeys?: string[];
}

export function BeyondPayTooltip({
  active,
  payload,
  label,
  formatValue,
  formatLabel,
  nameFor,
  extraKeys = [],
}: BeyondPayTooltipProps) {
  if (!active || !payload?.length) return null;

  const headerRaw = label ?? payload[0]?.name ?? payload[0]?.payload?.name;
  const header = formatLabel ? formatLabel(headerRaw) : String(headerRaw ?? "");
  const datum = payload[0]?.payload ?? {};

  const fmt = (value: number, key: string) =>
    formatValue ? formatValue(value, key) : String(value);
  const name = (key: string) => (nameFor ? nameFor(key) : key);

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
      {header ? (
        <div className="text-foreground font-medium text-sm mb-2 border-b border-border pb-1">
          {header}
        </div>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div
            key={`${entry.dataKey ?? entry.name}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload?.fill || "#ea580c" }}
              />
              <span className="text-muted-foreground text-sm">{name(entry.dataKey)}</span>
            </div>
            <span className="text-foreground font-medium text-sm">
              {fmt(entry.value, entry.dataKey)}
            </span>
          </div>
        ))}
        {extraKeys
          .filter((key) => datum[key] !== undefined && datum[key] !== null)
          .map((key) => (
            <div key={`extra-${key}`} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground text-sm pl-5">{name(key)}</span>
              <span className="text-foreground font-medium text-sm">{fmt(datum[key], key)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
