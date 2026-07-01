/**
 * A ranked ledger list — rank · label · count — with a faint brand bar behind
 * each row scaled to its share. Used for top sectors / countries.
 */
export function LedgerList({
  items,
  emptyLabel = "No data yet",
}: Readonly<{
  items: { label: string; count: number }[];
  emptyLabel?: string;
}>) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <ul className="divide-y divide-border">
      {items.map((item, i) => (
        <li
          key={item.label}
          className="relative flex items-center justify-between gap-3 px-1 py-2.5"
        >
          <span
            className="absolute inset-y-1 left-0 rounded-sm bg-brand/10"
            style={{ width: `${(item.count / max) * 100}%` }}
            aria-hidden="true"
          />
          <span className="relative flex min-w-0 items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-muted-foreground/50">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="truncate text-sm text-foreground">{item.label}</span>
          </span>
          <span className="relative font-mono text-sm tabular-nums text-muted-foreground">
            {item.count.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
