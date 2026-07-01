"use client";

import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const BRAND = "#ea580c";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  padding: "6px 10px",
} as const;

function EmptyChart({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex h-[120px] items-center justify-center font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60">
      {label}
    </div>
  );
}

/** 30-day submissions area sparkline, drawn in brand. */
export function SubmissionsSparkline({
  data,
}: Readonly<{ data: { date: string; count: number }[] }>) {
  if (data.length === 0) return <EmptyChart label="No submissions in this window" />;

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
          <defs>
            <linearGradient id="ww-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
            itemStyle={{ color: "var(--foreground)" }}
            formatter={(value) => [`${value}`, "Entries"]}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#ww-spark)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface QueueBreakdown {
  approved: number;
  pending: number;
  needsReview: number;
  rejected: number;
}

/** Queue-composition donut with a mono legend. Brand marks the actionable slices. */
export function QueueDonut({ queue }: Readonly<{ queue: QueueBreakdown }>) {
  const data = [
    { name: "Approved", value: queue.approved, color: "#78716c" },
    { name: "Pending", value: queue.pending, color: "#fb923c" },
    { name: "Needs review", value: queue.needsReview, color: BRAND },
    { name: "Rejected", value: queue.rejected, color: "#a8a29e" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return <EmptyChart label="No entries yet" />;

  return (
    <div className="flex items-center gap-5">
      <div className="h-[120px] w-[120px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={38}
              outerRadius={56}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={{ color: "var(--foreground)" }}
              formatter={(value, name) => [`${value}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: d.color }}
                aria-hidden="true"
              />
              {d.name}
            </span>
            <span className="font-mono tabular-nums text-foreground">
              {d.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
